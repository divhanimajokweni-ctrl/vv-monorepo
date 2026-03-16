/**
 * Ubuntu Pools — Structured Logger
 * Vercel-compatible JSON logging for production debugging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, error?: Error, context?: Record<string, unknown>): void;
  child(partialContext: Record<string, unknown>): Logger;
}

function formatLogEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
  };
}

function writeLog(entry: LogEntry): void {
  const output = JSON.stringify(entry);
  
  if (entry.level === 'error' || entry.level === 'warn') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger: Logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === 'production') return;
    writeLog(formatLogEntry('debug', message, context));
  },

  info(message: string, context?: Record<string, unknown>): void {
    writeLog(formatLogEntry('info', message, context));
  },

  warn(message: string, context?: Record<string, unknown>): void {
    writeLog(formatLogEntry('warn', message, context));
  },

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const errorContext = error ? {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    } : {};
    
    writeLog(formatLogEntry('error', message, { ...errorContext, ...context }));
  },

  child(partialContext: Record<string, unknown>): Logger {
    return {
      debug: (message: string, extraContext?: Record<string, unknown>) => {
        logger.debug(message, { ...partialContext, ...extraContext });
      },
      info: (message: string, extraContext?: Record<string, unknown>) => {
        logger.info(message, { ...partialContext, ...extraContext });
      },
      warn: (message: string, extraContext?: Record<string, unknown>) => {
        logger.warn(message, { ...partialContext, ...extraContext });
      },
      error: (message: string, error?: Error, extraContext?: Record<string, unknown>) => {
        logger.error(message, error, { ...partialContext, ...extraContext });
      },
      child: () => logger,
    };
  },
};

export const structuredLogger = logger;
