import type { Request, Response, NextFunction } from 'express';
import type { HookSystem } from '../../hooks/hook-system';
/**
 * Global error handler middleware.
 * Catches all unhandled exceptions at the API boundary.
 * Never exposes raw stack traces in responses.
 * Requirements: 8.6, 9.3, 9.4
 */
export declare function createErrorHandler(hookSystem: HookSystem): (err: unknown, req: Request, res: Response, _next: NextFunction) => Promise<void>;
//# sourceMappingURL=error-handler.d.ts.map