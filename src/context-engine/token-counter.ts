import type { UnifiedMessage } from '../types/unified-message';

/**
 * Approximate token counter using a word-based heuristic.
 * Estimates ~1.3 tokens per word, which is a reasonable approximation
 * for English text without requiring a full tokenizer dependency.
 * Requirements: 4.2
 */
export function countTokens(messages: UnifiedMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    // ~4 tokens overhead per message (role, formatting)
    total += 4;
    // Approximate: split on whitespace, multiply by 1.3
    const words = msg.content.trim().split(/\s+/).filter((w) => w.length > 0);
    total += Math.ceil(words.length * 1.3);
  }
  return total;
}
