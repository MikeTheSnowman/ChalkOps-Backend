import * as crypto from 'crypto';

/**
 * Cryptographic Service for ChalkOps Platform
 * 
 * Provides Argon2id password hashing and other cryptographic utilities
 * following OWASP ASVS Level 3 security standards.
 */

export interface Argon2Config {
  memoryCost: number; // Memory cost in KiB (2^20 = 1 GiB)
  timeCost: number;   // Time cost (iterations)
  parallelism: number; // Parallelism cost (threads)
  saltLength: number; // Salt length in bytes
  hashLength: number; // Hash length in bytes
}

export interface HashResult {
  hash: string;
  salt: string;
  config: Argon2Config;
}

export class CryptoService {
  private readonly defaultConfig: Argon2Config = {
    memoryCost: 1024 * 1024, // 1 GiB (2^20 KiB)
    timeCost: 3,              // 3 iterations
    parallelism: 1,           // 1 thread
    saltLength: 32,           // 32 bytes
    hashLength: 32,           // 32 bytes
  };

  /**
   * Hashes a password using Argon2id
   * @param password - Plain text password
   * @param config - Optional Argon2 configuration
   * @returns Promise<HashResult> - Hash, salt, and configuration
   */
  async hashPassword(password: string, config?: Partial<Argon2Config>): Promise<HashResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // TODO: Replace with actual Argon2id library
    // This is a placeholder implementation
    // Will use a proper Argon2id library like 'argon2' or 'node-argon2'
    
    const salt = this.generateSalt(finalConfig.saltLength);
    const hash = await this.argon2idHash(password, salt, finalConfig);
    
    return {
      hash,
      salt,
      config: finalConfig,
    };
  }

  /**
   * Verifies a password against a stored hash
   * @param password - Plain text password to verify
   * @param storedHash - Stored hash from database
   * @returns Promise<boolean> - True if password matches
   */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    // TODO: Implement actual Argon2id verification
    // This is a placeholder implementation
    // Will use a proper Argon2id library
    
    try {
      // Parse the stored hash to extract salt and config
      const { salt, config } = this.parseStoredHash(storedHash);
      
      // Hash the provided password with the same parameters
      const computedHash = await this.argon2idHash(password, salt, config);
      
      // Compare hashes
      return this.constantTimeCompare(computedHash, storedHash);
    } catch (error) {
      // If hash parsing fails, return false
      return false;
    }
  }

  /**
   * Generates a cryptographically secure salt
   * @param length - Salt length in bytes
   * @returns Base64 encoded salt
   */
  private generateSalt(length: number): string {
    const salt = crypto.randomBytes(length);
    return salt.toString('base64');
  }

  /**
   * Performs Argon2id hashing (placeholder implementation)
   * @param password - Plain text password
   * @param salt - Base64 encoded salt
   * @param config - Argon2 configuration
   * @returns Promise<string> - Base64 encoded hash
   */
  private async argon2idHash(
    password: string,
    salt: string,
    config: Argon2Config
  ): Promise<string> {
    // TODO: Replace with actual Argon2id implementation
    // This is a placeholder that simulates the hash format
    
    const passwordBuffer = Buffer.from(password, 'utf8');
    const saltBuffer = Buffer.from(salt, 'base64');
    
    // Simulate hash computation (replace with actual Argon2id)
    const hashBuffer = Buffer.concat([passwordBuffer, saltBuffer]);
    const hash = crypto.createHash('sha256').update(hashBuffer).digest();
    
    // Format: $argon2id$v=19$m=1048576,t=3,p=1$<salt>$<hash>
    const formattedHash = `$argon2id$v=19$m=${config.memoryCost},t=${config.timeCost},p=${config.parallelism}$${salt}$${hash.toString('base64')}`;
    
    return formattedHash;
  }

  /**
   * Parses a stored Argon2id hash to extract salt and configuration
   * @param storedHash - Stored hash string
   * @returns Object with salt and config
   */
  private parseStoredHash(storedHash: string): { salt: string; config: Argon2Config } {
    // TODO: Implement proper hash parsing
    // This is a placeholder implementation
    
    const parts = storedHash.split('$');
    if (parts.length < 6) {
      throw new Error('Invalid hash format');
    }
    
    const salt = parts[4];
    const configPart = parts[3];
    
    // Parse config from format: m=1048576,t=3,p=1
    const configMatch = configPart.match(/m=(\d+),t=(\d+),p=(\d+)/);
    if (!configMatch) {
      throw new Error('Invalid hash configuration');
    }
    
    const config: Argon2Config = {
      memoryCost: parseInt(configMatch[1]),
      timeCost: parseInt(configMatch[2]),
      parallelism: parseInt(configMatch[3]),
      saltLength: 32,
      hashLength: 32,
    };
    
    return { salt, config };
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @param a - First string
   * @param b - Second string
   * @returns True if strings are equal
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Generates a cryptographically secure random string
   * @param length - Length of the string
   * @returns Random string
   */
  generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(length);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }
} 