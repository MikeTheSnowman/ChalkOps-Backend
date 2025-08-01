import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';
import { UUID7 } from './uuid7.class';

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
   * Generates a UUID7 instance with validation
   * @returns UUID7 instance with a newly generated UUID v7
   */
  generateV7Instance(): UUID7 {
    return UUID7.generate();
  }

  /**
   * Validates if a string is a valid UUID v7
   * @param uuid - The UUID string to validate
   * @returns True if valid UUID v7, false otherwise
   */
  isValidV7(uuid: string): boolean {
    return UUID7.isValid(uuid);
  }

  /**
   * Creates a UUID7 instance from a string with validation
   * @param uuid - The UUID string to validate and wrap
   * @returns UUID7 instance if valid, throws error if invalid
   * @throws Error if the string is not a valid UUID v7
   */
  createV7Instance(uuid: string): UUID7 {
    return UUID7.create(uuid);
  }

  /**
   * Extracts timestamp from UUID v7
   * @param uuid - The UUID v7 string
   * @returns Date object or null if not a valid v7 UUID
   */
  getTimestampFromV7(uuid: string): Date | null {
    return UUID7.getTimestamp(uuid);
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
    return UUID7.isTimeOrdered(uuid);
  }
} 