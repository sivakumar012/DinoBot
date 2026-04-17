/**
 * Unit tests for the message send handler.
 */
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { sendMessageHandler } from '../../../src/api/handlers/messages';
import type { Orchestrator } from '../../../src/orchestrator/orchestrator';
import { ProviderError } from '../../../src/utils/errors';

function makeRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

const MOCK_RESULT = {
  message: {
    id: 'msg-1',
    role: 'assistant' as const,
    content: 'Hello!',
    model_used: 'gpt-4o',
    created_at: '2024-01-01T00:00:00.000Z',
  },
  usage: {
    provider: 'openai',
    model: 'gpt-4o',
    tokens_in: 100,
    tokens_out: 50,
    latency_ms: 200,
    estimated_cost: 0.001,
    error_status: null,
  },
};

describe('sendMessageHandler', () => {
  it('returns 200 with message and usage on success', async () => {
    const mockOrchestrator = {
      process: vi.fn().mockResolvedValue(MOCK_RESULT),
    } as unknown as Orchestrator;

    const handler = sendMessageHandler(mockOrchestrator);
    const req = {
      params: { id: 'conv-1' },
      body: { content: 'hello', provider: 'openai', model: 'gpt-4o' },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: MOCK_RESULT.message,
      usage: MOCK_RESULT.usage,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('passes conversation_id from params to orchestrator', async () => {
    const mockOrchestrator = {
      process: vi.fn().mockResolvedValue(MOCK_RESULT),
    } as unknown as Orchestrator;

    const handler = sendMessageHandler(mockOrchestrator);
    const req = {
      params: { id: 'conv-abc' },
      body: { content: 'hi', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(mockOrchestrator.process).toHaveBeenCalledWith(
      expect.objectContaining({ conversation_id: 'conv-abc' })
    );
  });

  it('passes optional temperature and max_tokens to orchestrator', async () => {
    const mockOrchestrator = {
      process: vi.fn().mockResolvedValue(MOCK_RESULT),
    } as unknown as Orchestrator;

    const handler = sendMessageHandler(mockOrchestrator);
    const req = {
      params: { id: 'conv-1' },
      body: { content: 'hi', provider: 'openai', model: 'gpt-4o', temperature: 0.5, max_tokens: 256 },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(mockOrchestrator.process).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.5, max_tokens: 256 })
    );
  });

  it('calls next(ProviderError) when orchestrator returns an error result', async () => {
    const errorResult = {
      ...MOCK_RESULT,
      error: {
        error_code: 'OPENAI_ERROR',
        message: 'Rate limit exceeded',
        provider: 'openai',
        model: 'gpt-4o',
      },
    };
    const mockOrchestrator = {
      process: vi.fn().mockResolvedValue(errorResult),
    } as unknown as Orchestrator;

    const handler = sendMessageHandler(mockOrchestrator);
    const req = {
      params: { id: 'conv-1' },
      body: { content: 'hello', provider: 'openai', model: 'gpt-4o' },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ProviderError));
  });

  it('calls next(err) when orchestrator throws', async () => {
    const mockOrchestrator = {
      process: vi.fn().mockRejectedValue(new Error('Unexpected error')),
    } as unknown as Orchestrator;

    const handler = sendMessageHandler(mockOrchestrator);
    const req = {
      params: { id: 'conv-1' },
      body: { content: 'hello', provider: 'openai', model: 'gpt-4o' },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
