"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageHandler = sendMessageHandler;
const errors_1 = require("../../utils/errors");
/**
 * POST /conversations/:id/messages
 * Sends a user message and returns the assistant response.
 * Delegates all orchestration to the Orchestrator.
 * Requirements: 8.3, 8.4, 8.5, 8.6
 */
function sendMessageHandler(orchestrator) {
    return async (req, res, next) => {
        try {
            const { id: conversation_id } = req.params;
            const { content, provider, model, temperature, max_tokens } = req.body;
            const result = await orchestrator.process({
                conversation_id,
                content,
                provider,
                model,
                temperature,
                max_tokens,
            });
            if (result.error) {
                throw new errors_1.ProviderError(result.error.provider, result.error.model, result.error.message);
            }
            res.status(200).json({
                message: result.message,
                usage: result.usage,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=messages.js.map