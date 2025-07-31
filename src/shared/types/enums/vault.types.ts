/**
 * Vault-related types for ChalkOps Platform
 */

/**
 * Vault authentication methods
 */
export enum VaultAuthMethod {
  KUBERNETES = 'kubernetes',
  TOKEN = 'token',
  APPROLE = 'approle',
} 