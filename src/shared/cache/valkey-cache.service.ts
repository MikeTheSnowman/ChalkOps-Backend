import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { CacheConfig } from '../types/interfaces/cache.interfaces';

/**
 * ValKey Cache Service Implementation
 * 
 * Specific implementation for ValKey (Redis fork)
 * Can be easily replaced with other cache implementations
 */
@Injectable()
export class ValKeyCacheService {
  private readonly logger = LoggerService.createLogger('valkey-cache-service');
  private valkeyClient: any; // Will be the actual ValKey client
  private readonly config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.initializeValKeyClient();
  }

  /**
   * Initialize ValKey client
   */
  private async initializeValKeyClient(): Promise<void> {
    try {
      // TODO: Initialize ValKey client
      // import { createClient } from 'valkey'; // or whatever the ValKey client is
      // this.valkeyClient = createClient({
      //   host: this.config.host,
      //   port: this.config.port,
      //   password: this.config.password,
      //   database: this.config.database,
      // });
      
      // For now, this is a placeholder
      this.logger.log('ValKey cache service initialized', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
      });
    } catch (error) {
      this.logger.error('Failed to initialize ValKey client', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get a value from cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key);
      const value = await this.valkeyClient.get(fullKey);
      return value;
    } catch (error) {
      this.logger.error('ValKey get error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      if (ttlSeconds) {
        await this.valkeyClient.setex(fullKey, ttlSeconds, value);
      } else {
        await this.valkeyClient.set(fullKey, value);
      }
    } catch (error) {
      this.logger.error('ValKey set error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.valkeyClient.setex(fullKey, ttlSeconds, value);
    } catch (error) {
      this.logger.error('ValKey setex error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.valkeyClient.del(fullKey);
    } catch (error) {
      this.logger.error('ValKey del error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment a counter in cache
   */
  async incr(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      return await this.valkeyClient.incr(fullKey);
    } catch (error) {
      this.logger.error('ValKey incr error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set TTL for a key
   */
  async expire(key: string, ttlSeconds: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      await this.valkeyClient.expire(fullKey, ttlSeconds);
    } catch (error) {
      this.logger.error('ValKey expire error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      return await this.valkeyClient.ttl(fullKey);
    } catch (error) {
      this.logger.error('ValKey ttl error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return -1;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.getFullKey(key);
      const result = await this.valkeyClient.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error('ValKey exists error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Flush all keys from current database
   */
  async flushdb(): Promise<void> {
    try {
      await this.valkeyClient.flushdb();
      this.logger.log('ValKey database flushed');
    } catch (error) {
      this.logger.error('ValKey flushdb error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * ValKey-specific health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      // ValKey-specific ping
      const pong = await this.valkeyClient.ping();
      const latency = Date.now() - start;

      if (pong === 'PONG') {
        return { status: 'healthy', latency };
      } else {
        return { status: 'unhealthy', latency, error: 'ValKey ping failed' };
      }
    } catch (error) {
      const latency = Date.now() - start;
      return {
        status: 'unhealthy',
        latency,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get ValKey-specific statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    host: string;
    port: number;
    keyPrefix?: string;
    valkeyVersion?: string;
    memoryUsage?: string;
  }> {
    try {
      // TODO: Get ValKey-specific stats
      // const info = await this.valkeyClient.info();
      // const memory = await this.valkeyClient.info('memory');
      
      return {
        connected: true,
        host: this.config.host,
        port: this.config.port,
        keyPrefix: this.config.keyPrefix,
        valkeyVersion: '1.0.0', // TODO: Get actual version
        memoryUsage: '0 MB', // TODO: Get actual memory usage
      };
    } catch (error) {
      this.logger.error('Failed to get ValKey stats', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        connected: false,
        host: this.config.host,
        port: this.config.port,
        keyPrefix: this.config.keyPrefix,
      };
    }
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
  }
} 