import type { Request, Response, NextFunction } from 'express';
import type { Orchestrator } from '../../orchestrator/orchestrator';
/**
 * POST /conversations/:id/messages
 * Sends a user message and returns the assistant response.
 * Delegates all orchestration to the Orchestrator.
 * Requirements: 8.3, 8.4, 8.5, 8.6
 */
export declare function sendMessageHandler(orchestrator: Orchestrator): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=messages.d.ts.map