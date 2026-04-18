import type { UnifiedMessage } from '../../types/unified-message';
export interface TrimResult {
    trimmed: UnifiedMessage[];
    removedCount: number;
}
export type TrimStrategy = (messages: UnifiedMessage[], tokenLimit: number, countTokens: (msgs: UnifiedMessage[]) => number) => TrimResult;
/**
 * FIFO trimming strategy: removes oldest non-system messages first
 * until the token count is under the limit.
 * System messages are always preserved.
 * Requirements: 4.2, 4.3
 */
export declare const fifoTrim: TrimStrategy;
//# sourceMappingURL=fifo-trim.d.ts.map