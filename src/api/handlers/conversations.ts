import type { Request, Response, NextFunction } from 'express';
import type { ConversationRepository } from '../../persistence/repositories/conversation-repository';
import type { MessageRepository } from '../../persistence/repositories/message-repository';
import { NotFoundError } from '../../utils/errors';

/**
 * POST /conversations
 * Creates a new conversation for the given user_id.
 * Requirements: 8.1
 */
export function createConversationHandler(
  conversationRepo: ConversationRepository
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user_id } = req.body as { user_id?: string };
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
    } catch (err) {
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
export function getConversationHandler(
  conversationRepo: ConversationRepository,
  messageRepo: MessageRepository
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const conversation = await conversationRepo.findById(id);

      if (!conversation) {
        throw new NotFoundError('Conversation', id);
      }

      const messages = await messageRepo.findByConversationId(id);

      res.status(200).json({
        ...conversation,
        messages,
      });
    } catch (err) {
      next(err);
    }
  };
}
