"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFields = validateFields;
/**
 * Validates that all specified fields are present and non-empty in req.body.
 * Returns HTTP 400 with the specific missing field name if validation fails.
 * Requirements: 8.7, 8.8
 */
function validateFields(fields) {
    return (req, res, next) => {
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
//# sourceMappingURL=validate-request.js.map