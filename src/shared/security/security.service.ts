/**
 * Security Service for ChalkOps Platform
 * 
 * Provides comprehensive security capabilities including:
 * - Tenant-isolated encryption keys (each tenant has its own key)
 * - Key rotation with automatic archival 
 * - Secrets management (≤5KB) with optional pre-encryption before storing in Vault
 * - Large data (files that are base64 encoded) encryption
 */

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { ISecretsProvider } from '../secrets/interfaces/secrets-provider.interface';
import { UuidService } from '../uuid/uuid.service';
import {
  VaultSecretMetadata,
  EncryptionKey,
  KeyRotationConfig,
  SecretResponse,
  RotateKeyRequest,
  KeyRotationResponse,
  SecretListResponse,
  KeyListResponse,
  EncryptedFileResponse,
} from '../types/interfaces/security.interfaces';

import { KeyStatus } from '../types/enums/secrets.types';
import { UUID7 } from '../types/interfaces/domain.interfaces';
import { SecretData, SecretMetadata } from '../types/interfaces/secrets.interfaces';
import { UUID7 as UUID7Class } from '../uuid/uuid7.class';

@Injectable()
export class SecurityService {
  private readonly logger = LoggerService.createLogger('security-service');

  private readonly DEFAULT_KEY_SIZE = 256; // 256-bit keys (AES-256 maximum)
  private readonly DEFAULT_ALGORITHM = 'aes256-gcm96'; // AES-256 with GCM mode
  private readonly DEFAULT_ROTATION_INTERVAL = 120; // 120 days (4 months) - key rotation interval
  private readonly MAX_ARCHIVED_KEYS = 3;

  constructor(
    private readonly secretsProvider: ISecretsProvider,
    private readonly uuidService: UuidService,
  ) {}



  /**
   * Store a secret directly (no encryption)
   * 
   * @description
   * Stores secrets directly in Vault without encryption.
   * Use for: API tokens, credentials, configs, non-sensitive data.
   * 
   * @param tenantId - Tenant identifier
   * @param name - Secret name/identifier
   * @param value - Secret data (string)
   * @param expiresAt - Optional expiration date
   * @param tags - Optional metadata tags
   * 
   * @returns Promise<SecretResponse> - Stored secret details
   * 
   * @throws Error if storage fails
   * 
   * @example
   * const secret = await securityService.storeSecret(
   *   'tenant-123',
   *   'api-token',
   *   'ghp_abc123...',
   *   new Date('2024-12-31'),
   *   { environment: 'production' }
   * );
   */
  async storeSecret(
    tenantId: UUID7,
    name: string,
    value: string,
    expiresAt?: Date,
    tags?: Record<string, string>,
  ): Promise<SecretResponse> {
    // Validate UUID7 parameters
    this.validateUUID7(tenantId);
    
    const secretId = this.uuidService.generateV7();
    const now = new Date();
    const paths = this.secretsProvider.getTenantPaths(tenantId);

    const metadata: SecretMetadata = {
      id: secretId,
      name,
      path: '',
      size: value.length,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      tags,
    };

    const path = `${paths.secrets}/${secretId}`;
    metadata.path = path;
    
    const secretData: SecretData = {
      value,
      metadata,
    };

    await this.secretsProvider.setSecret(path, secretData);

          return {
        id: secretId,
        tenantId,
        name,
        value,
        metadata: this.convertToVaultMetadata(metadata),
      };
  }

  /**
   * Encrypt and store a secret
   * 
   * @description
   * Encrypts secrets with AES-256-GCM and stores in Vault.
   * Use for: Sensitive data, credentials, configs that need encryption.
   * 
   * @param tenantId - Tenant identifier
   * @param name - Secret name/identifier
   * @param value - Secret data (string)
   * @param expiresAt - Optional expiration date
   * @param tags - Optional metadata tags
   * 
   * @returns Promise<SecretResponse> - Encrypted and stored secret details
   * 
   * @throws Error if encryption or storage fails
   * 
   * @example
   * const secret = await securityService.encryptAndStoreSecret(
   *   'tenant-123',
   *   'sensitive-config',
   *   'encrypted-password',
   *   new Date('2024-12-31'),
   *   { environment: 'production' }
   * );
   */
  async encryptAndStoreSecret(
    tenantId: UUID7,
    name: string,
    value: string,
    expiresAt?: Date,
    tags?: Record<string, string>,
  ): Promise<SecretResponse> {
    // Validate UUID7 parameters
    this.validateUUID7(tenantId);
    
    const secretId = this.uuidService.generateV7();
    const now = new Date();
    const paths = this.secretsProvider.getTenantPaths(tenantId);

    const metadata: SecretMetadata = {
      id: secretId,
      name,
      path: '',
      size: value.length,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      tags,
    };

    // Ensure tenant has an active encryption key
    const activeKey = await this.ensureActiveKey(tenantId);
    
    // Encrypt the data using the secrets provider
    const encryptedData = await this.secretsProvider.encrypt(value, activeKey.keyId);

    const path = `${paths.secrets}/${secretId}`;
    metadata.path = path;
    
    const secretData: SecretData = {
      encryptedData,
      metadata,
    };

    await this.secretsProvider.setSecret(path, secretData);

    return {
      id: secretId,
      tenantId,
      name,
      encryptedData: encryptedData.ciphertext,
      keyId: activeKey.keyId,
      algorithm: encryptedData.algorithm as string,
      iv: encryptedData.iv || '',
      metadata: this.convertToVaultMetadata(metadata),
    };
  }

  /**
   * Encrypt a file (base64 encoded) and return encrypted data
   * Note: This does NOT store the encrypted file in Vault
   */
  async encryptFile(tenantId: UUID7, base64File: string): Promise<EncryptedFileResponse> {
    try {
      // Validate UUID7 parameters
      this.validateUUID7(tenantId);
      
      this.logger.log('Encrypting file', {
        tenantId,
        fileSize: base64File.length,
      });

      // Ensure tenant has an active encryption key
      const activeKey = await this.ensureActiveKey(tenantId);
      
      // Encrypt the file data using the secrets provider
      const encryptedData = await this.secretsProvider.encrypt(base64File, activeKey.keyId);

      return {
        encryptedData: encryptedData.ciphertext,
        keyId: activeKey.keyId,
        algorithm: encryptedData.algorithm as string,
        iv: encryptedData.iv || '',
        originalSize: base64File.length,
      };
    } catch (error) {
      this.logger.error('Failed to encrypt file', {
        tenantId,
        error: error.message,
      });
      throw new Error(`File encryption failed: ${error.message}`);
    }
  }

  /**
   * Retrieve a secret
   */
  async getSecret(tenantId: UUID7, secretId: string): Promise<SecretResponse> {
    try {
      // Validate UUID7 parameters
      this.validateUUID7(tenantId);
      
      this.logger.log('Retrieving secret', { tenantId, secretId });

      const paths = this.secretsProvider.getTenantPaths(tenantId);
      
      // Get secret from secrets path
      const secretPath = `${paths.secrets}/${secretId}`;
      const secret = await this.secretsProvider.getSecret(secretPath);
      
      if (secret && secret.value) {
        return {
          id: secretId,
          tenantId,
          name: secret.metadata.name,
          value: secret.value,
          metadata: this.convertToVaultMetadata(secret.metadata),
        };
      }

      if (secret && secret.encryptedData) {
        return {
          id: secretId,
          tenantId,
          name: secret.metadata.name,
          encryptedData: secret.encryptedData.ciphertext,
          keyId: secret.encryptedData.keyId,
          algorithm: secret.encryptedData.algorithm as string,
          iv: secret.encryptedData.iv || '',
          metadata: this.convertToVaultMetadata(secret.metadata),
        };
      }

      throw new Error(`Secret not found: ${secretId}`);
    } catch (error) {
      this.logger.error('Failed to retrieve secret', {
        tenantId,
        secretId,
        error: error.message,
      });
      throw new Error(`Secret retrieval failed: ${error.message}`);
    }
  }

  /**
   * Decrypt a large secret
   */
  async decryptSecret(tenantId: UUID7, secretId: string): Promise<string> {
    try {
      // Validate UUID7 parameters
      this.validateUUID7(tenantId);
      
      const secret = await this.getSecret(tenantId, secretId);
      
      if (secret.value) {
        return secret.value;
      }

      if (!secret.encryptedData || !secret.keyId) {
        throw new Error('Invalid encrypted secret data');
      }

      // Decrypt using the secrets provider
      const decryptedData = await this.secretsProvider.decrypt({
        ciphertext: secret.encryptedData,
        keyId: secret.keyId,
        algorithm: secret.algorithm as any,
        iv: secret.iv,
      });

      return decryptedData;
    } catch (error) {
      this.logger.error('Failed to decrypt secret', {
        tenantId,
        secretId,
        error: error.message,
      });
      throw new Error(`Secret decryption failed: ${error.message}`);
    }
  }

  /**
   * Delete a secret
   */
  async deleteSecret(tenantId: UUID7, secretId: string): Promise<void> {
    try {
      // Validate UUID7 parameters
      this.validateUUID7(tenantId);
      
      this.logger.log('Deleting secret', { tenantId, secretId });

      const paths = this.secretsProvider.getTenantPaths(tenantId);
      
      // Delete from secrets path
      await this.secretsProvider.deleteSecret(`${paths.secrets}/${secretId}`);
    } catch (error) {
      this.logger.error('Failed to delete secret', {
        tenantId,
        secretId,
        error: error.message,
      });
      throw new Error(`Secret deletion failed: ${error.message}`);
    }
  }

  /**
   * List all secrets for a tenant
   */
  async listSecrets(tenantId: UUID7): Promise<SecretListResponse> {
    try {
      // Validate UUID7 parameters
      this.validateUUID7(tenantId);
      
      this.logger.log('Listing secrets', { tenantId });

      const paths = this.secretsProvider.getTenantPaths(tenantId);
      const secrets: VaultSecretMetadata[] = [];

      // List secrets
      try {
        const secretsList = await this.secretsProvider.listSecrets(paths.secrets);
        for (const secret of secretsList.secrets) {
          secrets.push(this.convertToVaultMetadata(secret));
        }
      } catch (error) {
        // No secrets found
      }

      return {
        tenantId,
        secrets,
        totalCount: secrets.length,
      };
    } catch (error) {
      this.logger.error('Failed to list secrets', {
        tenantId,
        error: error.message,
      });
      throw new Error(`Secret listing failed: ${error.message}`);
    }
  }

  /**
   * Rotate encryption keys for a tenant
   */
  async rotateKeys(request: RotateKeyRequest): Promise<KeyRotationResponse> {
    try {
      this.logger.log('Rotating encryption keys', {
        tenantId: request.tenantId,
        force: request.force,
      });

      const activeKey = await this.getActiveKey(request.tenantId);
      if (!activeKey && !request.force) {
        throw new Error('No active key found for rotation');
      }

      // Create new key
      const newKey = await this.createEncryptionKey(request.tenantId);
      
      // Archive old key if it exists
      let archivedKeys: EncryptionKey[] = [];
      if (activeKey) {
        await this.archiveKey(request.tenantId, activeKey.keyId);
        archivedKeys = await this.getArchivedKeys(request.tenantId);
      }

      return {
        oldKeyId: activeKey?.keyId || '',
        newKeyId: newKey.keyId,
        rotationDate: new Date(),
        archivedKeys,
      };
    } catch (error) {
      this.logger.error('Failed to rotate keys', {
        tenantId: request.tenantId,
        error: error.message,
      });
      throw new Error(`Key rotation failed: ${error.message}`);
    }
  }

  /**
   * List encryption keys for a tenant
   */
  async listKeys(tenantId: UUID7): Promise<KeyListResponse> {
    try {
      // Validate UUID7 parameters
      this.validateUUID7(tenantId);
      
      const keys = await this.getAllKeys(tenantId);
      const activeKey = keys.find(key => key.status === KeyStatus.ACTIVE);
      
      return {
        tenantId,
        keys,
        activeKeyId: activeKey?.keyId || '',
        totalCount: keys.length,
      };
    } catch (error) {
      this.logger.error('Failed to list keys', {
        tenantId,
        error: error.message,
      });
      throw new Error(`Key listing failed: ${error.message}`);
    }
  }

  /**
   * Ensure tenant has an active encryption key
   */
  private async ensureActiveKey(tenantId: UUID7): Promise<EncryptionKey> {
    const activeKey = await this.getActiveKey(tenantId);
    if (activeKey) {
      return activeKey;
    }

    // Create new active key
    return await this.createEncryptionKey(tenantId);
  }

  /**
   * Get active encryption key for tenant
   */
  private async getActiveKey(tenantId: UUID7): Promise<EncryptionKey | null> {
    const keys = await this.getAllKeys(tenantId);
    return keys.find(key => key.status === KeyStatus.ACTIVE) || null;
  }

  /**
   * Get all encryption keys for tenant
   */
  private async getAllKeys(tenantId: UUID7): Promise<EncryptionKey[]> {
    const paths = this.secretsProvider.getTenantPaths(tenantId);
    const keys: EncryptionKey[] = [];

    try {
      const keyData = await this.secretsProvider.listKeys();
      for (const key of keyData.keys) {
        keys.push(this.convertToEncryptionKey(key));
      }
    } catch (error) {
      // No keys found
    }

    return keys;
  }

  /**
   * Get archived keys for tenant
   */
  private async getArchivedKeys(tenantId: UUID7): Promise<EncryptionKey[]> {
    const keys = await this.getAllKeys(tenantId);
    return keys.filter(key => key.status === KeyStatus.ARCHIVED);
  }

  /**
   * Create new encryption key for tenant
   */
  private async createEncryptionKey(tenantId: UUID7): Promise<EncryptionKey> {
    const keyId = this.uuidService.generateV7();
    const now = new Date();

    const key: EncryptionKey = {
      id: keyId,
      tenantId,
      keyId,
      status: KeyStatus.ACTIVE,
      algorithm: this.DEFAULT_ALGORITHM,
      keySize: this.DEFAULT_KEY_SIZE,
      createdAt: now,
    };

    const paths = this.secretsProvider.getTenantPaths(tenantId);
    await this.secretsProvider.createKey(keyId);

    this.logger.log('Created new encryption key', {
      tenantId,
      keyId,
      algorithm: key.algorithm,
      keySize: key.keySize,
    });

    return key;
  }

  /**
   * Archive an encryption key
   */
  private async archiveKey(tenantId: UUID7, keyId: string): Promise<void> {
    const paths = this.secretsProvider.getTenantPaths(tenantId);
    
    // TODO: Implement key archiving with the secrets provider
    this.logger.log('Archived encryption key', { tenantId, keyId });

    // Clean up old archived keys (keep only MAX_ARCHIVED_KEYS)
    await this.cleanupArchivedKeys(tenantId);
  }

  /**
   * Clean up old archived keys
   */
  private async cleanupArchivedKeys(tenantId: UUID7): Promise<void> {
    const archivedKeys = await this.getArchivedKeys(tenantId);
    
    if (archivedKeys.length > this.MAX_ARCHIVED_KEYS) {
      // Sort by archived date and remove oldest
      const sortedKeys = archivedKeys.sort((a, b) => 
        new Date(a.archivedAt!).getTime() - new Date(b.archivedAt!).getTime()
      );
      
      const keysToRemove = sortedKeys.slice(0, archivedKeys.length - this.MAX_ARCHIVED_KEYS);
      
      for (const key of keysToRemove) {
        await this.secretsProvider.deleteKey(key.keyId);
      }
    }
  }

  /**
   * TODO: Implement automatic key rotation
   * 
   * This method should be called periodically (e.g., daily) to check if keys need rotation.
   * It should:
   * 1. Check all tenants for keys that are older than DEFAULT_ROTATION_INTERVAL days
   * 2. Automatically rotate keys that are due for rotation
   * 3. Log rotation activities for audit purposes
   * 4. Handle rotation failures gracefully
   * 
   * Implementation considerations:
   * - Should be called by a scheduled job/cron
   * - Should be tenant-aware (each tenant has their own rotation schedule)
   * - Should respect tenant-specific rotation intervals if configured
   * - Should handle rotation failures without breaking the service
   * - Should provide metrics/alerting for rotation activities
   */
  async performAutomaticKeyRotation(): Promise<void> {
    // TODO: Implement automatic key rotation logic
    // 1. Get all tenants
    // 2. For each tenant, check if active key needs rotation
    // 3. Rotate keys that are older than DEFAULT_ROTATION_INTERVAL days
    // 4. Log rotation activities
    // 5. Handle errors gracefully
    
    throw new Error('Automatic key rotation not yet implemented');
  }

  /**
   * TODO: Check if a key needs rotation based on age
   * 
   * This method should determine if a key is due for rotation based on:
   * - Key creation date
   * - DEFAULT_ROTATION_INTERVAL or tenant-specific interval
   * - Key status (active keys only)
   * 
   * @param key - The encryption key to check
   * @returns true if key should be rotated, false otherwise
   */
  private shouldRotateKey(key: EncryptionKey): boolean {
    // TODO: Implement key rotation check logic
    // 1. Calculate days since key creation
    // 2. Compare against DEFAULT_ROTATION_INTERVAL
    // 3. Consider tenant-specific rotation intervals if configured
    // 4. Only rotate active keys
    
    throw new Error('Key rotation check not yet implemented');
  }

  /**
   * TODO: Get all tenants for automatic rotation
   * 
   * This method should return all tenant IDs that need to be checked for key rotation.
   * Implementation depends on how tenants are managed in the system.
   * 
   * @returns Array of tenant IDs to check for rotation
   */
  private async getTenantsForRotation(): Promise<UUID7[]> {
    // TODO: Implement tenant retrieval for rotation
    // 1. Get all active tenants from the system
    // 2. Filter tenants that have encryption keys
    // 3. Consider tenant-specific rotation schedules
    // 4. Handle pagination if there are many tenants
    
    throw new Error('Tenant retrieval for rotation not yet implemented');
  }

  /**
   * Convert SecretMetadata to VaultSecretMetadata
   */
  private convertToVaultMetadata(metadata: SecretMetadata): VaultSecretMetadata {
    return {
      id: metadata.id,
      tenantId: metadata.id, // Using metadata.id as tenantId for now
      name: metadata.name,
      size: metadata.size,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      expiresAt: metadata.expiresAt,
      tags: metadata.tags,
    };
  }

  /**
   * Validate that a string is base64 encoded
   */
  private validateBase64(data: string): void {
    try {
      // Check if it's a valid base64 string
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(data)) {
        throw new Error('Invalid base64 format');
      }
      
      // Try to decode it to ensure it's valid
      const decoded = Buffer.from(data, 'base64');
      if (decoded.length === 0 && data.length > 0) {
        throw new Error('Invalid base64 content');
      }
    } catch (error) {
      throw new Error(`Large data must be base64 encoded: ${error.message}`);
    }
  }

  /**
   * Validate that a string is a valid UUID v7
   */
  private validateUUID7(uuid: string): void {
    if (!UUID7Class.isValid(uuid)) {
      throw new Error(`Invalid UUID v7 format: ${uuid}`);
    }
  }

  /**
   * Convert KeyInfo to EncryptionKey
   */
  private convertToEncryptionKey(keyInfo: any): EncryptionKey {
    return {
      id: keyInfo.id,
      tenantId: '', // Will be set by caller
      keyId: keyInfo.id,
      status: keyInfo.status as KeyStatus,
      algorithm: keyInfo.algorithm,
      keySize: keyInfo.keySize,
      createdAt: keyInfo.createdAt,
      expiresAt: keyInfo.expiresAt,
      rotationDate: keyInfo.rotationDate,
      archivedAt: keyInfo.archivedAt,
    };
  }
} 