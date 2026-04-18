import type { UnifiedMessage } from '../types/unified-message';
import type { TrimStrategy } from './strategies/fifo-trim';
export type { TrimStrategy };
export interface ContextEngineOptions {
    trimStrategy: TrimStrategy;
    modelTokenLimits: Record<string, number>;
}
export interface BuildContextResult {
    messages: UnifiedMessage[];
    trimmedCount: number;
}
/**
 * Assembles and trims conversation context for a given model.
 * Delegates trimming to an injected strategy (V1: FIFO, V2+: replaceable).
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6
 */
export declare class ContextEngine {
    private options;
    constructor(options: ContextEngineOptions);
    buildContext(history: UnifiedMessage[], model: string): BuildContextResult;
}
//# sourceMappingURL=context-engine.d.ts.map