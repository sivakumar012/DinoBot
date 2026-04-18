"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flagMessageHandler = flagMessageHandler;
exports.listFlagsHandler = listFlagsHandler;
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const errors_1 = require("../../utils/errors");
// In-memory store for MVP — swap for a DB table in production
const flagReports = [];
/**
 * POST /api/moderation/flag
 * Body: { message_id, conversation_id?, reason, details? }
 */
function flagMessageHandler() {
    return async (req, res, next) => {
        try {
            const { message_id, conversation_id, reason, details } = req.body;
            if (!message_id || message_id.trim() === '') {
                throw new errors_1.ValidationError('Field "message_id" is required and must not be empty');
            }
            const validReasons = ['harmful', 'inaccurate', 'inappropriate', 'privacy', 'other'];
            if (!reason || !validReasons.includes(reason)) {
                throw new errors_1.ValidationError(`Field "reason" must be one of: ${validReasons.join(', ')}`);
            }
            const report = {
                id: (0, uuid_1.v4)(),
                message_id: message_id.trim(),
                conversation_id: conversation_id?.trim(),
                reason: reason,
                details: details?.trim().slice(0, 500),
                created_at: new Date().toISOString(),
            };
            flagReports.push(report);
            logger_1.logger.warn({ flagReport: report }, 'AI content flagged by user');
            res.status(201).json({ id: report.id, status: 'received' });
        }
        catch (err) {
            next(err);
        }
    };
}
/**
 * GET /api/moderation/flags — internal review endpoint (add auth before exposing)
 */
function listFlagsHandler() {
    return (_req, res) => {
        res.status(200).json({ flags: flagReports, total: flagReports.length });
    };
}
//# sourceMappingURL=moderation.js.map