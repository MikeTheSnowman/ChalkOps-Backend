/**
 * Security-related interfaces for ChalkOps Platform
 */

import { UUID7 } from './domain.interfaces';
import { KeyStatus } from '../enums/secrets.types';





/**
 * Vault Secret Metadata
 */
export interface VaultSecretMetadata {
  id: string;
  tenantId: UUID7;
  name: string;
  size: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  tags?: Record<string, string>;
}



/**
 * Encryption Key Information
 */
export interface EncryptionKey {
  id: string;
  tenantId: UUID7;
  keyId: string;
  status: KeyStatus;
  algorithm: string;
  keySize: number;
  createdAt: Date;
  expiresAt?: Date;
  rotationDate?: Date;
  archivedAt?: Date;
}

/**
 * Encrypted File Response
 */
export interface EncryptedFileResponse {
  encryptedData: string;
  keyId: string;
  algorithm: string;
  iv: string;
  originalSize: number;
}

/**
 * Key Rotation Configuration
 */
export interface KeyRotationConfig {
  rotationInterval: number; // days
  maxArchivedKeys: number;
  keySize: number; // bits
  algorithm: string;
}

/**
 * Vault Path Structure
 */
export interface VaultPathConfig {
  secrets: string;         // e.g., "secret/data/tenants/{tenantId}/secrets"
  encryptionKeys: string;  // e.g., "transit/keys/tenants/{tenantId}"
  keyRotation: string;     // e.g., "transit/keys/tenants/{tenantId}/rotation"
}



/**
 * Secret Retrieval Response
 */
export interface SecretResponse {
  id: string;
  tenantId: UUID7;
  name: string;
  value?: string;           // For direct storage
  encryptedData?: string;   // For encrypted storage
  keyId?: string;          // For encrypted storage
  algorithm?: string;       // For encrypted storage
  iv?: string;             // For encrypted storage
  metadata: VaultSecretMetadata;
}

/**
 * Key Rotation Request
 */
export interface RotateKeyRequest {
  tenantId: UUID7;
  force?: boolean;
}

/**
 * Key Rotation Response
 */
export interface KeyRotationResponse {
  oldKeyId: string;
  newKeyId: string;
  rotationDate: Date;
  archivedKeys: EncryptionKey[];
}

/**
 * Secret List Response
 */
export interface SecretListResponse {
  tenantId: UUID7;
  secrets: VaultSecretMetadata[];
  totalCount: number;
}

/**
 * Key List Response
 */
export interface KeyListResponse {
  tenantId: UUID7;
  keys: EncryptionKey[];
  activeKeyId: string;
  totalCount: number;
}

/**
 * Vault Health Status
 */
export interface VaultHealthStatus {
  initialized: boolean;
  sealed: boolean;
  version: string;
  clusterName: string;
  clusterId: string;
  haEnabled: boolean;
  replicationDrMode: string;
  replicationPerformanceMode: string;
  serverTimeUtc: number;
}

 