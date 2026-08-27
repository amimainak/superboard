// ============================================================
// Structured Logger — JSON Logging for Production
// ============================================================
// Replaces console.log/error with structured JSON logs that
// can be ingested by logging services (Datadog, CloudWatch, etc.).
//
// USAGE:
//   import { logger } from '@/lib/logger';
//   logger.info('Room created', { roomId, tutorId });
//   logger.warn('Rate limit approaching', { userId, remaining: 2 });
//   logger.error('AI API failed', { error: err.message, action });
//
// In development, outputs human-readable colored logs.
// In production, outputs single-line JSON to stdout.
// ============================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';

/**
 * ANSI color codes for development logging
 */
const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};
const RESET = '\x1b[0m';

/**
 * Format a log entry for output.
 */
function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // Production: JSON single-line
    return JSON.stringify(entry);
  }

  // Development: Human-readable with colors
  const color = COLORS[entry.level];
  const prefix = `${color}[${entry.level.toUpperCase()}]${RESET}`;
  const time = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS
  const ctx = entry.context ? ` ${JSON.stringify(entry.context)}` : '';

  return `${prefix} ${time} ${entry.message}${ctx}`;
}

/**
 * Sanitize context object — remove potentially sensitive fields.
 */
function sanitizeContext(ctx: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apiKey', 'authorization', 'cookie'];

  for (const [key, value] of Object.entries(ctx)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((s) => lowerKey.includes(s));

    if (isSensitive && typeof value === 'string') {
      sanitized[key] = `${value.substring(0, 4)}...`;
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function createLog(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: sanitizeContext(context) } : {}),
  };

  const output = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'debug':
      if (!isProduction) console.debug(output);
      break;
    default:
      console.log(output);
  }
}

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) => createLog('debug', message, context),
  info: (message: string, context?: Record<string, unknown>) => createLog('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => createLog('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => createLog('error', message, context),
  /**
   * Create a child logger with persistent context (e.g., roomId, userId).
   */
  child: (persistentContext: Record<string, unknown>) => ({
    debug: (message: string, context?: Record<string, unknown>) =>
      createLog('debug', message, { ...persistentContext, ...context }),
    info: (message: string, context?: Record<string, unknown>) =>
      createLog('info', message, { ...persistentContext, ...context }),
    warn: (message: string, context?: Record<string, unknown>) =>
      createLog('warn', message, { ...persistentContext, ...context }),
    error: (message: string, context?: Record<string, unknown>) =>
      createLog('error', message, { ...persistentContext, ...context }),
  }),
};
