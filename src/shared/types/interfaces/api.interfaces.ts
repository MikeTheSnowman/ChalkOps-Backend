/**
 * API-related interfaces for ChalkOps Platform
 */

import { UUID } from './domain.interfaces';

// Authentication types
export interface LoginRequest {
  tenant_name: string;
  email: string;
  password?: string;
  credential_id?: string;
  authenticator_data?: string;
  client_data_json?: string;
  signature?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  user: {
    user_id: UUID;
    email: string;
    tenant_id: UUID;
    tenant_name: string;
    roles: string[];
  };
}

export interface JwtPayload {
  sub: UUID; // user_id
  tid: UUID; // tenant_id
  tname: string; // tenant_name
  rid: string; // assigned_region_cluster_id
  roles: string[];
  iss: string; // issuer
  exp: number; // expiration
  iat: number; // issued at
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Logging context type
export interface LogContext {
  tenant_id?: UUID;
  user_id?: UUID;
  job_id?: UUID;
  agent_id?: UUID;
  request_id?: string;
  [key: string]: any;
} 