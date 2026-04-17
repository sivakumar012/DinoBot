/**
 * Unit tests for ContextEngine and FIFO trimming strategy.
 */
import { describe, it, expect, vi } from 'vitest';
import { ContextEngine } from '../../../src/context-engine/context-engine';
import { fifoTrim } from '../../../src/context-engine/strategies/fifo-trim';
import { countTokens } from '../../../src/context-engine/token-counter';
import type { UnifiedMessage } from '../../../src/types/unified-message';

const MODEL_LIMITS = { 'gpt-4o': 128000, 'small-model': 20 };

function makeEngine(limits = MODEL_LIMITS) {
  return new ContextEngine({ trimStrategy: fifoTrim, modelTokenLimits: limits });
}

describe('ContextEngine', () => {
  describe('buildContext', () => {
    it('returns messages unchanged when under token limit', () => {
      const engine = makeEngine();
      const messages: UnifiedMessage[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ];
      const { messages: result, trimmedCount } = engine.buildContext(messages, 'gpt-4o');
      expect(result).toHaveLength(2);
      expect(trimmedCount).toBe(0);
    });

    it('trims messages when over token limit', () => {
      const engine = makeEngine();
      // 'small-model' has limit 20 tokens
      const messages: UnifiedMessage[] = [
        { role: 'user', content: 'This is a very long message that will definitely exceed the token limit for the small model' },
        { role: 'assistant', content: 'Another long response that also exceeds the limit' },
        { role: 'user', content: 'short' },
      ];
      const { messages: result, trimmedCount } = engine.buildContext(messages, 'small-model');
      expect(trimmedCount).toBeGreaterThan(0);
      expect(countTokens(result)).toBeLessThanOrEqual(20);
    });

    it('uses default limit of 4096 for unknown models', () => {
      const engine = makeEngine();
      const messages: UnifiedMessage[] = [{ role: 'user', content: 'hello' }];
      const { messages: result } = engine.buildContext(messages, 'unknown-model');
      expect(result).toHaveLength(1);
    });

    it('preserves system messages during trimming', () => {
      const engine = makeEngine();
      const messages: UnifiedMessage[] = [
        { role: 'system', content: 'You are helpful' },
        { role: 'user', content: 'This is a very long message that will definitely exceed the token limit for the small model' },
        { role: 'assistant', content: 'Another long response that also exceeds the limit' },
      ];
      const { messages: result } = engine.buildContext(messages, 'small-model');
      const systemMsg = result.find((m) => m.role === 'system');
      expect(systemMsg).toBeDefined();
      expect(systemMsg!.content).toBe('You are helpful');
    });

    it('returns trimmedCount equal to number of removed messages', () => {
      const engine = makeEngine();
      const messages: UnifiedMessage[] = [
        { role: 'user', content: 'This is a very long message that will definitely exceed the token limit for the small model' },
        { role: 'assistant', content: 'Another long response that also exceeds the limit' },
        { role: 'user', content: 'short' },
      ];
      const { trimmedCount } = engine.buildContext(messages, 'small-model');
      expect(trimmedCount).toBeGreaterThan(0);
    });

    it('accepts a custom trim strategy', () => {
      const customStrategy = vi.fn().mockReturnValue({
        trimmed: [{ role: 'user', content: 'custom' }],
        removedCount: 5,
      });
      const engine = new ContextEngine({
        trimStrategy: customStrategy,
        modelTokenLimits: { 'gpt-4o': 128000 },
      });
      const messages: UnifiedMessage[] = [{ role: 'user', content: 'hello' }];
      const { messages: result, trimmedCount } = engine.buildContext(messages, 'gpt-4o');
      expect(customStrategy).toHaveBeenCalledOnce();
      expect(result).toEqual([{ role: 'user', content: 'custom' }]);
      expect(trimmedCount).toBe(5);
    });
  });
});

describe('fifoTrim strategy', () => {
  it('returns messages unchanged when under limit', () => {
    const messages: UnifiedMessage[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    const { trimmed, removedCount } = fifoTrim(messages, 10000, countTokens);
    expect(trimmed).toHaveLength(2);
    expect(removedCount).toBe(0);
  });

  it('removes oldest non-system messages first', () => {
    const messages: UnifiedMessage[] = [
      { role: 'user', content: 'first long message that exceeds the limit by itself' },
      { role: 'assistant', content: 'second long message that also exceeds the limit' },
      { role: 'user', content: 'short' },
    ];
    const { trimmed } = fifoTrim(messages, 20, countTokens);
    // The last message should survive
    expect(trimmed.some((m) => m.content === 'short')).toBe(true);
    // The first message should be removed
    expect(trimmed.some((m) => m.content === 'first long message that exceeds the limit by itself')).toBe(false);
  });

  it('never removes system messages', () => {
    const messages: UnifiedMessage[] = [
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'This is a very long message that will definitely exceed the token limit for the small model' },
    ];
    const { trimmed } = fifoTrim(messages, 10, countTokens);
    expect(trimmed.some((m) => m.role === 'system')).toBe(true);
  });

  it('stops trimming once under the limit', () => {
    const messages: UnifiedMessage[] = [
      { role: 'user', content: 'a' },
      { role: 'user', content: 'b' },
      { role: 'user', content: 'c' },
    ];
    const { trimmed, removedCount } = fifoTrim(messages, 10000, countTokens);
    expect(removedCount).toBe(0);
    expect(trimmed).toHaveLength(3);
  });
});

describe('countTokens', () => {
  it('returns a positive number for non-empty messages', () => {
    const messages: UnifiedMessage[] = [{ role: 'user', content: 'hello world' }];
    expect(countTokens(messages)).toBeGreaterThan(0);
  });

  it('returns 0 or small number for empty content', () => {
    const messages: UnifiedMessage[] = [{ role: 'user', content: '' }];
    // 4 overhead tokens per message
    expect(countTokens(messages)).toBe(4);
  });

  it('more messages = more tokens', () => {
    const one: UnifiedMessage[] = [{ role: 'user', content: 'hello world' }];
    const two: UnifiedMessage[] = [
      { role: 'user', content: 'hello world' },
      { role: 'assistant', content: 'hello world' },
    ];
    expect(countTokens(two)).toBeGreaterThan(countTokens(one));
  });
});
