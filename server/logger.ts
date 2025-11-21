/**
 * Centralized logging utility
 * Replaces console.log with structured logging
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, data } = entry;
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}${dataStr}`;
  }

  private log(level: LogLevel, message: string, context?: string, data?: unknown): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case 'error':
        console.error(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedLog);
        }
        break;
      default:
        console.log(formattedLog);
    }
  }

  info(message: string, context?: string, data?: unknown): void {
    this.log('info', message, context, data);
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.log('warn', message, context, data);
  }

  error(message: string, context?: string | any, data?: unknown): void {
    this.log('error', message, context, data);
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.log('debug', message, context, data);
  }
}

export const logger = new Logger();
