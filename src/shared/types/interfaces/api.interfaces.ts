/**
 * API-related interfaces for ChalkOps Platform
 */

import { UUID7 } from './domain.interfaces';

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
    user_id: UUID7;
    email: string;
    tenant_id: UUID7;
    tenant_name: string;
    roles: string[];
  };
}

export interface JwtPayload {
  sub: UUID7; // user_id
  tid: UUID7; // tenant_id
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
  tenant_id?: UUID7;
  user_id?: UUID7;
  job_id?: UUID7;
  agent_id?: UUID7;
  request_id?: string;
  [key: string]: any;
} 