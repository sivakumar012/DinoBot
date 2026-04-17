import type { Request, Response, NextFunction } from 'express';
import type { HookSystem } from '../../hooks/hook-system';
import { PlatformError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Global error handler middleware.
 * Catches all unhandled exceptions at the API boundary.
 * Never exposes raw stack traces in responses.
 * Requirements: 8.6, 9.3, 9.4
 */
export function createErrorHandler(hookSystem: HookSystem) {
  return async (
    err: unknown,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
  ): Promise<void> => {
    // Log internally
    logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

    // Dispatch onError hooks (fire-and-forget)
    hookSystem.dispatch('onError', {
      error: err instanceof Error ? err : new Error(String(err)),
    }).catch(() => {
      // Hook errors are already isolated inside HookSystem, but guard here too
    });

    if (err instanceof PlatformError) {
      res.status(err.statusCode).json({
        error: {
          error_code: err.error_code,
          message: err.message,
        },
      });
      return;
    }

    // Unknown error — return generic 500, no stack trace
    res.status(500).json({
      error: {
        error_code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  };
}
