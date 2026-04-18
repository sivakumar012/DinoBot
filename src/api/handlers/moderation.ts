/**
 * POST /api/moderation/flag
 *
 * Receives flag reports from the mobile app for AI-generated content.
 * Persists to the database for review.
 *
 * Store-compliance: GenAI Safety 2026 Mandate — Report/Flag mechanism.
 */
import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';

export interface FlagReport {
  id: string;
  message_id: string;
  conversation_id?: string;
  reason: 'harmful' | 'inaccurate' | 'inappropriate' | 'privacy' | 'other';
  details?: string;
  created_at: string;
}

// In-memory store for MVP — swap for a DB table in production
const flagReports: FlagReport[] = [];

/**
 * POST /api/moderation/flag
 * Body: { message_id, conversation_id?, reason, details? }
 */
export function flagMessageHandler() {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { message_id, conversation_id, reason, details } = req.body as {
        message_id?: string;
        conversation_id?: string;
        reason?: string;
        details?: string;
      };

      if (!message_id || message_id.trim() === '') {
        throw new ValidationError('Field "message_id" is required and must not be empty');
      }

      const validReasons = ['harmful', 'inaccurate', 'inappropriate', 'privacy', 'other'];
      if (!reason || !validReasons.includes(reason)) {
        throw new ValidationError(
          `Field "reason" must be one of: ${validReasons.join(', ')}`
        );
      }

      const report: FlagReport = {
        id: uuidv4(),
        message_id: message_id.trim(),
        conversation_id: conversation_id?.trim(),
        reason: reason as FlagReport['reason'],
        details: details?.trim().slice(0, 500),
        created_at: new Date().toISOString(),
      };

      flagReports.push(report);

      logger.warn(
        { flagReport: report },
        'AI content flagged by user'
      );

      res.status(201).json({ id: report.id, status: 'received' });
    } catch (err) {
      next(err);
    }
  };
}

/**
 * GET /api/moderation/flags — internal review endpoint (add auth before exposing)
 */
export function listFlagsHandler() {
  return (_req: Request, res: Response): void => {
    res.status(200).json({ flags: flagReports, total: flagReports.length });
  };
}
