/**
 * POST /api/moderation/flag
 *
 * Receives flag reports from the mobile app for AI-generated content.
 * Persists to the database for review.
 *
 * Store-compliance: GenAI Safety 2026 Mandate — Report/Flag mechanism.
 */
import type { Request, Response, NextFunction } from 'express';
export interface FlagReport {
    id: string;
    message_id: string;
    conversation_id?: string;
    reason: 'harmful' | 'inaccurate' | 'inappropriate' | 'privacy' | 'other';
    details?: string;
    created_at: string;
}
/**
 * POST /api/moderation/flag
 * Body: { message_id, conversation_id?, reason, details? }
 */
export declare function flagMessageHandler(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/**
 * GET /api/moderation/flags — internal review endpoint (add auth before exposing)
 */
export declare function listFlagsHandler(): (_req: Request, res: Response) => void;
//# sourceMappingURL=moderation.d.ts.map