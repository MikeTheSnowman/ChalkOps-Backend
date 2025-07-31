/**
 * Cache-related interfaces for ChalkOps Platform
 */

import { CacheType } from '../enums/cache.types';

/**
 * Cache Configuration Interface
 */
export interface CacheConfig {
  type: CacheType;
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
  retryAttempts?: number;
  retryDelay?: number;
} 