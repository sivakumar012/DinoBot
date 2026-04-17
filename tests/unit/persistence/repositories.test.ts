/**
 * Unit tests for repository implementations using in-memory SQLite.
 * Uses real sql.js database — never mocks the DB layer.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { SqliteUserRepository } from '../../../src/persistence/repositories/user-repository.impl';
import { SqliteConversationRepository } from '../../../src/persistence/repositories/conversation-repository.impl';
import { SqliteMessageRepository } from '../../../src/persistence/repositories/message-repository.impl';
import { SqliteUsageLogRepository } from '../../../src/persistence/repositories/usage-log-repository.impl';

let db: Database;
let userRepo: SqliteUserRepository;
let conversationRepo: SqliteConversationRepository;
let messageRepo: SqliteMessageRepository;
let usageLogRepo: SqliteUsageLogRepository;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();
  const migrationPath = path.join(
    __dirname,
    '../../../src/persistence/migrations/001_initial_schema.sql'
  );
  db.run(fs.readFileSync(migrationPath, 'utf-8'));

  userRepo = new SqliteUserRepository(db);
  conversationRepo = new SqliteConversationRepository(db);
  messageRepo = new SqliteMessageRepository(db);
  usageLogRepo = new SqliteUsageLogRepository(db);
});

afterEach(() => {
  db.close();
});

describe('UserRepository', () => {
  it('create() returns a user with id and created_at', async () => {
    const user = await userRepo.create();
    expect(typeof user.id).toBe('string');
    expect(user.id).toHaveLength(36); // UUID v4
    expect(typeof user.created_at).toBe('string');
  });

  it('findById() returns the created user', async () => {
    const user = await userRepo.create();
    const found = await userRepo.findById(user.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(user.id);
  });

  it('findById() returns null for non-existent id', async () => {
    const found = await userRepo.findById('non-existent-id');
    expect(found).toBeNull();
  });

  it('creates multiple users with unique ids', async () => {
    const u1 = await userRepo.create();
    const u2 = await userRepo.create();
    expect(u1.id).not.toBe(u2.id);
  });
});

describe('ConversationRepository', () => {
  let userId: string;

  beforeEach(async () => {
    const user = await userRepo.create();
    userId = user.id;
  });

  it('create() returns a conversation with correct fields', async () => {
    const conv = await conversationRepo.create(userId);
    expect(typeof conv.id).toBe('string');
    expect(conv.user_id).toBe(userId);
    expect(typeof conv.created_at).toBe('string');
    expect(typeof conv.updated_at).toBe('string');
  });

  it('findById() returns the created conversation', async () => {
    const conv = await conversationRepo.create(userId);
    const found = await conversationRepo.findById(conv.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(conv.id);
    expect(found!.user_id).toBe(userId);
  });

  it('findById() returns null for non-existent id', async () => {
    const found = await conversationRepo.findById('non-existent');
    expect(found).toBeNull();
  });

  it('touch() updates the updated_at timestamp', async () => {
    const conv = await conversationRepo.create(userId);
    const originalUpdatedAt = conv.updated_at;

    // Small delay to ensure timestamp differs
    await new Promise((r) => setTimeout(r, 5));
    await conversationRepo.touch(conv.id);

    const updated = await conversationRepo.findById(conv.id);
    expect(updated!.updated_at).not.toBe(originalUpdatedAt);
  });
});

describe('MessageRepository', () => {
  let conversationId: string;

  beforeEach(async () => {
    const user = await userRepo.create();
    const conv = await conversationRepo.create(user.id);
    conversationId = conv.id;
  });

  it('save() returns a message with generated id and created_at', async () => {
    const msg = await messageRepo.save({
      conversation_id: conversationId,
      role: 'user',
      content: 'hello',
      model_used: null,
      token_count: null,
    });
    expect(typeof msg.id).toBe('string');
    expect(msg.role).toBe('user');
    expect(msg.content).toBe('hello');
    expect(msg.model_used).toBeNull();
    expect(msg.token_count).toBeNull();
  });

  it('findByConversationId() returns messages in insertion order', async () => {
    await messageRepo.save({ conversation_id: conversationId, role: 'user', content: 'first', model_used: null, token_count: null });
    await messageRepo.save({ conversation_id: conversationId, role: 'assistant', content: 'second', model_used: 'gpt-4o', token_count: 10 });

    const messages = await messageRepo.findByConversationId(conversationId);
    expect(messages).toHaveLength(2);
    expect(messages[0].content).toBe('first');
    expect(messages[1].content).toBe('second');
  });

  it('findByConversationId() returns empty array for unknown conversation', async () => {
    const messages = await messageRepo.findByConversationId('unknown-id');
    expect(messages).toHaveLength(0);
  });

  it('save() preserves model_used and token_count for assistant messages', async () => {
    const msg = await messageRepo.save({
      conversation_id: conversationId,
      role: 'assistant',
      content: 'response',
      model_used: 'gpt-4o',
      token_count: 42,
    });
    expect(msg.model_used).toBe('gpt-4o');
    expect(msg.token_count).toBe(42);
  });

  it('save() handles all three roles', async () => {
    for (const role of ['system', 'user', 'assistant'] as const) {
      const msg = await messageRepo.save({
        conversation_id: conversationId,
        role,
        content: `${role} message`,
        model_used: null,
        token_count: null,
      });
      expect(msg.role).toBe(role);
    }
  });
});

describe('UsageLogRepository', () => {
  let conversationId: string;

  beforeEach(async () => {
    const user = await userRepo.create();
    const conv = await conversationRepo.create(user.id);
    conversationId = conv.id;
  });

  it('save() returns a usage log with generated id', async () => {
    const log = await usageLogRepo.save({
      conversation_id: conversationId,
      message_id: null,
      provider: 'openai',
      model: 'gpt-4o',
      tokens_in: 100,
      tokens_out: 50,
      latency_ms: 500,
      estimated_cost: 0.001,
      error_status: null,
    });
    expect(typeof log.id).toBe('string');
    expect(log.provider).toBe('openai');
    expect(log.tokens_in).toBe(100);
    expect(log.tokens_out).toBe(50);
    expect(log.error_status).toBeNull();
  });

  it('findByConversationId() returns saved logs', async () => {
    await usageLogRepo.save({
      conversation_id: conversationId,
      message_id: null,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      tokens_in: 200,
      tokens_out: 100,
      latency_ms: 800,
      estimated_cost: 0.002,
      error_status: null,
    });

    const logs = await usageLogRepo.findByConversationId(conversationId);
    expect(logs).toHaveLength(1);
    expect(logs[0].provider).toBe('anthropic');
  });

  it('save() preserves error_status for failed requests', async () => {
    const log = await usageLogRepo.save({
      conversation_id: conversationId,
      message_id: null,
      provider: 'openai',
      model: 'gpt-4o',
      tokens_in: 0,
      tokens_out: 0,
      latency_ms: 100,
      estimated_cost: 0,
      error_status: 'OPENAI_ERROR',
    });
    expect(log.error_status).toBe('OPENAI_ERROR');
  });

  it('findByConversationId() returns empty array for unknown conversation', async () => {
    const logs = await usageLogRepo.findByConversationId('unknown-id');
    expect(logs).toHaveLength(0);
  });
});
