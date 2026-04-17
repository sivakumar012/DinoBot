/**
 * Unit tests for the Orchestrator 7-step pipeline.
 * All external dependencies are mocked.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from '../../../src/orchestrator/orchestrator';
import type { ProviderRegistry } from '../../../src/providers/registry';
import type { ContextEngine } from '../../../src/context-engine/context-engine';
import type { HookSystem } from '../../../src/hooks/hook-system';
import type { ConversationRepository } from '../../../src/persistence/repositories/conversation-repository';
import type { MessageRepository } from '../../../src/persistence/repositories/message-repository';
import type { UsageLogRepository } from '../../../src/persistence/repositories/usage-log-repository';
import type { LLMResponse } from '../../../src/types/llm-response';
import { DEFAULT_COST_RATES } from '../../../src/persistence/cost-rates';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeSuccessResponse(overrides: Partial<LLMResponse> = {}): LLMResponse {
  return {
    content: 'assistant response',
    tokens_in: 100,
    tokens_out: 50,
    latency_ms: 200,
    model: 'gpt-4o',
    ...overrides,
  };
}

function makeErrorResponse(errorCode = 'OPENAI_ERROR'): LLMResponse {
  return {
    content: '',
    tokens_in: 0,
    tokens_out: 0,
    latency_ms: 100,
    model: 'gpt-4o',
    error: { error_code: errorCode, message: 'Provider failed' },
  };
}

function makeMocks(llmResponse: LLMResponse = makeSuccessResponse()) {
  const callOrder: string[] = [];

  const mockProvider = {
    generateResponse: vi.fn().mockImplementation(async () => {
      callOrder.push('generateResponse');
      return llmResponse;
    }),
  };

  const mockRegistry = {
    resolve: vi.fn().mockReturnValue(mockProvider),
  } as unknown as ProviderRegistry;

  const mockContextEngine = {
    buildContext: vi.fn().mockImplementation(() => {
      callOrder.push('buildContext');
      return { messages: [{ role: 'user', content: 'hello' }], trimmedCount: 0 };
    }),
  } as unknown as ContextEngine;

  const mockHookSystem = {
    dispatch: vi.fn().mockImplementation(async (event: string) => {
      callOrder.push(`dispatch:${event}`);
    }),
  } as unknown as HookSystem;

  const mockConversationRepo = {
    findById: vi.fn().mockResolvedValue({ id: 'conv-1', user_id: 'user-1', created_at: '', updated_at: '' }),
    touch: vi.fn().mockImplementation(async () => { callOrder.push('touch'); }),
  } as unknown as ConversationRepository;

  const mockMessageRepo = {
    findByConversationId: vi.fn().mockImplementation(async () => {
      callOrder.push('findByConversationId');
      return [];
    }),
    save: vi.fn().mockImplementation(async (msg: { role: string }) => {
      callOrder.push(`saveMessage:${msg.role}`);
      return { ...msg, id: `msg-${msg.role}`, created_at: new Date().toISOString() };
    }),
  } as unknown as MessageRepository;

  const mockUsageLogRepo = {
    save: vi.fn().mockImplementation(async (log: unknown) => {
      callOrder.push('saveUsageLog');
      return { ...(log as object), id: 'log-1', created_at: new Date().toISOString() };
    }),
    findByConversationId: vi.fn().mockResolvedValue([]),
  } as unknown as UsageLogRepository;

  const orchestrator = new Orchestrator(
    mockRegistry,
    mockContextEngine,
    mockHookSystem,
    { conversations: mockConversationRepo, messages: mockMessageRepo, usageLogs: mockUsageLogRepo },
    DEFAULT_COST_RATES
  );

  return {
    orchestrator,
    callOrder,
    mockRegistry,
    mockContextEngine,
    mockHookSystem,
    mockConversationRepo,
    mockMessageRepo,
    mockUsageLogRepo,
    mockProvider,
  };
}

const BASE_REQUEST = {
  conversation_id: 'conv-1',
  content: 'hello',
  provider: 'openai',
  model: 'gpt-4o',
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Orchestrator', () => {
  describe('7-step pipeline ordering', () => {
    it('executes steps in the correct order', async () => {
      const { orchestrator, callOrder } = makeMocks();
      await orchestrator.process(BASE_REQUEST);

      // Step 1: load history
      expect(callOrder[0]).toBe('findByConversationId');
      // Step 2: beforeRequest hook
      expect(callOrder[1]).toBe('dispatch:beforeRequest');
      // Step 3: context engine
      expect(callOrder[2]).toBe('buildContext');
      // Step 4: provider call
      expect(callOrder[3]).toBe('generateResponse');
      // Step 5: afterResponse hook
      expect(callOrder[4]).toBe('dispatch:afterResponse');
      // Step 6: persist (user message, assistant message, usage log)
      expect(callOrder).toContain('saveMessage:user');
      expect(callOrder).toContain('saveMessage:assistant');
      expect(callOrder).toContain('saveUsageLog');
    });

    it('calls registry.resolve with the correct provider name', async () => {
      const { orchestrator, mockRegistry } = makeMocks();
      await orchestrator.process({ ...BASE_REQUEST, provider: 'anthropic' });
      expect(mockRegistry.resolve).toHaveBeenCalledWith('anthropic');
    });

    it('calls contextEngine.buildContext with the model', async () => {
      const { orchestrator, mockContextEngine } = makeMocks();
      await orchestrator.process({ ...BASE_REQUEST, model: 'gpt-4o-mini' });
      expect(mockContextEngine.buildContext).toHaveBeenCalledWith(
        expect.any(Array),
        'gpt-4o-mini'
      );
    });

    it('passes temperature and max_tokens to generateResponse', async () => {
      const { orchestrator, mockProvider } = makeMocks();
      await orchestrator.process({ ...BASE_REQUEST, temperature: 0.7, max_tokens: 512 });
      expect(mockProvider.generateResponse).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 0.7, max_tokens: 512 })
      );
    });

    it('touches the conversation after successful persistence', async () => {
      const { orchestrator, mockConversationRepo } = makeMocks();
      await orchestrator.process(BASE_REQUEST);
      expect(mockConversationRepo.touch).toHaveBeenCalledWith('conv-1');
    });
  });

  describe('successful response', () => {
    it('returns OrchestratorResult with message and usage', async () => {
      const { orchestrator } = makeMocks();
      const result = await orchestrator.process(BASE_REQUEST);

      expect(result.message.role).toBe('assistant');
      expect(result.message.content).toBe('assistant response');
      expect(result.message.model_used).toBe('gpt-4o');
      expect(typeof result.message.id).toBe('string');
      expect(typeof result.message.created_at).toBe('string');

      expect(result.usage.provider).toBe('openai');
      expect(result.usage.model).toBe('gpt-4o');
      expect(result.usage.tokens_in).toBe(100);
      expect(result.usage.tokens_out).toBe(50);
      expect(result.error).toBeUndefined();
    });

    it('calculates estimated_cost from cost rates', async () => {
      const { orchestrator } = makeMocks(makeSuccessResponse({ tokens_in: 1000, tokens_out: 1000 }));
      const result = await orchestrator.process(BASE_REQUEST);
      // gpt-4o: 0.005 input + 0.015 output per 1k tokens
      expect(result.usage.estimated_cost).toBeCloseTo(0.005 + 0.015, 5);
    });

    it('saves both user and assistant messages', async () => {
      const { orchestrator, mockMessageRepo } = makeMocks();
      await orchestrator.process(BASE_REQUEST);
      const saveCalls = (mockMessageRepo.save as ReturnType<typeof vi.fn>).mock.calls;
      const roles = saveCalls.map((c: [{ role: string }]) => c[0].role);
      expect(roles).toContain('user');
      expect(roles).toContain('assistant');
    });
  });

  describe('provider error handling', () => {
    it('returns structured error result when provider returns error', async () => {
      const { orchestrator } = makeMocks(makeErrorResponse('OPENAI_ERROR'));
      const result = await orchestrator.process(BASE_REQUEST);

      expect(result.error).toBeDefined();
      expect(result.error!.error_code).toBe('OPENAI_ERROR');
      expect(result.error!.provider).toBe('openai');
      expect(result.error!.model).toBe('gpt-4o');
    });

    it('dispatches onError hook when provider returns error', async () => {
      const { orchestrator, mockHookSystem } = makeMocks(makeErrorResponse());
      await orchestrator.process(BASE_REQUEST);
      expect(mockHookSystem.dispatch).toHaveBeenCalledWith('onError', expect.any(Object));
    });

    it('persists a UsageLog with error_status when provider fails', async () => {
      const { orchestrator, mockUsageLogRepo } = makeMocks(makeErrorResponse('OPENAI_ERROR'));
      await orchestrator.process(BASE_REQUEST);
      const saveCalls = (mockUsageLogRepo.save as ReturnType<typeof vi.fn>).mock.calls;
      expect(saveCalls.length).toBeGreaterThanOrEqual(1);
      const errorLog = saveCalls.find((c: [{ error_status: string }]) => c[0].error_status === 'OPENAI_ERROR');
      expect(errorLog).toBeDefined();
    });

    it('does not save messages when provider fails', async () => {
      const { orchestrator, mockMessageRepo } = makeMocks(makeErrorResponse());
      await orchestrator.process(BASE_REQUEST);
      expect(mockMessageRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('error path — database failure', () => {
    it('dispatches onError hook when message save fails', async () => {
      const { orchestrator, mockHookSystem, mockMessageRepo } = makeMocks();
      (mockMessageRepo.save as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('DB write failed')
      );
      await expect(orchestrator.process(BASE_REQUEST)).rejects.toThrow('DB write failed');
      expect(mockHookSystem.dispatch).toHaveBeenCalledWith('onError', expect.any(Object));
    });
  });

  describe('hook dispatch', () => {
    it('dispatches beforeRequest with conversation context', async () => {
      const { orchestrator, mockHookSystem } = makeMocks();
      await orchestrator.process(BASE_REQUEST);
      expect(mockHookSystem.dispatch).toHaveBeenCalledWith(
        'beforeRequest',
        expect.objectContaining({
          conversation_id: 'conv-1',
          provider: 'openai',
          model: 'gpt-4o',
        })
      );
    });

    it('dispatches afterResponse with response and usage data', async () => {
      const { orchestrator, mockHookSystem } = makeMocks();
      await orchestrator.process(BASE_REQUEST);
      expect(mockHookSystem.dispatch).toHaveBeenCalledWith(
        'afterResponse',
        expect.objectContaining({
          response: expect.objectContaining({ content: 'assistant response' }),
          usage: expect.objectContaining({ provider: 'openai' }),
        })
      );
    });
  });
});
