import { Router } from 'express';
import type { Orchestrator } from '../orchestrator/orchestrator';
import type { ConversationRepository } from '../persistence/repositories/conversation-repository';
import type { MessageRepository } from '../persistence/repositories/message-repository';
import type { HookSystem } from '../hooks/hook-system';
export declare function createRouter(orchestrator: Orchestrator, conversationRepo: ConversationRepository, messageRepo: MessageRepository, hookSystem: HookSystem): Router;
//# sourceMappingURL=router.d.ts.map