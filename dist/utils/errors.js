"use strict";
/**
 * Typed error hierarchy for the platform.
 * Requirements: 9.1, 9.4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseError = exports.NotFoundError = exports.ProviderError = exports.ValidationError = exports.PlatformError = void 0;
class PlatformError extends Error {
    error_code;
    statusCode;
    constructor(error_code, message, statusCode = 500) {
        super(message);
        this.error_code = error_code;
        this.statusCode = statusCode;
        this.name = 'PlatformError';
        // Maintain proper prototype chain in transpiled code
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
exports.PlatformError = PlatformError;
class ValidationError extends PlatformError {
    constructor(message) {
        super('VALIDATION_ERROR', message, 400);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class ProviderError extends PlatformError {
    provider;
    model;
    constructor(provider, model, message) {
        super('PROVIDER_ERROR', message, 502);
        this.provider = provider;
        this.model = model;
        this.name = 'ProviderError';
    }
}
exports.ProviderError = ProviderError;
class NotFoundError extends PlatformError {
    constructor(resource, id) {
        super('NOT_FOUND', `${resource} with id "${id}" not found`, 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class DatabaseError extends PlatformError {
    constructor(message) {
        super('DATABASE_ERROR', message, 500);
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
//# sourceMappingURL=errors.js.map