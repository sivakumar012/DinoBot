import type { Request, Response, NextFunction } from 'express';
/**
 * Validates that all specified fields are present and non-empty in req.body.
 * Returns HTTP 400 with the specific missing field name if validation fails.
 * Requirements: 8.7, 8.8
 */
export declare function validateFields(fields: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate-request.d.ts.map