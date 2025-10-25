/**
 * Structured Logging Utility
 *
 * Provides consistent, searchable logs across the application
 * Uses pino for high-performance JSON logging
 */

import pino from 'pino';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  // Format for humans in development, JSON in production
  ...(process.env.NODE_ENV === 'development'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
      }
    : {}),

  // Custom formatters
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },

  // ISO timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'jetlag-web',
  },
});

/**
 * Create child logger with additional context
 *
 * @example
 * const apiLogger = createLogger({ module: 'api', endpoint: 'search' });
 * apiLogger.info({ duration: 234 }, 'Search completed');
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Log with request ID for tracing
 */
export function logWithRequestId(requestId: string, level: string, message: string, data?: any) {
  logger[level as keyof typeof logger]({ requestId, ...data }, message);
}

/**
 * Usage examples:
 *
 * // Basic logging:
 * logger.info('Server started');
 * logger.error({ err: error }, 'Database connection failed');
 *
 * // With structured data:
 * logger.info({
 *   route: 'search-and-rank',
 *   origin: 'JFK',
 *   destination: 'LAX',
 *   duration: 2340,
 *   cached: false,
 * }, 'Flight search completed');
 *
 * // Create module-specific logger:
 * const apiLogger = createLogger({ module: 'api' });
 * apiLogger.warn({ userId: '123', attempts: 3 }, 'Rate limit approaching');
 *
 * // In production, this outputs JSON:
 * // {"level":"info","time":"2025-10-21T12:00:00.000Z","module":"api","duration":2340,"msg":"Flight search completed"}
 */
