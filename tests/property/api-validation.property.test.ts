/**
 * Property-based tests for API request validation and error response shape.
 * Properties 13, 14.
 */
import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { validateFields } from '../../src/api/middleware/validate-request';
import { createErrorHandler } from '../../src/api/middleware/error-handler';
import { PlatformError, ValidationError, ProviderError, NotFoundError } from '../../src/utils/errors';
import type { HookSystem } from '../../src/hooks/hook-system';

// Helper: run middleware against a fake request
function runValidateMiddleware(
  fields: string[],
  body: Record<string, unknown>
): { status: number; body: unknown } | 'next' {
  let result: { status: number; body: unknown } | 'next' = 'next';

  const req = { body } as Request;
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockImplementation((b: unknown) => {
      result = { status: (res.status as ReturnType<typeof vi.fn>).mock.calls[0][0] as number, body: b };
    }),
  } as unknown as Response;
  const next = vi.fn().mockImplementation(() => {
    result = 'next';
  }) as unknown as NextFunction;

  validateFields(fields)(req, res, next);
  return result;
}

describe('API validation property tests', () => {
  // Feature: multi-llm-orchestration-platform, Property 13: API request validation completeness
  it('any request missing a required field returns HTTP 400 with the field name', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        fc.nat({ max: 4 }),
        (fields, missingIdx) => {
          const actualMissingIdx = missingIdx % fields.length;
          const missingField = fields[actualMissingIdx];

          // Build a body that has all fields except the missing one
          const body: Record<string, string> = {};
          for (const f of fields) {
            if (f !== missingField) {
              body[f] = 'value';
            }
          }

          const result = runValidateMiddleware(fields, body);

          // Must not call next — must return 400
          expect(result).not.toBe('next');
          if (result !== 'next') {
            expect(result.status).toBe(400);
            const errorBody = result.body as { error: { error_code: string; message: string } };
            expect(errorBody.error.error_code).toBe('VALIDATION_ERROR');
            expect(errorBody.error.message).toContain(missingField);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 13: API request validation completeness
  it('any request with an empty string field returns HTTP 400', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        fc.nat({ max: 4 }),
        (fields, emptyIdx) => {
          const actualEmptyIdx = emptyIdx % fields.length;
          const emptyField = fields[actualEmptyIdx];

          // Build a body with all fields present but one is empty string
          const body: Record<string, string> = {};
          for (const f of fields) {
            body[f] = f === emptyField ? '' : 'value';
          }

          const result = runValidateMiddleware(fields, body);

          expect(result).not.toBe('next');
          if (result !== 'next') {
            expect(result.status).toBe(400);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 13: API request validation completeness
  it('a request with all required fields present and non-empty calls next()', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 5 }),
        (fields) => {
          // Deduplicate fields
          const uniqueFields = [...new Set(fields)];
          const body: Record<string, string> = {};
          for (const f of uniqueFields) {
            body[f] = 'non-empty-value';
          }

          const result = runValidateMiddleware(uniqueFields, body);
          expect(result).toBe('next');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 14: API error response shape
  it('any PlatformError produces a structured JSON response with error_code and message, no stack trace', async () => {
    const mockHookSystem = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as HookSystem;

    const errorHandler = createErrorHandler(mockHookSystem);

    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1 }).map((msg) => new ValidationError(msg)),
          fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
            .map(([p, m, msg]) => new ProviderError(p, m, msg)),
          fc.tuple(fc.string({ minLength: 1 }), fc.string({ minLength: 1 }))
            .map(([r, id]) => new NotFoundError(r, id))
        ),
        async (error: PlatformError) => {
          let capturedStatus = 0;
          let capturedBody: unknown = null;

          const req = { path: '/test', method: 'POST' } as Request;
          const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockImplementation((b: unknown) => {
              capturedStatus = (res.status as ReturnType<typeof vi.fn>).mock.calls[0][0] as number;
              capturedBody = b;
            }),
          } as unknown as Response;
          const next = vi.fn() as unknown as NextFunction;

          await errorHandler(error, req, res, next);

          // Must have correct HTTP status
          expect(capturedStatus).toBe(error.statusCode);

          // Body must have error.error_code and error.message
          const body = capturedBody as { error: { error_code: string; message: string } };
          expect(body.error).toBeDefined();
          expect(typeof body.error.error_code).toBe('string');
          expect(typeof body.error.message).toBe('string');

          // Must NOT contain a stack trace string
          const bodyStr = JSON.stringify(capturedBody);
          expect(bodyStr).not.toMatch(/at\s+\w+\s+\(/); // stack trace pattern
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: multi-llm-orchestration-platform, Property 14: API error response shape
  it('any unknown error produces a 500 response with error_code and message, no stack trace', async () => {
    const mockHookSystem = {
      dispatch: vi.fn().mockResolvedValue(undefined),
    } as unknown as HookSystem;

    const errorHandler = createErrorHandler(mockHookSystem);

    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (errorMessage) => {
          let capturedStatus = 0;
          let capturedBody: unknown = null;

          const req = { path: '/test', method: 'POST' } as Request;
          const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockImplementation((b: unknown) => {
              capturedStatus = (res.status as ReturnType<typeof vi.fn>).mock.calls[0][0] as number;
              capturedBody = b;
            }),
          } as unknown as Response;
          const next = vi.fn() as unknown as NextFunction;

          const unknownError = new Error(errorMessage);
          await errorHandler(unknownError, req, res, next);

          expect(capturedStatus).toBe(500);

          const body = capturedBody as { error: { error_code: string; message: string } };
          expect(body.error).toBeDefined();
          expect(typeof body.error.error_code).toBe('string');
          expect(typeof body.error.message).toBe('string');

          // No raw stack trace in response
          const bodyStr = JSON.stringify(capturedBody);
          expect(bodyStr).not.toContain(unknownError.stack);
        }
      ),
      { numRuns: 100 }
    );
  });
});
