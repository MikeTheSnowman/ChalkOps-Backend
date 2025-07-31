import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { CacheConfig } from '../types/interfaces/cache.interfaces';

/**
 * Memory Cache Service Implementation
 * 
 * In-memory cache for development and testing
 * Not suitable for production (data lost on restart)
 */
@Injectable()
export class MemoryCacheService {
  private readonly logger = LoggerService.createLogger('memory-cache-service');
  private cache = new Map<string, { value: string; expiry?: number }>();
  private readonly config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.logger.log('Memory cache service initialized');
  }

  /**
   * Get a value from memory cache
   */
  async get(key: string): Promise<string | null> {
    try {
      const fullKey = this.getFullKey(key);
      const item = this.cache.get(fullKey);
      
      if (!item) {
        return null;
      }

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        this.cache.delete(fullKey);
        return null;
      }

      return item.value;
    } catch (error) {
      this.logger.error('Memory cache get error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Set a value in memory cache
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
      
      this.cache.set(fullKey, { value, expiry });
    } catch (error) {
      this.logger.error('Memory cache set error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set a value with TTL
   */
  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    return this.set(key, value, ttlSeconds);
  }

  /**
   * Delete a key from memory cache
   */
  async del(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      this.cache.delete(fullKey);
    } catch (error) {
      this.logger.error('Memory cache del error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Increment a counter in memory cache
   */
  async incr(key: string): Promise<number> {
    try {
      const fullKey = this.getFullKey(key);
      const current = await this.get(fullKey);
      const newValue = (parseInt(current || '0', 10) + 1).toString();
      
      await this.set(fullKey, newValue);
      return parseInt(newValue, 10);
    } catch (error) {
      this.logger.error('Memory cache incr error', {
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
      const item = this.cache.get(fullKey);
      
      if (item) {
        item.expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(fullKey, item);
      }
    } catch (error) {
      this.logger.error('Memory cache expire error', {
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
      const item = this.cache.get(fullKey);
      
      if (!item || !item.expiry) {
        return -1;
      }

      const remaining = Math.floor((item.expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -1;
    } catch (error) {
      this.logger.error('Memory cache ttl error', {
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
      const item = this.cache.get(fullKey);
      
      if (!item) {
        return false;
      }

      // Check if expired
      if (item.expiry && Date.now() > item.expiry) {
        this.cache.delete(fullKey);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Memory cache exists error', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Flush all keys from memory cache
   */
  async flushdb(): Promise<void> {
    try {
      this.cache.clear();
      this.logger.log('Memory cache flushed');
    } catch (error) {
      this.logger.error('Memory cache flushdb error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Memory cache health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    latency: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      // Simple memory cache test
      await this.set('health_check', 'ok', 10);
      const value = await this.get('health_check');
      const latency = Date.now() - start;

      if (value === 'ok') {
        return { status: 'healthy', latency };
      } else {
        return { status: 'unhealthy', latency, error: 'Memory cache health check failed' };
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
   * Get memory cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    host: string;
    port: number;
    keyPrefix?: string;
    cacheSize: number;
    memoryUsage: string;
  }> {
    return {
      connected: true,
      host: 'memory',
      port: 0,
      keyPrefix: this.config.keyPrefix,
      cacheSize: this.cache.size,
      memoryUsage: `${this.cache.size} entries`,
    };
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
  }
} 