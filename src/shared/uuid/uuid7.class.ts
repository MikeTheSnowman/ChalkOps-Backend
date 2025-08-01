/**
 * UUID v7 Class for ChalkOps Platform
 * 
 * Provides runtime validation and type safety for UUID v7 values.
 * This class ensures that only valid UUID v7 strings can be used
 * where UUID7 type is expected.
 * 
 * RFC 4122 / Draft-ietf-uuidrev-rfc4122-bis compliant
 */

import { v7 as uuidv7 } from 'uuid';

/**
 * UUID v7 class with runtime validation
 */
export class UUID7 {
  private constructor(private readonly value: string) {}

  /**
   * Creates a UUID7 instance from a string, with validation
   * @param value - The UUID string to validate and wrap
   * @returns UUID7 instance if valid, throws error if invalid
   * @throws Error if the string is not a valid UUID v7
   */
  static create(value: string): UUID7 {
    if (!UUID7.isValid(value)) {
      throw new Error(`Invalid UUID v7 format: ${value}`);
    }
    return new UUID7(value);
  }

  /**
   * Generates a new UUID v7 and returns a UUID7 instance
   * @returns UUID7 instance with a newly generated UUID v7
   */
  static generate(): UUID7 {
    return new UUID7(uuidv7());
  }

  /**
   * Validates if a string is a valid UUID v7
   * @param value - The UUID string to validate
   * @returns True if valid UUID v7, false otherwise
   */
  static isValid(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Extracts timestamp from UUID v7
   * @param value - The UUID v7 string
   * @returns Date object or null if not a valid v7 UUID
   */
  static getTimestamp(value: string): Date | null {
    try {
      if (!UUID7.isValid(value)) {
        return null;
      }
      
      // UUID v7 format: timestamp (48 bits) + random (74 bits)
      // Extract timestamp from first 6 bytes
      const hex = value.replace(/-/g, '');
      const timestampHex = hex.substring(0, 12);
      const timestampMs = parseInt(timestampHex, 16);
      
      return new Date(timestampMs);
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if a UUID is time-ordered (v7, v6, v1)
   * @param value - The UUID string to check
   * @returns True if time-ordered UUID
   */
  static isTimeOrdered(value: string): boolean {
    try {
      // Check version bits (bits 4-7 of byte 6)
      const hex = value.replace(/-/g, '');
      const version = parseInt(hex.substring(12, 14), 16) >> 4;
      
      // v1, v6, v7 are time-ordered
      return version === 1 || version === 6 || version === 7;
    } catch (error) {
      return false;
    }
  }

  /**
   * Returns the UUID v7 string value
   * @returns The UUID v7 string
   */
  toString(): string {
    return this.value;
  }

  /**
   * Returns the UUID v7 string value (alias for toString)
   * @returns The UUID v7 string
   */
  valueOf(): string {
    return this.value;
  }

  /**
   * Extracts timestamp from this UUID v7
   * @returns Date object representing when this UUID was generated
   */
  getTimestamp(): Date | null {
    return UUID7.getTimestamp(this.value);
  }

  /**
   * Checks if this UUID is time-ordered
   * @returns True if this is a time-ordered UUID
   */
  isTimeOrdered(): boolean {
    return UUID7.isTimeOrdered(this.value);
  }

  /**
   * Compares this UUID with another UUID7 instance
   * @param other - The UUID7 instance to compare with
   * @returns True if both UUIDs have the same value
   */
  equals(other: UUID7): boolean {
    return this.value === other.value;
  }

  /**
   * Compares this UUID with a string
   * @param other - The string to compare with
   * @returns True if the string matches this UUID's value
   */
  equalsString(other: string): boolean {
    return this.value === other;
  }
} 