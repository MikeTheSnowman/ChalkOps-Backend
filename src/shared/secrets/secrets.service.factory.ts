/**
 * Secrets Service Factory for ChalkOps Platform
 * 
 * Creates and configures the appropriate secrets provider based on
 * environment configuration. Supports multiple providers (Vault, AWS, Azure, etc.)
 * and allows easy switching between them.
 */

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { ConfigService } from '../config/config.service';
import { ISecretsProvider } from './interfaces/secrets-provider.interface';
import { VaultSecretsProvider } from './providers/vault-secrets.provider';
import { SecretsProviderConfig } from '../types/interfaces/secrets.interfaces';
import { SecretsProviderType } from '../types/enums/secrets.types';

@Injectable()
export class SecretsServiceFactory {
  private readonly logger = LoggerService.createLogger('secrets-service-factory');

  constructor(private readonly configService: ConfigService) {}

  /**
   * Create a secrets provider based on configuration
   */
  async createProvider(): Promise<ISecretsProvider> {
    const config = this.configService.getConfig();
    const providerType = this.getProviderTypeFromConfig();
    
    this.logger.log('Creating secrets provider', {
      type: providerType,
      environment: config.environment,
    });

    switch (providerType) {
      case SecretsProviderType.VAULT:
        return await this.createVaultProvider();
      
      case SecretsProviderType.AWS_SECRETS_MANAGER:
        return await this.createAwsSecretsProvider();
      
      case SecretsProviderType.AZURE_KEY_VAULT:
        return await this.createAzureKeyVaultProvider();
      
      case SecretsProviderType.GCP_SECRET_MANAGER:
        return await this.createGcpSecretManagerProvider();
      
      case SecretsProviderType.LOCAL:
        return await this.createLocalSecretsProvider();
      
      default:
        this.logger.warn('Unknown provider type, falling back to Vault', {
          type: providerType,
        });
        return await this.createVaultProvider();
    }
  }

  /**
   * Get provider type from configuration
   */
  private getProviderTypeFromConfig(): SecretsProviderType {
    const providerType = process.env.SECRETS_PROVIDER as SecretsProviderType;
    
    if (providerType && Object.values(SecretsProviderType).includes(providerType)) {
      return providerType;
    }

    // Default to Vault if not specified
    return SecretsProviderType.VAULT;
  }

  /**
   * Create Vault provider
   */
  private async createVaultProvider(): Promise<ISecretsProvider> {
    this.logger.log('Creating Vault secrets provider');
    const provider = new VaultSecretsProvider(this.configService);
    await provider.initialize();
    return provider;
  }

  /**
   * Create AWS Secrets Manager provider
   */
  private async createAwsSecretsProvider(): Promise<ISecretsProvider> {
    this.logger.log('Creating AWS Secrets Manager provider');
    // TODO: Implement AWS Secrets Manager provider
    throw new Error('AWS Secrets Manager provider not implemented yet');
  }

  /**
   * Create Azure Key Vault provider
   */
  private async createAzureKeyVaultProvider(): Promise<ISecretsProvider> {
    this.logger.log('Creating Azure Key Vault provider');
    // TODO: Implement Azure Key Vault provider
    throw new Error('Azure Key Vault provider not implemented yet');
  }

  /**
   * Create GCP Secret Manager provider
   */
  private async createGcpSecretManagerProvider(): Promise<ISecretsProvider> {
    this.logger.log('Creating GCP Secret Manager provider');
    // TODO: Implement GCP Secret Manager provider
    throw new Error('GCP Secret Manager provider not implemented yet');
  }

  /**
   * Create local secrets provider
   */
  private async createLocalSecretsProvider(): Promise<ISecretsProvider> {
    this.logger.log('Creating local secrets provider');
    // TODO: Implement local secrets provider
    throw new Error('Local secrets provider not implemented yet');
  }

  /**
   * Validate provider configuration
   */
  async validateProviderConfig(providerType: SecretsProviderType): Promise<boolean> {
    try {
      const provider = await this.createProvider();
      return await provider.validateConfig();
    } catch (error) {
      this.logger.error('Provider configuration validation failed', {
        providerType,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get available provider types
   */
  getAvailableProviders(): SecretsProviderType[] {
    return Object.values(SecretsProviderType);
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerType: SecretsProviderType): SecretsProviderConfig {
    const config = this.configService.getConfig();
    
    switch (providerType) {
      case SecretsProviderType.VAULT:
        return {
          type: providerType,
          url: config.vault.url,
          token: config.vault.token,
          namespace: config.vault.namespace,
        };
      
      case SecretsProviderType.AWS_SECRETS_MANAGER:
        return {
          type: providerType,
          region: process.env.AWS_REGION,
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        };
      
      case SecretsProviderType.AZURE_KEY_VAULT:
        return {
          type: providerType,
          url: process.env.AZURE_KEY_VAULT_URL,
          tenantId: process.env.AZURE_TENANT_ID,
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
        };
      
      case SecretsProviderType.GCP_SECRET_MANAGER:
        return {
          type: providerType,
          projectId: process.env.GCP_PROJECT_ID,
          keyFile: process.env.GCP_KEY_FILE,
        };
      
      case SecretsProviderType.LOCAL:
        return {
          type: providerType,
          localPath: process.env.LOCAL_SECRETS_PATH || './secrets',
        };
      
      default:
        throw new Error(`Unknown provider type: ${providerType}`);
    }
  }
} 