"use strict";
/**
 * Environment variable loading and platform configuration.
 * Requirements: 3.9
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_TOKEN_LIMITS = exports.config = void 0;
exports.config = {
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    openaiApiKey: process.env['OPENAI_API_KEY'],
    anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    databaseUrl: process.env['DATABASE_URL'],
};
/**
 * Token limits per model (context window size).
 * Used by the Context Engine to determine when trimming is needed.
 * Requirements: 4.2
 */
exports.MODEL_TOKEN_LIMITS = {
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
    'gpt-4-turbo': 128000,
    'gpt-3.5-turbo': 16385,
    'claude-3-5-sonnet-20241022': 200000,
    'claude-3-5-haiku-20241022': 200000,
    'claude-3-opus-20240229': 200000,
};
//# sourceMappingURL=config.js.map