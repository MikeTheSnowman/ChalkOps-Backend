import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { ConfigService } from '../config/config.service';
import { ValKeyCacheService } from './valkey-cache.service';
import { RedisCacheService } from './redis-cache.service';
import { MemoryCacheService } from './memory-cache.service';
import { CacheType } from '../types/enums/cache.types';
import { CacheConfig } from '../types/interfaces/cache.interfaces';

/**
 * Unified Cache Service for ChalkOps Platform
 * 
 * Automatically selects the appropriate cache implementation based on CACHE_TYPE
 * environment variable. Similar to how PrismaService works.
 */
@Injectable()
export class CacheService {
  private readonly logger = LoggerService.createLogger('cache-service');
  private readonly config: CacheConfig;
  private cacheClient: any; // The actual cache client (ValKey, Redis, or Memory)

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.getConfig().cache;
    this.initializeCache();
  }

  /**
   * Initialize the appropriate cache client based on configuration
   */
  private async initializeCache(): Promise<void> {
    this.logger.log('Creating cache service', {
      type: this.config.type,
      host: this.config.host,
      port: this.config.port,
    });

    switch (this.config.type) {
      case CacheType.VALKEY:
        this.cacheClient = new ValKeyCacheService(this.config);
        break;
      
      case CacheType.REDIS:
        this.cacheClient = new RedisCacheService(this.config);
        break;
      
      case CacheType.MEMORY:
        this.cacheClient = new MemoryCacheService(this.config);
        break;
      
      default:
        this.logger.warn('Unknown cache type, falling back to VALKEY', {
          type: this.config.type,
        });
        this.cacheClient = new ValKeyCacheService(this.config);
    }
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    return this.cacheClient.get(key);
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    return this.cacheClient.set(key, value, ttlSeconds);
  }

  /**
   * Set a value in cache with TTL
   */
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    return this.cacheClient.setex(key, ttlSeconds, value);
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    return this.cacheClient.del(key);
  }

  /**
   * Increment a counter in cache
   */
  async incr(key: string): Promise<number> {
    return this.cacheClient.incr(key);
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    return this.cacheClient.expire(key, ttlSeconds);
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    return this.cacheClient.ttl(key);
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    return this.cacheClient.exists(key);
  }

  /**
   * Flush all keys from current database
   */
  async flushdb(): Promise<void> {
    return this.cacheClient.flushdb();
  }

  /**
   * Health check for cache service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    return this.cacheClient.healthCheck();
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    host: string;
    port: number;
    keyPrefix?: string;
    type: string;
  }> {
    const stats = await this.cacheClient.getStats();
    return {
      ...stats,
      type: this.config.type,
    };
  }

  /**
   * Get the current cache type
   */
  getCacheType(): CacheType {
    return this.config.type;
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return this.config;
  }
} 