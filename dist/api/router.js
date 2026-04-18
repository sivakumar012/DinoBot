"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRouter = createRouter;
const express_1 = require("express");
const conversations_1 = require("./handlers/conversations");
const messages_1 = require("./handlers/messages");
const validate_request_1 = require("./middleware/validate-request");
const error_handler_1 = require("./middleware/error-handler");
function createRouter(orchestrator, conversationRepo, messageRepo, hookSystem) {
    const router = (0, express_1.Router)();
    // POST /conversations — create a new conversation
    router.post('/conversations', (0, conversations_1.createConversationHandler)(conversationRepo));
    // GET /conversations/:id — retrieve conversation with messages
    router.get('/conversations/:id', (0, conversations_1.getConversationHandler)(conversationRepo, messageRepo));
    // POST /conversations/:id/messages — send a message
    router.post('/conversations/:id/messages', (0, validate_request_1.validateFields)(['content', 'provider', 'model']), (0, messages_1.sendMessageHandler)(orchestrator));
    // Global error handler (must be last)
    router.use((0, error_handler_1.createErrorHandler)(hookSystem));
    return router;
}
//# sourceMappingURL=router.js.map