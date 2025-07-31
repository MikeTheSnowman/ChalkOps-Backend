/**
 * Utility types for ChalkOps Platform
 */

import { Integration } from './domain.interfaces';

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Nullable<T> = T | null;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Platform types
export type PlatformType = Integration['platform_type'];

// Status types (these could be moved to enums later)
export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type AgentStatus = 'online' | 'offline' | 'busy' | 'idle';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type TenantStatus = 'active' | 'onboarding' | 'suspended'; 