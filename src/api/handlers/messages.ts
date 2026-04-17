import type { Request, Response, NextFunction } from 'express';
import type { Orchestrator } from '../../orchestrator/orchestrator';
import { ProviderError } from '../../utils/errors';

/**
 * POST /conversations/:id/messages
 * Sends a user message and returns the assistant response.
 * Delegates all orchestration to the Orchestrator.
 * Requirements: 8.3, 8.4, 8.5, 8.6
 */
export function sendMessageHandler(orchestrator: Orchestrator) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: conversation_id } = req.params as { id: string };
      const { content, provider, model, temperature, max_tokens } = req.body as {
        content: string;
        provider: string;
        model: string;
        temperature?: number;
        max_tokens?: number;
      };

      const result = await orchestrator.process({
        conversation_id,
        content,
        provider,
        model,
        temperature,
        max_tokens,
      });

      if (result.error) {
        throw new ProviderError(result.error.provider, result.error.model, result.error.message);
      }

      res.status(200).json({
        message: result.message,
        usage: result.usage,
      });
    } catch (err) {
      next(err);
    }
  };
}
