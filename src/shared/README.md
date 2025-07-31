# ChalkOps Shared Utilities Library

This directory contains the foundational utilities and services that are shared across all ChalkOps platform components. These utilities provide standardized functionality for UUID generation, logging, cryptography, error handling, and configuration management.

## Overview

The shared utilities library is designed to ensure consistency, security, and maintainability across the entire ChalkOps platform. All services are built with TypeScript and follow NestJS patterns for dependency injection.

## Directory Structure

```
src/shared/
├── uuid/                 # UUID v7 generation utilities
├── logging/              # Structured logging with context
├── crypto/               # Cryptographic utilities (Argon2id)
├── errors/               # Error handling and custom exceptions
├── config/               # Configuration management
├── types/                # Shared TypeScript types
├── shared.module.ts      # NestJS module for dependency injection
├── index.ts              # Central export point
└── README.md            # This documentation
```

## Services

### UUID Service (`uuid/uuid.service.ts`)

Provides standardized UUID v7 generation across all services.

**Key Features:**
- RFC 4122 / Draft-ietf-uuidrev-rfc4122-bis compliant
- Time-ordered generation for optimized database indexing
- Global uniqueness guarantee
- Validation utilities

**Usage:**
```typescript
import { UuidService } from '../shared';

@Injectable()
export class MyService {
  constructor(private readonly uuidService: UuidService) {}

  createEntity() {
    const id = this.uuidService.generateV7();
    // Use id for new entity
  }
}
```

### Logging Service (`logging/logger.service.ts`)

Provides structured JSON logging with automatic context inclusion.

**Key Features:**
- JSON format logging for easy parsing
- Automatic inclusion of contextual IDs (tenant_id, user_id, job_id, agent_id)
- Correlation support across distributed services
- Child logger support for additional context

**Usage:**
```typescript
import { LoggerService } from '../shared';

@Injectable()
export class MyService {
  private readonly logger = new LoggerService('my-service');

  async processJob(jobId: string, tenantId: string) {
    this.logger.log('Processing job', {
      job_id: jobId,
      tenant_id: tenantId,
    });
  }
}
```

### Crypto Service (`crypto/crypto.service.ts`)

Provides Argon2id password hashing and cryptographic utilities.

**Key Features:**
- OWASP ASVS Level 3 compliant password hashing
- Argon2id with configurable parameters
- Constant-time comparison to prevent timing attacks
- Secure random string generation

**Usage:**
```typescript
import { CryptoService } from '../shared';

@Injectable()
export class AuthService {
  constructor(private readonly cryptoService: CryptoService) {}

  async hashPassword(password: string) {
    const result = await this.cryptoService.hashPassword(password);
    return result.hash;
  }

  async verifyPassword(password: string, hash: string) {
    return await this.cryptoService.verifyPassword(password, hash);
  }
}
```

### Error Handling (`errors/error-handler.service.ts`)

Provides standardized error handling and custom exception classes.

**Key Features:**
- Custom exception hierarchy for different error types
- Standardized error codes and messages
- Context-aware error logging
- API response formatting

**Usage:**
```typescript
import { ValidationError, ErrorHandlerService } from '../shared';

@Injectable()
export class MyService {
  async validateInput(data: any) {
    if (!data.requiredField) {
      throw new ValidationError('Required field is missing', {
        field: 'requiredField',
      });
    }
  }
}
```

### Configuration Service (`config/config.service.ts`)

Provides centralized configuration management with type safety.

**Key Features:**
- Environment-specific configuration
- Type-safe configuration access
- Validation of required settings
- Singleton pattern for consistent access

**Usage:**
```typescript
import { ConfigService } from '../shared';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}

  async connectToDatabase() {
    const dbConfig = this.configService.getDatabaseConfig();
    // Use dbConfig for database connection
  }
}
```

## Types (`types/common.types.ts`)

Shared TypeScript types used across all services:

- **Entity Types**: Tenant, User, Agent, MigrationJob, etc.
- **API Types**: Request/Response interfaces, JWT payloads
- **Utility Types**: DeepPartial, Nullable, Optional
- **Status Types**: JobStatus, AgentStatus, UserStatus

## Integration

### NestJS Module

The `SharedModule` provides all utilities as injectable services:

```typescript
import { Module } from '@nestjs/common';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [SharedModule],
  // ... other module configuration
})
export class AppModule {}
```

### Global Availability

The `SharedModule` is marked as `@Global()`, making all services available throughout the application without needing to import the module in every feature module.

## Best Practices

1. **Always use the shared services** instead of implementing similar functionality
2. **Include contextual IDs** in log messages for correlation
3. **Use UUID v7** for all primary keys
4. **Handle errors** using the custom exception classes
5. **Validate configuration** at application startup
6. **Use type-safe interfaces** for all data structures

## Security Considerations

- **Password Hashing**: Always use Argon2id with appropriate parameters
- **UUID Generation**: Use cryptographically secure random generation
- **Error Handling**: Never expose sensitive information in error messages
- **Logging**: Ensure PII is redacted from logs
- **Configuration**: Validate all configuration at startup

## Testing

Each service includes comprehensive unit tests. To run tests for shared utilities:

```bash
npm test src/shared
```

## Dependencies

The shared utilities library depends on:

- `uuid`: For UUID v7 generation
- `argon2`: For password hashing
- `jsonwebtoken`: For JWT handling
- `class-validator`: For input validation
- `class-transformer`: For object transformation

## Future Enhancements

- [ ] Implement proper UUID v7 generation with time-ordered bits
- [ ] Add metrics collection to logging service
- [ ] Implement distributed tracing support
- [ ] Add configuration hot-reloading capabilities
- [ ] Enhance error reporting with stack trace analysis 