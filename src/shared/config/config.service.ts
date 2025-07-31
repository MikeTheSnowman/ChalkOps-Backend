import { Injectable } from '@nestjs/common';
import { 
  AppConfig, 
  DatabaseConfig, 
  VaultConfig, 
  LoggingConfig, 
  SecurityConfig, 
  AgentConfig 
} from '../types/interfaces/config.interfaces';
import { CacheConfig } from '../types/interfaces/cache.interfaces';
import { Environment } from '../types/enums/environment.types';
import { VaultAuthMethod } from '../types/enums/vault.types';
import { LogLevel, LogFormat } from '../types/enums/logging.types';
import { CacheType } from '../types/enums/cache.types';

/**
 * Configuration Service for ChalkOps Platform
 * 
 * Provides centralized configuration management with type safety
 * to environment-specific settings across all services.
 */

@Injectable()
export class ConfigService {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Loads configuration from environment variables
   * Defaults to production for security - development must be explicitly requested
   * Fails fast in production if critical settings are not explicitly provided
   */
  private loadConfig(): AppConfig {
    const environment = (process.env.NODE_ENV as Environment) || Environment.PRODUCTION;
    
    // Fail fast for production - require explicit environment variables
    if (environment === Environment.PRODUCTION) {
      const missingVars: string[] = [];
      
      if (!process.env.DB_HOST) missingVars.push('DB_HOST');
      if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
      if (!process.env.VAULT_URL) missingVars.push('VAULT_URL');
      if (!process.env.VAULT_TOKEN) missingVars.push('VAULT_TOKEN');
      if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');
      
      if (missingVars.length > 0) {
        throw new Error(
          `Production environment requires explicit environment variables: ${missingVars.join(', ')}\n` +
          'Please set these variables or use NODE_ENV=development for local development.'
        );
      }
    }

    // Fail fast for staging - require explicit environment variables
    if (environment === Environment.STAGING) {
      const missingVars: string[] = [];
      
      if (!process.env.DB_HOST) missingVars.push('DB_HOST');
      if (!process.env.DB_PASSWORD) missingVars.push('DB_PASSWORD');
      if (!process.env.VAULT_URL) missingVars.push('VAULT_URL');
      if (!process.env.VAULT_TOKEN) missingVars.push('VAULT_TOKEN');
      if (!process.env.JWT_SECRET) missingVars.push('JWT_SECRET');
      
      if (missingVars.length > 0) {
        throw new Error(
          `Staging environment requires explicit environment variables: ${missingVars.join(', ')}\n` +
          'Please set these variables or use NODE_ENV=development for local development.'
        );
      }
    }

    return {
      environment,
      port: parseInt(process.env.PORT || '3000', 10),
      host: process.env.HOST || '0.0.0.0',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || 
        (environment === Environment.DEVELOPMENT ? ['http://localhost:3000'] : ['https://app.chalkops.com']),
      
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'chalkops',
        ssl: process.env.DB_SSL !== 'false', // Default to SSL enabled
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10', 10),
      },
      
      vault: {
        url: process.env.VAULT_URL || 
          (environment === Environment.DEVELOPMENT ? 'http://localhost:8200' : 'https://vault.chalkops.com'),
        token: process.env.VAULT_TOKEN || '',
        namespace: process.env.VAULT_NAMESPACE,
        authMethod: (process.env.VAULT_AUTH_METHOD as VaultAuthMethod) || VaultAuthMethod.TOKEN,
      },
      
      logging: {
        level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
        format: (process.env.LOG_FORMAT as LogFormat) || LogFormat.JSON,
        includeTimestamp: process.env.LOG_INCLUDE_TIMESTAMP !== 'false',
        includeContext: process.env.LOG_INCLUDE_CONTEXT !== 'false',
      },
      
      security: {
        jwtSecret: process.env.JWT_SECRET || 
          (environment === Environment.DEVELOPMENT ? 'dev-secret-change-in-production' : 'CHANGE_THIS_IN_PRODUCTION'),
        jwtExpiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10), // 1 hour
        argon2MemoryCost: parseInt(process.env.ARGON2_MEMORY_COST || '1048576', 10), // 1 GiB
        argon2TimeCost: parseInt(process.env.ARGON2_TIME_COST || '3', 10),
        argon2Parallelism: parseInt(process.env.ARGON2_PARALLELISM || '1', 10),
        rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
      
      agent: {
        heartbeatInterval: parseInt(process.env.AGENT_HEARTBEAT_INTERVAL || '30', 10), // 30 seconds
        maxConcurrentJobs: parseInt(process.env.AGENT_MAX_CONCURRENT_JOBS || '5', 10),
        logRetentionDays: parseInt(process.env.AGENT_LOG_RETENTION_DAYS || '30', 10),
        vpnEndpoint: process.env.AGENT_VPN_ENDPOINT || 'vpn.chalkops.com',
      },

      cache: {
        type: (process.env.CACHE_TYPE as CacheType) || CacheType.VALKEY,
        host: process.env.CACHE_HOST || 'localhost',
        port: parseInt(process.env.CACHE_PORT || '6379', 10),
        password: process.env.CACHE_PASSWORD,
        database: parseInt(process.env.CACHE_DATABASE || '0', 10),
        keyPrefix: process.env.CACHE_KEY_PREFIX,
        retryAttempts: parseInt(process.env.CACHE_RETRY_ATTEMPTS || '5', 10),
        retryDelay: parseInt(process.env.CACHE_RETRY_DELAY || '1000', 10),
      },
    };
  }

  /**
   * Gets the entire configuration object
   */
  getConfig(): AppConfig {
    return this.config;
  }

  /**
   * Gets a specific configuration section
   */
  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getVaultConfig(): VaultConfig {
    return this.config.vault;
  }

  getLoggingConfig(): LoggingConfig {
    return this.config.logging;
  }

  getSecurityConfig(): SecurityConfig {
    return this.config.security;
  }

  getAgentConfig(): AgentConfig {
    return this.config.agent;
  }

  /**
   * Gets individual configuration values
   */
  getEnvironment(): Environment {
    return this.config.environment;
  }

  getPort(): number {
    return this.config.port;
  }

  getHost(): string {
    return this.config.host;
  }

  getCorsOrigins(): string[] {
    return this.config.corsOrigins;
  }

  /**
   * Validates the configuration
   */
  validateConfig(): void {
    const errors: string[] = [];

    // Validate database configuration
    if (!this.config.database.host) {
      errors.push('DB_HOST is required');
    }

    if (!this.config.database.password) {
      errors.push('DB_PASSWORD is required');
    }

    // Validate security configuration
    if (this.config.security.jwtExpiration <= 0) {
      errors.push('JWT_EXPIRATION must be greater than 0');
    }

    if (this.config.security.argon2MemoryCost < 1024) {
      errors.push('ARGON2_MEMORY_COST must be at least 1024 KiB');
    }

    // Staging-specific validations
    if (this.config.environment === Environment.STAGING) {
      if (!this.config.cache.host || this.config.cache.host === 'localhost') {
        errors.push('CACHE_HOST must be set to a staging cache server');
      }
      
      if (this.config.database.host === 'localhost') {
        errors.push('DB_HOST must be set to a staging database server');
      }
    }

    // Development-specific warnings (not errors, but warnings)
    if (this.config.environment === Environment.DEVELOPMENT) {
      console.warn('⚠️  WARNING: Running in development mode with relaxed security settings');
      console.warn('   - JWT_SECRET using default value');
      console.warn('   - VAULT_TOKEN not required');
      console.warn('   - SSL disabled by default');
      console.warn('   - CORS allows localhost');
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  /**
   * Checks if running in development mode
   */
  isDevelopment(): boolean {
    return this.config.environment === Environment.DEVELOPMENT;
  }

  /**
   * Checks if running in staging mode
   */
  isStaging(): boolean {
    return this.config.environment === Environment.STAGING;
  }

  /**
   * Checks if running in production mode
   */
  isProduction(): boolean {
    return this.config.environment === Environment.PRODUCTION;
  }

  /**
   * Checks if running in a non-development environment (staging or production)
   */
  isNonDevelopment(): boolean {
    return this.config.environment === Environment.STAGING || this.config.environment === Environment.PRODUCTION;
  }

  /**
   * Gets database connection string
   */
  getDatabaseUrl(): string {
    const { host, port, username, password, database, ssl } = this.config.database;
    const sslParam = ssl ? '?sslmode=require' : '';
    return `postgresql://${username}:${password}@${host}:${port}/${database}${sslParam}`;
  }
} 