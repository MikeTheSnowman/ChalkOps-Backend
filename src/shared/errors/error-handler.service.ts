/**
 * Error Handling Service for ChalkOps Platform
 * 
 * Provides standardized error handling and custom exception classes
 * for consistent error management across all services.
 */

export enum ErrorCode {
  // Authentication & Authorization
  INVALID_CREDENTIALS = 'AUTH_001',
  INVALID_TOKEN = 'AUTH_002',
  INSUFFICIENT_PERMISSIONS = 'AUTH_003',
  TENANT_NOT_FOUND = 'AUTH_004',
  
  // Validation
  INVALID_INPUT = 'VAL_001',
  MISSING_REQUIRED_FIELD = 'VAL_002',
  INVALID_UUID = 'VAL_003',
  
  // Database
  DATABASE_ERROR = 'DB_001',
  RECORD_NOT_FOUND = 'DB_002',
  DUPLICATE_RECORD = 'DB_003',
  
  // Job Management
  JOB_NOT_FOUND = 'JOB_001',
  JOB_ALREADY_RUNNING = 'JOB_002',
  JOB_CANCELLED = 'JOB_003',
  
  // Agent Management
  AGENT_NOT_FOUND = 'AGENT_001',
  AGENT_OFFLINE = 'AGENT_002',
  AGENT_BUSY = 'AGENT_003',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXT_001',
  RATE_LIMIT_EXCEEDED = 'EXT_002',
  
  // System
  INTERNAL_SERVER_ERROR = 'SYS_001',
  SERVICE_UNAVAILABLE = 'SYS_002',
  CONFIGURATION_ERROR = 'SYS_003',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  context?: {
    tenant_id?: string;
    user_id?: string;
    job_id?: string;
    agent_id?: string;
  };
}

export class ChalkOpsError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, any>;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(errorDetails: ErrorDetails, isOperational: boolean = true) {
    super(errorDetails.message);
    
    this.name = 'ChalkOpsError';
    this.code = errorDetails.code;
    this.details = errorDetails.details;
    this.context = errorDetails.context;
    this.timestamp = new Date().toISOString();
    this.isOperational = isOperational;
    
    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ChalkOpsError);
    }
  }
}

export class AuthenticationError extends ChalkOpsError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.INVALID_CREDENTIALS,
      message,
      context,
    });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ChalkOpsError {
  constructor(message: string, context?: Record<string, any>) {
    super({
      code: ErrorCode.INSUFFICIENT_PERMISSIONS,
      message,
      context,
    });
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends ChalkOpsError {
  constructor(message: string, details?: Record<string, any>, context?: Record<string, any>) {
    super({
      code: ErrorCode.INVALID_INPUT,
      message,
      details,
      context,
    });
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends ChalkOpsError {
  constructor(message: string, details?: Record<string, any>, context?: Record<string, any>) {
    super({
      code: ErrorCode.DATABASE_ERROR,
      message,
      details,
      context,
    });
    this.name = 'DatabaseError';
  }
}

export class JobError extends ChalkOpsError {
  constructor(code: ErrorCode, message: string, context?: Record<string, any>) {
    super({
      code,
      message,
      context,
    });
    this.name = 'JobError';
  }
}

export class AgentError extends ChalkOpsError {
  constructor(code: ErrorCode, message: string, context?: Record<string, any>) {
    super({
      code,
      message,
      context,
    });
    this.name = 'AgentError';
  }
}

export class ExternalServiceError extends ChalkOpsError {
  constructor(message: string, details?: Record<string, any>, context?: Record<string, any>) {
    super({
      code: ErrorCode.EXTERNAL_SERVICE_ERROR,
      message,
      details,
      context,
    });
    this.name = 'ExternalServiceError';
  }
}

export class SystemError extends ChalkOpsError {
  constructor(message: string, details?: Record<string, any>, context?: Record<string, any>) {
    super({
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message,
      details,
      context,
    }, false); // System errors are not operational
    this.name = 'SystemError';
  }
}

/**
 * Error Handler Service for centralized error processing
 */
export class ErrorHandlerService {
  /**
   * Creates a standardized error response for API endpoints
   */
  static createErrorResponse(error: ChalkOpsError): {
    error: {
      code: string;
      message: string;
      details?: Record<string, any>;
      timestamp: string;
    };
  } {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      },
    };
  }

  /**
   * Determines if an error should be logged as an error vs warning
   */
  static shouldLogAsError(error: ChalkOpsError): boolean {
    return !error.isOperational || 
           error.code === ErrorCode.INTERNAL_SERVER_ERROR ||
           error.code === ErrorCode.SERVICE_UNAVAILABLE ||
           error.code === ErrorCode.DATABASE_ERROR;
  }

  /**
   * Extracts context information from an error for logging
   */
  static extractLogContext(error: ChalkOpsError): Record<string, any> {
    return {
      error_code: error.code,
      error_name: error.name,
      is_operational: error.isOperational,
      ...error.context,
    };
  }

  /**
   * Safely handles async operations with error catching
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ChalkOpsError) {
        throw error;
      }
      
      // Convert unknown errors to system errors
      throw new SystemError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { originalError: error },
        context
      );
    }
  }
} 