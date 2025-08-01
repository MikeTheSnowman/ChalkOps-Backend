/**
 * Secrets-related interfaces for ChalkOps Platform
 */

import { UUID7 } from './domain.interfaces';
import { SecretsProviderType, ProviderStatus, EncryptionAlgorithm, KeyStatus } from '../enums/secrets.types';

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string;
  iv?: string;
  algorithm: EncryptionAlgorithm;
  keyId: UUID7;
}

/**
 * Key information
 */
export interface KeyInfo {
  id: UUID7;
  algorithm: EncryptionAlgorithm;
  keySize: number;
  status: KeyStatus;
  createdAt: Date;
  expiresAt?: Date;
  rotationDate?: Date;
  archivedAt?: Date;
}

/**
 * Provider configuration
 */
export interface SecretsProviderConfig {
  type: SecretsProviderType;
  url?: string;
  token?: string;
  namespace?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  tenantId?: UUID7;
  clientId?: string;
  clientSecret?: string;
  projectId?: string;
  keyFile?: string;
  localPath?: string;
}

/**
 * Provider status information
 */
export interface ProviderStatusInfo {
  status: ProviderStatus;
  provider: SecretsProviderType;
  version?: string;
  lastCheck: Date;
  details?: Record<string, any>;
}

/**
 * Secret metadata
 */
export interface SecretMetadata {
  id: UUID7;
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags?: Record<string, string>;
}

/**
 * Secret data with metadata
 */
export interface SecretData {
  value?: string;
  encryptedData?: EncryptedData;
  metadata: SecretMetadata;
}

/**
 * List secrets response
 */
export interface ListSecretsResponse {
  secrets: SecretMetadata[];
  totalCount: number;
  nextToken?: string;
}

/**
 * List keys response
 */
export interface ListKeysResponse {
  keys: KeyInfo[];
  totalCount: number;
  activeKeyId?: UUID7;
}

/**
 * Secrets key rotation response
 */
export interface SecretsKeyRotationResponse {
  oldKeyId: UUID7;
  newKeyId: UUID7;
  rotationDate: Date;
  archivedKeys: KeyInfo[];
}

/**
 * Provider health check response
 */
export interface HealthCheckResponse {
  healthy: boolean;
  status: ProviderStatus;
  details?: Record<string, any>;
  timestamp: Date;
} 