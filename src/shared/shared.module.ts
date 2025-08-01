import { Global, Module } from '@nestjs/common';
import { UuidService } from './uuid/uuid.service';
import { LoggerService } from './logging/logger.service';
import { CryptoService } from './crypto/crypto.service';
import { ConfigService } from './config/config.service';
import { PrismaService } from './database/prisma.service';
import { IpBlacklistService } from './security/ip-blacklist.service';
 import { VaultService } from './security/vault.service';
import { SecurityService } from './security/security.service';
import { SecretsServiceFactory } from './secrets/secrets.service.factory';
import { VaultSecretsProvider } from './secrets/providers/vault-secrets.provider';
import { CacheService } from './cache/cache.service';

/**
 * Shared Module for ChalkOps Platform
 * 
 * Provides all shared utilities and services as injectable dependencies
 * for use across all modules in the ChalkOps platform.
 * 
 * Marked as @Global() to make these services available throughout the app
 * without needing to import this module in every feature module.
 */
@Global()
@Module({
  providers: [
    UuidService,
    LoggerService,
    CryptoService,
    ConfigService,
    PrismaService,
    IpBlacklistService,
    VaultService,
    SecurityService,
    SecretsServiceFactory,
    VaultSecretsProvider,
    CacheService,
  ],
  exports: [
    UuidService,
    LoggerService,
    CryptoService,
    ConfigService,
    PrismaService,
    IpBlacklistService,
    VaultService,
    SecurityService,
    SecretsServiceFactory,
    VaultSecretsProvider,
    CacheService,
  ],
})
export class SharedModule {} 