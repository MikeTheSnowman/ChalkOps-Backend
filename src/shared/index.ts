/**
 * Shared Utilities and Types Index for ChalkOps Platform
 * 
 * Central export point for all shared utilities, services, and types
 * used across the ChalkOps platform.
 */

// UUID Service
export { UuidService } from './uuid/uuid.service';

// Logging Service
export { LoggerService, LogContext, LogEntry } from './logging/logger.service';

// Crypto Service
export { CryptoService, Argon2Config, HashResult } from './crypto/crypto.service';

// Error Handling
export {
  ErrorHandlerService,
  ChalkOpsError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  DatabaseError,
  JobError,
  AgentError,
  ExternalServiceError,
  SystemError,
  ErrorCode,
  ErrorDetails,
} from './errors/error-handler.service';

// Configuration Service
export { ConfigService } from './config/config.service';

// All Types (Enums and Interfaces)
export * from './types'; 