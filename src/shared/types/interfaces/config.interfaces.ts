/**
 * Configuration-related interfaces for ChalkOps Platform
 */

import { Environment } from '../enums/environment.types';
import { VaultAuthMethod } from '../enums/vault.types';
import { LogLevel, LogFormat } from '../enums/logging.types';
import { CacheConfig } from './cache.interfaces';

/**
 * Database Configuration Interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  maxConnections: number;
}

/**
 * Vault Configuration Interface
 */
export interface VaultConfig {
  url: string;
  token: string;
  namespace?: string;
  authMethod: VaultAuthMethod;
}

/**
 * Logging Configuration Interface
 */
export interface LoggingConfig {
  level: LogLevel;
  format: LogFormat;
  includeTimestamp: boolean;
  includeContext: boolean;
}

/**
 * Security Configuration Interface
 */
export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiration: number; // in seconds
  argon2MemoryCost: number;
  argon2TimeCost: number;
  argon2Parallelism: number;
  rateLimitWindow: number; // in milliseconds
  rateLimitMax: number;
}

/**
 * Agent Configuration Interface
 */
export interface AgentConfig {
  heartbeatInterval: number; // in seconds
  maxConcurrentJobs: number;
  logRetentionDays: number;
  vpnEndpoint: string;
}

/**
 * Main Application Configuration Interface
 */
export interface AppConfig {
  environment: Environment;
  port: number;
  host: string;
  corsOrigins: string[];
  database: DatabaseConfig;
  vault: VaultConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  agent: AgentConfig;
  cache: CacheConfig;
} 