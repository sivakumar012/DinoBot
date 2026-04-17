/**
 * Property-based tests for usage tracking and cost calculation.
 * Properties 11, 12.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { calculateCost, DEFAULT_COST_RATES } from '../../src/persistence/cost-rates';
import type { CostRateTable } from '../../src/persistence/cost-rates';
import { Orchestrator } from '../../src/orchestrator/orchestrator';
import type { ProviderRegistry } from '../../src/providers/registry';
import type { ContextEngine } from '../../src/context-engine/context-engine';
import type { HookSystem } from '../../src/hooks/hook-system';
import type { ConversationRepository } from '../../src/persistence/repositories/conversation-repository';
import type { MessageRepository } from '../../src/persistence/repositories/message-repository';
import type { UsageLogRepository } from '../../src/persistence/repositories/usage-log-repository';

describe('Usage tracking property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 12: Cost calculation correctness
  it('calculateCost returns (tokensIn/1000)*inputRate + (tokensOut/1000)*outputRate for known models', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1_000_000 }),
        fc.nat({ max: 1_000_000 }),
        (tokensIn, tokensOut) => {
          const inputRate = 0.005;
          const outputRate = 0.015;
          const rates: CostRateTable = {
            openai: {
              'gpt-4o': { input_per_1k_tokens: inputRate, output_per_1k_tokens: outputRate },
            },
          };

          const result = calculateCost(rates, 'openai', 'gpt-4o', tokensIn, tokensOut);
          const expected = (tokensIn / 1000) * inputRate + (tokensOut / 1000) * outputRate;

          expect(result).toBeCloseTo(expected, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 12: Cost calculation correctness
  it('calculateCost returns 0 for any unknown provider/model combination', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => !['openai', 'anthropic'].includes(s)),
        fc.string({ minLength: 1 }),
        fc.nat({ max: 100_000 }),
        fc.nat({ max: 100_000 }),
        (provider, model, tokensIn, tokensOut) => {
          const result = calculateCost(DEFAULT_COST_RATES, provider, model, tokensIn, tokensOut);
          return result === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 12: Cost calculation correctness
  it('calculateCost is always non-negative for any valid inputs', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('openai', 'anthropic'),
        fc.constantFrom('gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet-20241022'),
        fc.nat({ max: 1_000_000 }),
        fc.nat({ max: 1_000_000 }),
        (provider, model, tokensIn, tokensOut) => {
          const result = calculateCost(DEFAULT_COST_RATES, provider, model, tokensIn, tokensOut);
          return result >= 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 11: Universal UsageLog persistence
  it('a UsageLog is persisted for any successful provider response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.nat({ max: 10000 }),
        fc.nat({ max: 10000 }),
        async (provider, model, tokensIn, tokensOut) => {
          const savedLogs: unknown[] = [];

          const mockRegistry = {
            resolve: vi.fn().mockReturnValue({
              generateResponse: vi.fn().mockResolvedValue({
                content: 'response',
                tokens_in: tokensIn,
                tokens_out: tokensOut,
                latency_ms: 100,
                model,
              }),
            }),
          } as unknown as ProviderRegistry;

          const mockContextEngine = {
            buildContext: vi.fn().mockReturnValue({
              messages: [{ role: 'user', content: 'hello' }],
              trimmedCount: 0,
            }),
          } as unknown as ContextEngine;

          const mockHookSystem = {
            dispatch: vi.fn().mockResolvedValue(undefined),
          } as unknown as HookSystem;

          const mockConversationRepo = {
            findById: vi.fn().mockResolvedValue({ id: 'conv-1', user_id: 'user-1', created_at: '', updated_at: '' }),
            touch: vi.fn().mockResolvedValue(undefined),
          } as unknown as ConversationRepository;

          const mockMessageRepo = {
            findByConversationId: vi.fn().mockResolvedValue([]),
            save: vi.fn().mockImplementation((msg: unknown) =>
              Promise.resolve({ ...(msg as object), id: 'msg-1', created_at: new Date().toISOString() })
            ),
          } as unknown as MessageRepository;

          const mockUsageLogRepo = {
            save: vi.fn().mockImplementation((log: unknown) => {
              savedLogs.push(log);
              return Promise.resolve({ ...(log as object), id: 'log-1', created_at: new Date().toISOString() });
            }),
            findByConversationId: vi.fn().mockResolvedValue([]),
          } as unknown as UsageLogRepository;

          const orchestrator = new Orchestrator(
            mockRegistry,
            mockContextEngine,
            mockHookSystem,
            {
              conversations: mockConversationRepo,
              messages: mockMessageRepo,
              usageLogs: mockUsageLogRepo,
            },
            DEFAULT_COST_RATES
          );

          await orchestrator.process({
            conversation_id: 'conv-1',
            content: 'hello',
            provider,
            model,
          });

          // At least one UsageLog must have been saved
          expect(savedLogs.length).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 11: Universal UsageLog persistence
  it('a UsageLog with error_status is persisted for any failed provider response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1 }),
        async (provider, model, errorCode) => {
          const savedLogs: Array<{ error_status: string | null }> = [];

          const mockRegistry = {
            resolve: vi.fn().mockReturnValue({
              generateResponse: vi.fn().mockResolvedValue({
                content: '',
                tokens_in: 0,
                tokens_out: 0,
                latency_ms: 50,
                model,
                error: { error_code: errorCode, message: 'Provider failed' },
              }),
            }),
          } as unknown as ProviderRegistry;

          const mockContextEngine = {
            buildContext: vi.fn().mockReturnValue({
              messages: [{ role: 'user', content: 'hello' }],
              trimmedCount: 0,
            }),
          } as unknown as ContextEngine;

          const mockHookSystem = {
            dispatch: vi.fn().mockResolvedValue(undefined),
          } as unknown as HookSystem;

          const mockConversationRepo = {
            findById: vi.fn().mockResolvedValue({ id: 'conv-1', user_id: 'user-1', created_at: '', updated_at: '' }),
            touch: vi.fn().mockResolvedValue(undefined),
          } as unknown as ConversationRepository;

          const mockMessageRepo = {
            findByConversationId: vi.fn().mockResolvedValue([]),
            save: vi.fn().mockImplementation((msg: unknown) =>
              Promise.resolve({ ...(msg as object), id: 'msg-1', created_at: new Date().toISOString() })
            ),
          } as unknown as MessageRepository;

          const mockUsageLogRepo = {
            save: vi.fn().mockImplementation((log: { error_status: string | null }) => {
              savedLogs.push(log);
              return Promise.resolve({ ...log, id: 'log-1', created_at: new Date().toISOString() });
            }),
            findByConversationId: vi.fn().mockResolvedValue([]),
          } as unknown as UsageLogRepository;

          const orchestrator = new Orchestrator(
            mockRegistry,
            mockContextEngine,
            mockHookSystem,
            {
              conversations: mockConversationRepo,
              messages: mockMessageRepo,
              usageLogs: mockUsageLogRepo,
            },
            DEFAULT_COST_RATES
          );

          await orchestrator.process({
            conversation_id: 'conv-1',
            content: 'hello',
            provider,
            model,
          });

          // A UsageLog must have been saved with error_status set
          expect(savedLogs.length).toBeGreaterThanOrEqual(1);
          const errorLog = savedLogs.find((l) => l.error_status !== null);
          expect(errorLog).toBeDefined();
          expect(errorLog!.error_status).toBe(errorCode);
        }
      ),
      { numRuns: 100 }
    );
  });
});
