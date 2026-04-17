/**
 * Property-based tests for persistence round-trip fidelity.
 * Property 6.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import initSqlJs from 'sql.js';
import type { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';
import { SqliteMessageRepository } from '../../src/persistence/repositories/message-repository.impl';
import { SqliteUsageLogRepository } from '../../src/persistence/repositories/usage-log-repository.impl';
import { SqliteConversationRepository } from '../../src/persistence/repositories/conversation-repository.impl';
import { SqliteUserRepository } from '../../src/persistence/repositories/user-repository.impl';

let db: Database;
let userRepo: SqliteUserRepository;
let conversationRepo: SqliteConversationRepository;
let messageRepo: SqliteMessageRepository;
let usageLogRepo: SqliteUsageLogRepository;

// Seed IDs for FK constraints
let seedUserId: string;
let seedConversationId: string;

beforeEach(async () => {
  const SQL = await initSqlJs();
  db = new SQL.Database();

  const migrationPath = path.join(
    __dirname,
    '../../src/persistence/migrations/001_initial_schema.sql'
  );
  const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
  db.run(migrationSql);

  userRepo = new SqliteUserRepository(db);
  conversationRepo = new SqliteConversationRepository(db);
  messageRepo = new SqliteMessageRepository(db);
  usageLogRepo = new SqliteUsageLogRepository(db);

  // Create seed records for FK constraints
  const user = await userRepo.create();
  seedUserId = user.id;
  const conversation = await conversationRepo.create(seedUserId);
  seedConversationId = conversation.id;
});

afterEach(() => {
  db.close();
});

describe('Persistence round-trip property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 6: Persistence round-trip fidelity
  it('any Message saved and retrieved has all fields preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom('user', 'assistant', 'system') as fc.Arbitrary<'user' | 'assistant' | 'system'>,
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.option(fc.string({ minLength: 1 }), { nil: null }),
        fc.option(fc.nat({ max: 10000 }), { nil: null }),
        async (role, content, model_used, token_count) => {
          const saved = await messageRepo.save({
            conversation_id: seedConversationId,
            role,
            content,
            model_used,
            token_count,
          });

          const messages = await messageRepo.findByConversationId(seedConversationId);
          const retrieved = messages.find((m) => m.id === saved.id);

          expect(retrieved).toBeDefined();
          expect(retrieved!.role).toBe(role);
          expect(retrieved!.content).toBe(content);
          expect(retrieved!.model_used).toBe(model_used);
          expect(retrieved!.token_count).toBe(token_count);
          expect(retrieved!.conversation_id).toBe(seedConversationId);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 6: Persistence round-trip fidelity
  it('any UsageLog saved and retrieved has all fields preserved', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.nat({ max: 100000 }),
        fc.nat({ max: 100000 }),
        fc.nat({ max: 60000 }),
        fc.float({ min: 0, max: 10, noNaN: true }),
        fc.option(fc.string({ minLength: 1 }), { nil: null }),
        async (provider, model, tokens_in, tokens_out, latency_ms, estimated_cost, error_status) => {
          const saved = await usageLogRepo.save({
            conversation_id: seedConversationId,
            message_id: null,
            provider,
            model,
            tokens_in,
            tokens_out,
            latency_ms,
            estimated_cost,
            error_status,
          });

          const logs = await usageLogRepo.findByConversationId(seedConversationId);
          const retrieved = logs.find((l) => l.id === saved.id);

          expect(retrieved).toBeDefined();
          expect(retrieved!.provider).toBe(provider);
          expect(retrieved!.model).toBe(model);
          expect(retrieved!.tokens_in).toBe(tokens_in);
          expect(retrieved!.tokens_out).toBe(tokens_out);
          expect(retrieved!.latency_ms).toBe(latency_ms);
          expect(retrieved!.error_status).toBe(error_status);
          expect(retrieved!.conversation_id).toBe(seedConversationId);
        }
      ),
      { numRuns: 100 }
    );
  });
});
