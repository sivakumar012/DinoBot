"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextEngine = void 0;
const token_counter_1 = require("./token-counter");
const logger_1 = require("../utils/logger");
/**
 * Assembles and trims conversation context for a given model.
 * Delegates trimming to an injected strategy (V1: FIFO, V2+: replaceable).
 * Requirements: 4.1, 4.2, 4.4, 4.5, 4.6
 */
class ContextEngine {
    options;
    constructor(options) {
        this.options = options;
    }
    buildContext(history, model) {
        const limit = this.options.modelTokenLimits[model] ?? 4096;
        const { trimmed, removedCount } = this.options.trimStrategy(history, limit, token_counter_1.countTokens);
        if (removedCount > 0) {
            logger_1.logger.info({ model, removedCount, reason: 'token_limit_exceeded' }, 'Context trimmed');
        }
        return { messages: trimmed, trimmedCount: removedCount };
    }
}
exports.ContextEngine = ContextEngine;
//# sourceMappingURL=context-engine.js.map