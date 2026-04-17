/**
 * Unit tests for conversation API handlers.
 */
import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { createConversationHandler, getConversationHandler } from '../../../src/api/handlers/conversations';
import type { ConversationRepository } from '../../../src/persistence/repositories/conversation-repository';
import type { MessageRepository } from '../../../src/persistence/repositories/message-repository';
import { NotFoundError } from '../../../src/utils/errors';

function makeRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const MOCK_CONVERSATION = {
  id: 'conv-1',
  user_id: 'user-1',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
};

describe('createConversationHandler', () => {
  it('creates a conversation and returns 201', async () => {
    const mockRepo = {
      create: vi.fn().mockResolvedValue(MOCK_CONVERSATION),
    } as unknown as ConversationRepository;

    const handler = createConversationHandler(mockRepo);
    const req = { body: { user_id: 'user-1' } } as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(mockRepo.create).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(MOCK_CONVERSATION);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 400 when user_id is missing', async () => {
    const mockRepo = { create: vi.fn() } as unknown as ConversationRepository;
    const handler = createConversationHandler(mockRepo);
    const req = { body: {} } as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it('returns 400 when user_id is empty string', async () => {
    const mockRepo = { create: vi.fn() } as unknown as ConversationRepository;
    const handler = createConversationHandler(mockRepo);
    const req = { body: { user_id: '   ' } } as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('calls next(err) when repository throws', async () => {
    const mockRepo = {
      create: vi.fn().mockRejectedValue(new Error('DB error')),
    } as unknown as ConversationRepository;

    const handler = createConversationHandler(mockRepo);
    const req = { body: { user_id: 'user-1' } } as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('getConversationHandler', () => {
  it('returns conversation with messages on success', async () => {
    const mockMessages = [
      { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'hello', model_used: null, token_count: null, created_at: '' },
    ];
    const mockConvRepo = {
      findById: vi.fn().mockResolvedValue(MOCK_CONVERSATION),
    } as unknown as ConversationRepository;
    const mockMsgRepo = {
      findByConversationId: vi.fn().mockResolvedValue(mockMessages),
    } as unknown as MessageRepository;

    const handler = getConversationHandler(mockConvRepo, mockMsgRepo);
    const req = { params: { id: 'conv-1' } } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      ...MOCK_CONVERSATION,
      messages: mockMessages,
    });
  });

  it('calls next(NotFoundError) when conversation does not exist', async () => {
    const mockConvRepo = {
      findById: vi.fn().mockResolvedValue(null),
    } as unknown as ConversationRepository;
    const mockMsgRepo = {
      findByConversationId: vi.fn(),
    } as unknown as MessageRepository;

    const handler = getConversationHandler(mockConvRepo, mockMsgRepo);
    const req = { params: { id: 'non-existent' } } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    expect(mockMsgRepo.findByConversationId).not.toHaveBeenCalled();
  });

  it('calls next(err) when repository throws', async () => {
    const mockConvRepo = {
      findById: vi.fn().mockRejectedValue(new Error('DB error')),
    } as unknown as ConversationRepository;
    const mockMsgRepo = { findByConversationId: vi.fn() } as unknown as MessageRepository;

    const handler = getConversationHandler(mockConvRepo, mockMsgRepo);
    const req = { params: { id: 'conv-1' } } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as unknown as NextFunction;

    await handler(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
