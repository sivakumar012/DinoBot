import pino from 'pino';

/**
 * Structured logger using pino.
 * Always use this instead of console.log.
 * Requirements: 9.2
 */
export const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  ...(process.env['NODE_ENV'] !== 'production' && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 }, // stdout
    },
  }),
});
