"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationHandler = createConversationHandler;
exports.getConversationHandler = getConversationHandler;
const errors_1 = require("../../utils/errors");
/**
 * POST /conversations
 * Creates a new conversation for the given user_id.
 * Requirements: 8.1
 */
function createConversationHandler(conversationRepo) {
    return async (req, res, next) => {
        try {
            const { user_id } = req.body;
            if (!user_id || user_id.trim() === '') {
                res.status(400).json({
                    error: {
                        error_code: 'VALIDATION_ERROR',
                        message: 'Field "user_id" is required and must not be empty',
                    },
                });
                return;
            }
            const conversation = await conversationRepo.create(user_id);
            res.status(201).json(conversation);
        }
        catch (err) {
            next(err);
        }
    };
}
/**
 * GET /conversations/:id
 * Retrieves a conversation and its messages.
 * Returns 404 if the conversation does not exist.
 * Requirements: 8.2
 */
function getConversationHandler(conversationRepo, messageRepo) {
    return async (req, res, next) => {
        try {
            const { id } = req.params;
            const conversation = await conversationRepo.findById(id);
            if (!conversation) {
                throw new errors_1.NotFoundError('Conversation', id);
            }
            const messages = await messageRepo.findByConversationId(id);
            res.status(200).json({
                ...conversation,
                messages,
            });
        }
        catch (err) {
            next(err);
        }
    };
}
//# sourceMappingURL=conversations.js.map