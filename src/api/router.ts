import { Router } from 'express';
import type { Orchestrator } from '../orchestrator/orchestrator';
import type { ConversationRepository } from '../persistence/repositories/conversation-repository';
import type { MessageRepository } from '../persistence/repositories/message-repository';
import type { HookSystem } from '../hooks/hook-system';
import { createConversationHandler, getConversationHandler } from './handlers/conversations';
import { sendMessageHandler } from './handlers/messages';
import { flagMessageHandler, listFlagsHandler } from './handlers/moderation';
import { validateFields } from './middleware/validate-request';
import { createErrorHandler } from './middleware/error-handler';

export function createRouter(
  orchestrator: Orchestrator,
  conversationRepo: ConversationRepository,
  messageRepo: MessageRepository,
  hookSystem: HookSystem
): Router {
  const router = Router();

  // POST /conversations — create a new conversation
  router.post('/conversations', createConversationHandler(conversationRepo));

  // GET /conversations/:id — retrieve conversation with messages
  router.get('/conversations/:id', getConversationHandler(conversationRepo, messageRepo));

  // POST /conversations/:id/messages — send a message
  router.post(
    '/conversations/:id/messages',
    validateFields(['content', 'provider', 'model']),
    sendMessageHandler(orchestrator)
  );

  // POST /moderation/flag — report AI-generated content (store-compliance)
  router.post('/moderation/flag', flagMessageHandler());

  // GET /moderation/flags — internal review (protect with auth in production)
  router.get('/moderation/flags', listFlagsHandler());

  // Global error handler (must be last)
  router.use(createErrorHandler(hookSystem));

  return router;
}
