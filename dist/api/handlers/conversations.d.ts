import type { Request, Response, NextFunction } from 'express';
import type { ConversationRepository } from '../../persistence/repositories/conversation-repository';
import type { MessageRepository } from '../../persistence/repositories/message-repository';
/**
 * POST /conversations
 * Creates a new conversation for the given user_id.
 * Requirements: 8.1
 */
export declare function createConversationHandler(conversationRepo: ConversationRepository): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /conversations/:id
 * Retrieves a conversation and its messages.
 * Returns 404 if the conversation does not exist.
 * Requirements: 8.2
 */
export declare function getConversationHandler(conversationRepo: ConversationRepository, messageRepo: MessageRepository): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=conversations.d.ts.map