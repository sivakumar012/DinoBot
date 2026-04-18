"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
/**
 * Structured logger using pino.
 * Always use this instead of console.log.
 * Requirements: 9.2
 */
exports.logger = (0, pino_1.default)({
    level: process.env['LOG_LEVEL'] ?? 'info',
    ...(process.env['NODE_ENV'] !== 'production' && {
        transport: {
            target: 'pino/file',
            options: { destination: 1 }, // stdout
        },
    }),
});
//# sourceMappingURL=logger.js.map