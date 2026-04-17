/**
 * Property-based tests for Context Engine.
 * Properties 7, 8.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UnifiedMessage } from '../../src/types/unified-message';
import { ContextEngine } from '../../src/context-engine/context-engine';
import { fifoTrim } from '../../src/context-engine/strategies/fifo-trim';
import { countTokens } from '../../src/context-engine/token-counter';

// A small token limit to force trimming in tests
const SMALL_LIMIT = 20;
const TEST_MODEL = 'test-model';

const contextEngine = new ContextEngine({
  trimStrategy: fifoTrim,
  modelTokenLimits: { [TEST_MODEL]: SMALL_LIMIT },
});

// Arbitrary for a non-system message
const nonSystemMessage = fc.record({
  role: fc.constantFrom('user', 'assistant') as fc.Arbitrary<'user' | 'assistant'>,
  content: fc.string({ minLength: 1, maxLength: 200 }),
});

// Arbitrary for a system message
const systemMessage = fc.record({
  role: fc.constant('system' as const),
  content: fc.string({ minLength: 1, maxLength: 100 }),
});

// Arbitrary for a large message that will definitely exceed the limit
const largeMessage = fc.record({
  role: fc.constantFrom('user', 'assistant') as fc.Arbitrary<'user' | 'assistant'>,
  content: fc.string({ minLength: 200, maxLength: 500 }),
});

describe('Context Engine property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 7: Context Engine token limit enforcement
  it('output token count is always <= model token limit after buildContext', () => {
    fc.assert(
      fc.property(
        fc.array(nonSystemMessage, { minLength: 1, maxLength: 20 }),
        (messages: UnifiedMessage[]) => {
          const { messages: result } = contextEngine.buildContext(messages, TEST_MODEL);
          const tokenCount = countTokens(result);
          expect(tokenCount).toBeLessThanOrEqual(SMALL_LIMIT);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 7: Context Engine token limit enforcement
  it('output token count is <= limit even for very large inputs', () => {
    fc.assert(
      fc.property(
        fc.array(largeMessage, { minLength: 1, maxLength: 10 }),
        (messages: UnifiedMessage[]) => {
          const { messages: result } = contextEngine.buildContext(messages, TEST_MODEL);
          const tokenCount = countTokens(result);
          expect(tokenCount).toBeLessThanOrEqual(SMALL_LIMIT);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 8: System message preservation during trimming
  it('system message is always preserved after trimming even when over token limit', () => {
    fc.assert(
      fc.property(
        systemMessage,
        fc.array(largeMessage, { minLength: 1, maxLength: 5 }),
        (sysMsg: UnifiedMessage, otherMsgs: UnifiedMessage[]) => {
          const messages = [sysMsg, ...otherMsgs];
          const { messages: result } = contextEngine.buildContext(messages, TEST_MODEL);

          const systemInResult = result.find((m) => m.role === 'system');
          expect(systemInResult).toBeDefined();
          expect(systemInResult!.content).toBe(sysMsg.content);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 8: System message preservation during trimming
  it('system message is preserved regardless of its position in the input array', () => {
    fc.assert(
      fc.property(
        fc.array(largeMessage, { minLength: 0, maxLength: 3 }),
        systemMessage,
        fc.array(largeMessage, { minLength: 1, maxLength: 3 }),
        (before: UnifiedMessage[], sysMsg: UnifiedMessage, after: UnifiedMessage[]) => {
          const messages = [...before, sysMsg, ...after];
          const { messages: result } = contextEngine.buildContext(messages, TEST_MODEL);

          const systemInResult = result.find((m) => m.role === 'system');
          expect(systemInResult).toBeDefined();
          expect(systemInResult!.content).toBe(sysMsg.content);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 7: Context Engine token limit enforcement
  it('messages already under the limit are returned unchanged', () => {
    // Use a very large limit so nothing gets trimmed
    const bigEngine = new ContextEngine({
      trimStrategy: fifoTrim,
      modelTokenLimits: { 'big-model': 1_000_000 },
    });

    fc.assert(
      fc.property(
        fc.array(nonSystemMessage, { minLength: 1, maxLength: 5 }),
        (messages: UnifiedMessage[]) => {
          const { messages: result, trimmedCount } = bigEngine.buildContext(messages, 'big-model');
          expect(trimmedCount).toBe(0);
          expect(result).toHaveLength(messages.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
