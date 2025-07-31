import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logging/logger.service';
import { ConfigService } from '../config/config.service';
import { PrismaService } from '../database/prisma.service';
import { CacheService } from '../cache/cache.service';

/**
 * IP Blacklist Service - Hybrid Cache + Database Approach
 * 
 * Uses unified cache service for fast lookups and rate limiting
 * Uses Database for audit trail and analytics
 */
@Injectable()
export class IpBlacklistService {
  private readonly logger = LoggerService.createLogger('ip-blacklist-service');

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Checks if an IP is currently blacklisted
   * Primary check: Cache (fast)
   * Fallback: Database (if cache unavailable)
   */
  async isIpBlacklisted(ipAddress: string): Promise<boolean> {
    try {
      // Primary check: Cache
      const cacheKey = `blacklist:${ipAddress}`;
      const blockedUntil = await this.cacheService.get(cacheKey);
      
      if (blockedUntil) {
        const expiryTime = new Date(parseInt(blockedUntil));
        if (expiryTime > new Date()) {
          this.logger.debug('IP found in cache blacklist', { ip_address: ipAddress });
          return true;
        } else {
          // Expired, remove from cache
          await this.cacheService.del(cacheKey);
        }
      }

      // Fallback: Database check
      const dbRecord = await this.prismaService.ipBlacklist.findFirst({
        where: {
          ip_address: ipAddress,
          blocked_until: { gt: new Date() },
          unblocked_at: null,
        },
      });

      if (dbRecord) {
        // Add to cache for future fast lookups
        const ttlSeconds = Math.floor((dbRecord.blocked_until.getTime() - Date.now()) / 1000);
        if (ttlSeconds > 0) {
          await this.cacheService.setex(cacheKey, ttlSeconds, dbRecord.blocked_until.getTime().toString());
          this.logger.debug('IP found in database blacklist, added to cache', { ip_address: ipAddress });
        }
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking IP blacklist', {
        ip_address: ipAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fail open - don't block legitimate users if blacklist is down
      return false;
    }
  }

  /**
   * Adds an IP to the blacklist
   * Updates both cache (immediate) and Database (audit)
   */
  async blacklistIp(
    ipAddress: string,
    durationMinutes: number,
    reason?: string,
    blockedBy?: string,
  ): Promise<void> {
    const blockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    const cacheKey = `blacklist:${ipAddress}`;
    const ttlSeconds = durationMinutes * 60;

    try {
      // Update cache immediately
      await this.cacheService.setex(cacheKey, ttlSeconds, blockedUntil.getTime().toString());

      // Update database for audit trail
      await this.prismaService.ipBlacklist.create({
        data: {
          ip_address: ipAddress,
          blocked_until: blockedUntil,
          reason,
          blocked_by: blockedBy,
        },
      });

      this.logger.log('IP added to blacklist', {
        ip_address: ipAddress,
        duration_minutes: durationMinutes,
        reason,
        blocked_by: blockedBy,
      });
    } catch (error) {
      this.logger.error('Error adding IP to blacklist', {
        ip_address: ipAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Removes an IP from the blacklist
   */
  async unblacklistIp(ipAddress: string, unblockedBy?: string): Promise<void> {
    const cacheKey = `blacklist:${ipAddress}`;

    try {
      // Remove from cache
      await this.cacheService.del(cacheKey);

      // Update database audit trail
      await this.prismaService.ipBlacklist.updateMany({
        where: {
          ip_address: ipAddress,
          unblocked_at: null,
        },
        data: {
          unblocked_at: new Date(),
          unblocked_by: unblockedBy,
        },
      });

      this.logger.log('IP removed from blacklist', {
        ip_address: ipAddress,
        unblocked_by: unblockedBy,
      });
    } catch (error) {
      this.logger.error('Error removing IP from blacklist', {
        ip_address: ipAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Rate limiting using cache
   */
  async checkRateLimit(ipAddress: string, maxRequests: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const key = `ratelimit:${ipAddress}`;
    
    try {
      const current = await this.cacheService.incr(key);
      
      if (current === 1) {
        // First request, set expiry
        await this.cacheService.expire(key, windowSeconds);
      }

      const ttl = await this.cacheService.ttl(key);
      const remaining = Math.max(0, maxRequests - current);
      const allowed = current <= maxRequests;

      return {
        allowed,
        remaining,
        resetTime: Date.now() + (ttl * 1000),
      };
    } catch (error) {
      this.logger.error('Error checking rate limit', {
        ip_address: ipAddress,
        error: error instanceof Error ? error.message : String(error),
      });
      // Fail open
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() };
    }
  }

  /**
   * Gets blacklist analytics
   */
  async getBlacklistAnalytics(days: number = 30): Promise<{
    totalBlocked: number;
    currentlyBlocked: number;
    topReasons: Array<{ reason: string; count: number }>;
    recentActivity: Array<{ ip_address: string; reason: string | null; created_at: Date }>;
  }> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totalBlocked, currentlyBlocked, topReasons, recentActivity] = await Promise.all([
      this.prismaService.ipBlacklist.count({
        where: { created_at: { gte: since } },
      }),
      this.prismaService.ipBlacklist.count({
        where: {
          blocked_until: { gt: new Date() },
          unblocked_at: null,
        },
      }),
      this.prismaService.ipBlacklist.groupBy({
        by: ['reason'],
        where: { created_at: { gte: since } },
        _count: { reason: true },
        orderBy: { _count: { reason: 'desc' } },
        take: 10,
      }),
      this.prismaService.ipBlacklist.findMany({
        where: { created_at: { gte: since } },
        select: { ip_address: true, reason: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 20,
      }),
    ]);

    return {
      totalBlocked,
      currentlyBlocked,
      topReasons: topReasons.map(r => ({ reason: r.reason || 'Unknown', count: r._count.reason })),
      recentActivity,
    };
  }
} 