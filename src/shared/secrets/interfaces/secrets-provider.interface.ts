/**
 * Secrets Provider Interface for ChalkOps Platform
 * 
 * Defines the contract that all secrets providers must implement.
 * This abstraction allows switching between different secrets management
 * systems (Vault, AWS Secrets Manager, Azure Key Vault, etc.) without
 * changing the application code.
 */

import {
  SecretData,
  SecretMetadata,
  EncryptedData,
  KeyInfo,
  ListSecretsResponse,
  ListKeysResponse,
  SecretsKeyRotationResponse,
  HealthCheckResponse,
  SecretsProviderConfig,
  ProviderStatusInfo,
} from '../../types/interfaces/secrets.interfaces';
import { SecretsProviderType, EncryptionAlgorithm } from '../../types/enums/secrets.types';

/**
 * Main interface for secrets providers
 */
export interface ISecretsProvider {
  /**
   * Provider type identifier
   */
  readonly providerType: SecretsProviderType;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Check if provider is ready for operations
   */
  isReady(): boolean;

  /**
   * Get provider status information
   */
  getStatus(): Promise<ProviderStatusInfo>;

  /**
   * Health check
   */
  healthCheck(): Promise<HealthCheckResponse>;

  // Core Secret Operations

  /**
   * Get a secret by path
   */
  getSecret(path: string): Promise<SecretData>;

  /**
   * Set a secret at path
   */
  setSecret(path: string, data: SecretData): Promise<void>;

  /**
   * Delete a secret at path
   */
  deleteSecret(path: string): Promise<void>;

  /**
   * List secrets at path
   */
  listSecrets(path: string, options?: { limit?: number; nextToken?: string }): Promise<ListSecretsResponse>;

  /**
   * Check if secret exists
   */
  secretExists(path: string): Promise<boolean>;

  // Encryption Operations

  /**
   * Encrypt data using specified key
   */
  encrypt(data: string, keyId: string, algorithm?: EncryptionAlgorithm): Promise<EncryptedData>;

  /**
   * Decrypt data using specified key
   */
  decrypt(encryptedData: EncryptedData): Promise<string>;

  /**
   * Encrypt data with auto-generated key
   */
  encryptWithAutoKey(data: string, algorithm?: EncryptionAlgorithm): Promise<EncryptedData>;

  // Key Management

  /**
   * Create a new encryption key
   */
  createKey(keyId: string, algorithm?: EncryptionAlgorithm, keySize?: number): Promise<KeyInfo>;

  /**
   * Get key information
   */
  getKey(keyId: string): Promise<KeyInfo>;

  /**
   * List all keys
   */
  listKeys(): Promise<ListKeysResponse>;

  /**
   * Rotate a key
   */
  rotateKey(keyId: string, force?: boolean): Promise<SecretsKeyRotationResponse>;

  /**
   * Delete a key
   */
  deleteKey(keyId: string): Promise<void>;

  /**
   * Get active key ID
   */
  getActiveKeyId(): Promise<string>;

  // Tenant Operations

  /**
   * Get tenant-specific paths
   */
  getTenantPaths(tenantId: string): {
    secrets: string;
    encryptionKeys: string;
    keyRotation: string;
  };

  /**
   * Create tenant namespace/workspace
   */
  createTenantNamespace(tenantId: string): Promise<void>;

  /**
   * Delete tenant namespace/workspace
   */
  deleteTenantNamespace(tenantId: string): Promise<void>;

  /**
   * List all tenants
   */
  listTenants(): Promise<string[]>;

  // Utility Operations

  /**
   * Get provider configuration
   */
  getConfig(): SecretsProviderConfig;

  /**
   * Validate provider configuration
   */
  validateConfig(): Promise<boolean>;

  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
} 