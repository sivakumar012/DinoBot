import type { UnifiedMessage } from '../types/unified-message';
import type { TrimStrategy } from './strategies/fifo-trim';
import { countTokens } from './token-counter';
import { logger } from '../utils/logger';

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
export class ContextEngine {
  constructor(private options: ContextEngineOptions) {}

  buildContext(history: UnifiedMessage[], model: string): BuildContextResult {
    const limit = this.options.modelTokenLimits[model] ?? 4096;

    const { trimmed, removedCount } = this.options.trimStrategy(
      history,
      limit,
      countTokens
    );

    if (removedCount > 0) {
      logger.info(
        { model, removedCount, reason: 'token_limit_exceeded' },
        'Context trimmed'
      );
    }

    return { messages: trimmed, trimmedCount: removedCount };
  }
}
