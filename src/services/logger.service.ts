/**
 * Logger Service
 * Provides structured logging with different log levels
 * In production, this can be extended to send logs to external services
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  userId?: string;
  page?: string;
  action?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
  error?: Error;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Sanitize sensitive data from context
   */
  private sanitize(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'auth'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      context: this.sanitize(context),
      timestamp: new Date().toISOString(),
      error,
    };
  }

  /**
   * Send logs to external service (production only)
   */
  private sendToExternalService(entry: LogEntry): void {
    // In production, this would send to a service like Sentry, LogRocket, etc.
    // For now, this is a stub
    if (!this.isDevelopment && entry.level === 'error') {
      // Example: Send to external logging service
      // Sentry.captureException(entry.error, { extra: entry.context });
    }
  }

  /**
   * Log to console (development) or external service (production)
   */
  private log(entry: LogEntry): void {
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(entry.level);
      const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;

      switch (entry.level) {
        case 'debug':
          console.debug(prefix, entry.message, entry.context || '');
          break;
        case 'info':
          console.info(prefix, entry.message, entry.context || '');
          break;
        case 'warn':
          console.warn(prefix, entry.message, entry.context || '');
          break;
        case 'error':
          console.error(prefix, entry.message, entry.context || '', entry.error || '');
          break;
      }
    }

    this.sendToExternalService(entry);
  }

  /**
   * Get console styling for different log levels
   */
  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280',
      info: 'color: #3B82F6',
      warn: 'color: #F59E0B',
      error: 'color: #EF4444; font-weight: bold',
    };
    return styles[level];
  }

  /**
   * Debug level logging
   */
  debug(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('debug', message, context);
    this.log(entry);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('info', message, context);
    this.log(entry);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.createLogEntry('warn', message, context);
    this.log(entry);
  }

  /**
   * Error level logging
   */
  error(message: string, error?: Error, context?: LogContext): void {
    const entry = this.createLogEntry('error', message, context, error);
    this.log(entry);
  }
}

// Export singleton instance
export const logger = new Logger();
