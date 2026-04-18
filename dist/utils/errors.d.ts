/**
 * Typed error hierarchy for the platform.
 * Requirements: 9.1, 9.4
 */
export declare class PlatformError extends Error {
    readonly error_code: string;
    readonly statusCode: number;
    constructor(error_code: string, message: string, statusCode?: number);
}
export declare class ValidationError extends PlatformError {
    constructor(message: string);
}
export declare class ProviderError extends PlatformError {
    readonly provider: string;
    readonly model: string;
    constructor(provider: string, model: string, message: string);
}
export declare class NotFoundError extends PlatformError {
    constructor(resource: string, id: string);
}
export declare class DatabaseError extends PlatformError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map