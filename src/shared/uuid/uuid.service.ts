import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

/**
 * UUID v7 Service for ChalkOps Platform
 * 
 * Provides standardized UUID v7 generation across all services.
 * UUID v7 ensures global uniqueness, distributed generation, and
 * optimized database indexing due to time-ordered nature.
 * 
 * RFC 4122 / Draft-ietf-uuidrev-rfc4122-bis compliant
 */
@Injectable()
export class UuidService {
  /**
   * Generates a UUID v7 string
   * @returns UUID v7 string in canonical format
   */
  generateV7(): string {
    return uuidv7();
  }

  /**
   * Validates if a string is a valid UUID v7
   * @param uuid - The UUID string to validate
   * @returns True if valid UUID v7, false otherwise
   */
  isValidV7(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Extracts timestamp from UUID v7
   * @param uuid - The UUID v7 string
   * @returns Date object or null if not a valid v7 UUID
   */
  getTimestampFromV7(uuid: string): Date | null {
    try {
      // UUID v7 format: timestamp (48 bits) + random (74 bits)
      // Extract timestamp from first 6 bytes
      const hex = uuid.replace(/-/g, '');
      const timestampHex = hex.substring(0, 12);
      const timestampMs = parseInt(timestampHex, 16);
      
      return new Date(timestampMs);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generates multiple UUID v7s
   * @param count - Number of UUIDs to generate
   * @returns Array of UUID v7 strings
   */
  generateMultipleV7(count: number): string[] {
    return Array.from({ length: count }, () => uuidv7());
  }

  /**
   * Validates if a UUID is time-ordered (v7, v6, v1)
   * @param uuid - The UUID string to validate
   * @returns True if time-ordered UUID
   */
  isTimeOrdered(uuid: string): boolean {
    // Check version bits (bits 4-7 of byte 6)
    const hex = uuid.replace(/-/g, '');
    const version = parseInt(hex.substring(12, 14), 16) >> 4;
    
    // v1, v6, v7 are time-ordered
    return version === 1 || version === 6 || version === 7;
  }
} 