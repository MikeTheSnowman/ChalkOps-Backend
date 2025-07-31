import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

/**
 * Structured Logging Service for ChalkOps Platform
 * 
 * Provides JSON format logging with automatic inclusion of contextual IDs
 * for correlation across distributed services and agents.
 */
export interface LogContext {
  tenant_id?: string;
  user_id?: string;
  job_id?: string;
  agent_id?: string;
  request_id?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context: LogContext;
  service: string;
  version: string;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly serviceName: string = 'chalkops-service';
  private readonly version: string = '0.0.1';

  constructor() {
    // No parameters to avoid NestJS dependency injection issues
  }

  /**
   * Creates a new logger instance with custom service name and version
   * Use this for creating child loggers instead of constructor parameters
   */
  static createLogger(serviceName: string, version?: string): LoggerService {
    const logger = new LoggerService();
    (logger as any).serviceName = serviceName;
    (logger as any).version = version || '0.0.1';
    return logger;
  }

  /**
   * Creates a structured log entry
   */
  private createLogEntry(
    level: string,
    message: string,
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        // Ensure all contextual IDs are present for correlation
        tenant_id: context.tenant_id || undefined,
        user_id: context.user_id || undefined,
        job_id: context.job_id || undefined,
        agent_id: context.agent_id || undefined,
        request_id: context.request_id || undefined,
      },
      service: this.serviceName,
      version: this.version,
    };

    // Add error details if provided
    if (error) {
      logEntry.context.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return logEntry;
  }

  /**
   * Outputs log entry to console in JSON format
   */
  private outputLog(logEntry: LogEntry): void {
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Logs a message with context
   */
  log(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('info', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Logs an error with context
   */
  error(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('error', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Logs a warning with context
   */
  warn(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('warn', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Logs debug information with context
   */
  debug(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('debug', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Logs verbose information with context
   */
  verbose(message: string, context?: LogContext): void {
    const logEntry = this.createLogEntry('verbose', message, context);
    this.outputLog(logEntry);
  }

  /**
   * Creates a child logger with additional context
   */
  createChildLogger(additionalContext: LogContext): LoggerService {
    const childLogger = LoggerService.createLogger(this.serviceName, this.version);
    // TODO: Implement child logger with inherited context
    return childLogger;
  }
} 