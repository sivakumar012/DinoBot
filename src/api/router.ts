import { Router } from 'express';
import type { Orchestrator } from '../orchestrator/orchestrator';
import type { ConversationRepository } from '../persistence/repositories/conversation-repository';
import type { MessageRepository } from '../persistence/repositories/message-repository';
import type { HookSystem } from '../hooks/hook-system';
import { createConversationHandler, getConversationHandler } from './handlers/conversations';
import { sendMessageHandler } from './handlers/messages';
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

  // Global error handler (must be last)
  router.use(createErrorHandler(hookSystem));

  return router;
}
