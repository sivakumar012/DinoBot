"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createErrorHandler = createErrorHandler;
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
/**
 * Global error handler middleware.
 * Catches all unhandled exceptions at the API boundary.
 * Never exposes raw stack traces in responses.
 * Requirements: 8.6, 9.3, 9.4
 */
function createErrorHandler(hookSystem) {
    return async (err, req, res, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next) => {
        // Log internally
        logger_1.logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
        // Dispatch onError hooks (fire-and-forget)
        hookSystem.dispatch('onError', {
            error: err instanceof Error ? err : new Error(String(err)),
        }).catch(() => {
            // Hook errors are already isolated inside HookSystem, but guard here too
        });
        if (err instanceof errors_1.PlatformError) {
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
//# sourceMappingURL=error-handler.js.map