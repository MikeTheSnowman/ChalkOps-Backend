/**
 * Secrets-related types and enums for ChalkOps Platform
 */

/**
 * Supported secrets provider types
 */
export enum SecretsProviderType {
  VAULT = 'vault',
  AWS_SECRETS_MANAGER = 'aws',
  AZURE_KEY_VAULT = 'azure',
  GCP_SECRET_MANAGER = 'gcp',
  LOCAL = 'local',
}

/**
 * Provider status types
 */
export enum ProviderStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
}

/**
 * Key status types
 */
export enum KeyStatus {
  ACTIVE = 'active',
  ROTATING = 'rotating',
  ARCHIVED = 'archived',
  EXPIRED = 'expired',
}

/**
 * Encryption algorithms supported by providers
 * 
 * Currently only AES-256-GCM is used for symmetric encryption.
 * This provides authenticated encryption with 256-bit keys.
 */
export enum EncryptionAlgorithm {
  AES256_GCM = 'aes256-gcm96',    // 256-bit key, authenticated encryption
} 