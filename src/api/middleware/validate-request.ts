import type { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../utils/errors';

/**
 * Validates that all specified fields are present and non-empty in req.body.
 * Returns HTTP 400 with the specific missing field name if validation fails.
 * Requirements: 8.7, 8.8
 */
export function validateFields(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of fields) {
      const value = req.body[field];
      const strValue = typeof value === 'string' ? value.trim() : value;
      if (strValue === undefined || strValue === null || strValue === '') {
        res.status(400).json({
          error: {
            error_code: 'VALIDATION_ERROR',
            message: `Field "${field}" is required and must not be empty`,
          },
        });
        return;
        return;
      }
    }
    next();
  };
}
