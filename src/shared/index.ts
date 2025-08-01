/**
 * Shared Utilities and Types Index for ChalkOps Platform
 * 
 * Central export point for all shared utilities, services, and types
 * used across the ChalkOps platform.
 */

// UUID Service
export { UuidService } from './uuid/uuid.service';
export { UUID7 } from './uuid/uuid7.class';

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

// Database Service
export { PrismaService } from './database/prisma.service';

// Security Services
export { IpBlacklistService } from './security/ip-blacklist.service';
export { VaultService } from './security/vault.service';
export { SecurityService } from './security/security.service';

// Secrets Services
export { SecretsServiceFactory } from './secrets/secrets.service.factory';
export { VaultSecretsProvider } from './secrets/providers/vault-secrets.provider';
export { ISecretsProvider } from './secrets/interfaces/secrets-provider.interface';

// Cache Service
export { CacheService } from './cache/cache.service';

// All Types (Enums and Interfaces)
export * from './types'; 