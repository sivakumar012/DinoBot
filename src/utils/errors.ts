/**
 * Typed error hierarchy for the platform.
 * Requirements: 9.1, 9.4
 */

export class PlatformError extends Error {
  constructor(
    public readonly error_code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'PlatformError';
    // Maintain proper prototype chain in transpiled code
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends PlatformError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class ProviderError extends PlatformError {
  constructor(
    public readonly provider: string,
    public readonly model: string,
    message: string
  ) {
    super('PROVIDER_ERROR', message, 502);
    this.name = 'ProviderError';
  }
}

export class NotFoundError extends PlatformError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} with id "${id}" not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends PlatformError {
  constructor(message: string) {
    super('DATABASE_ERROR', message, 500);
    this.name = 'DatabaseError';
  }
}
