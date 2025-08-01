/**
 * Domain-specific interfaces for ChalkOps Platform
 */

// UUID v7 type for all primary keys
export type UUID7 = string;

// Tenant-related types
export interface Tenant {
  tenant_id: UUID7;
  tenant_name: string;
  home_country: string;
  data_sovereignty_required: boolean;
  assigned_region_cluster_id: string;
  assigned_regional_db_endpoint: string;
  status: 'active' | 'onboarding' | 'suspended';
  created_at: string;
  updated_at: string;
}

// User-related types
export interface User {
  user_id: UUID7;
  email: string;
  password_hash?: string; // Nullable for Passkey-only users
  tenant_id: UUID7;
  tenant_user_role: 'admin' | 'developer' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface WebAuthnCredential {
  credential_id: UUID7;
  user_id: UUID7;
  public_key: string; // Base64 encoded
  sign_count: number;
  aaguid?: UUID7;
  transports?: string[];
  friendly_name?: string;
  is_discoverable: boolean;
  created_at: string;
  last_used_at: string;
}

// Integration-related types
export interface Integration {
  integration_id: UUID7;
  tenant_id: UUID7;
  platform_type: 'GITHUB_CLOUD' | 'GITHUB_ENTERPRISE' | 'GITLAB_CLOUD' | 'GITLAB_SELF_HOSTED' | 'AZURE_DEVOPS_CLOUD' | 'AZURE_DEVOPS_SERVER' | 'JENKINS';
  name: string;
  description?: string;
  vault_secret_path: string;
  created_at: string;
  updated_at: string;
}

// Job-related types
export interface MigrationJob {
  job_id: UUID7;
  tenant_id: UUID7;
  user_id: UUID7;
  source_platform_id?: UUID7;
  target_platform_id?: UUID7;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  job_type: 'REPO_MIGRATION' | 'PIPELINE_CONVERSION' | 'FULL_MIGRATION';
  config_data: Record<string, any>;
  assigned_agent_id?: UUID7;
  result_summary?: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface MigrationJobStep {
  step_id: UUID7;
  job_id: UUID7;
  step_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  start_time?: string;
  end_time?: string;
  details?: Record<string, any>;
}

// Agent-related types
export interface Agent {
  agent_id: UUID7;
  tenant_id: UUID7;
  type: 'SELF_HOSTED' | 'CUSTOMER_HOSTED';
  status: 'online' | 'offline' | 'busy' | 'idle';
  version: string;
  last_heartbeat: string;
  capabilities: Record<string, any>;
  current_job_id?: UUID7;
  ip_address?: string;
  created_at: string;
  updated_at: string;
} 