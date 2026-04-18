"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fifoTrim = void 0;
/**
 * FIFO trimming strategy: removes oldest non-system messages first
 * until the token count is under the limit.
 * System messages are always preserved.
 * Requirements: 4.2, 4.3
 */
const fifoTrim = (messages, tokenLimit, countTokens) => {
    // Separate system messages from conversation messages
    const systemMessages = messages.filter((m) => m.role === 'system');
    const conversationMessages = messages.filter((m) => m.role !== 'system');
    // If already under limit, return as-is
    if (countTokens(messages) <= tokenLimit) {
        return { trimmed: messages, removedCount: 0 };
    }
    // Remove oldest conversation messages until under limit
    let removedCount = 0;
    let candidate = [...systemMessages, ...conversationMessages];
    while (countTokens(candidate) > tokenLimit && conversationMessages.length > removedCount) {
        removedCount++;
        candidate = [...systemMessages, ...conversationMessages.slice(removedCount)];
    }
    return { trimmed: candidate, removedCount };
};
exports.fifoTrim = fifoTrim;
//# sourceMappingURL=fifo-trim.js.map