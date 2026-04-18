import type { UnifiedMessage } from '../types/unified-message';
/**
 * Approximate token counter using a word-based heuristic.
 * Estimates ~1.3 tokens per word, which is a reasonable approximation
 * for English text without requiring a full tokenizer dependency.
 * Requirements: 4.2
 */
export declare function countTokens(messages: UnifiedMessage[]): number;
//# sourceMappingURL=token-counter.d.ts.map