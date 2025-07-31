import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerService } from '../logging/logger.service';
import { ConfigService } from '../config/config.service';
import { UuidService } from '../uuid/uuid.service';
import { DatabaseError } from '../errors/error-handler.service';

/**
 * Prisma Service for ChalkOps Platform
 * 
 * Provides database access with tenant-aware schema isolation
 * and integration with shared utilities for logging and error handling.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = LoggerService.createLogger('prisma-service');

  constructor(
    private readonly configService: ConfigService,
    private readonly uuidService: UuidService,
  ) {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Failed to connect to database', {
        originalError: error,
      });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Creates a tenant-aware Prisma client for a specific tenant
   * This sets the search_path to the tenant's schema
   */
  async createTenantClient(tenantId: string): Promise<PrismaClient> {
    const tenantSchema = `schema_${tenantId}`;
    
    // Create a new Prisma client with tenant-specific configuration
    const tenantClient = new PrismaClient({
      datasources: {
        db: {
          url: this.configService.getDatabaseUrl(),
        },
      },
    });

    // Set the search path to the tenant's schema
    await tenantClient.$executeRaw`SET search_path TO ${tenantSchema}`;
    
    this.logger.debug('Created tenant client', {
      tenant_id: tenantId,
      schema: tenantSchema,
    });

    return tenantClient;
  }

  /**
   * Creates a tenant schema for a new tenant
   */
  async createTenantSchema(tenantId: string): Promise<void> {
    const tenantSchema = `schema_${tenantId}`;
    
    try {
      // Create the schema
      await this.$executeRaw`CREATE SCHEMA IF NOT EXISTS ${tenantSchema}`;
      
      // Run migrations for the tenant schema
      await this.$executeRaw`SET search_path TO ${tenantSchema}`;
      
      // Create tables in the tenant schema
      await this.createTenantTables(tenantSchema);
      
      this.logger.log('Created tenant schema', {
        tenant_id: tenantId,
        schema: tenantSchema,
      });
    } catch (error) {
      this.logger.error('Failed to create tenant schema', {
        tenant_id: tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Failed to create tenant schema', {
        tenant_id: tenantId,
        originalError: error,
      });
    }
  }

  /**
   * Creates tables in a tenant schema
   */
  private async createTenantTables(schema: string): Promise<void> {
    // Create users table
    await this.$executeRaw`
      CREATE TABLE IF NOT EXISTS ${schema}.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT,
        tenant_id UUID NOT NULL,
        tenant_user_role VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create webauthn_credentials table
    await this.$executeRaw`
      CREATE TABLE IF NOT EXISTS ${schema}.webauthn_credentials (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES ${schema}.users(id) ON DELETE CASCADE,
        public_key BYTEA NOT NULL,
        sign_count BIGINT NOT NULL DEFAULT 0,
        aaguid UUID,
        transports VARCHAR(50)[],
        friendly_name VARCHAR(255),
        is_discoverable BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create integrations table
    await this.$executeRaw`
      CREATE TABLE IF NOT EXISTS ${schema}.integrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        platform_type VARCHAR(100) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        vault_secret_path VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create migration_jobs table
    await this.$executeRaw`
      CREATE TABLE IF NOT EXISTS ${schema}.migration_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id UUID NOT NULL REFERENCES ${schema}.users(id),
        creator_id UUID NOT NULL REFERENCES ${schema}.users(id),
        source_platform_id UUID REFERENCES ${schema}.integrations(id),
        target_platform_id UUID REFERENCES ${schema}.integrations(id),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        job_type VARCHAR(50) NOT NULL,
        config_data JSONB NOT NULL,
        assigned_agent_id UUID,
        result_summary JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `;

    // Create migration_job_steps table
    await this.$executeRaw`
      CREATE TABLE IF NOT EXISTS ${schema}.migration_job_steps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES ${schema}.migration_jobs(id) ON DELETE CASCADE,
        step_name VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        details JSONB
      )
    `;

    // Create agents table
    await this.$executeRaw`
      CREATE TABLE IF NOT EXISTS ${schema}.agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE',
        version VARCHAR(50) NOT NULL,
        last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        capabilities JSONB NOT NULL,
        current_job_id UUID REFERENCES ${schema}.migration_jobs(id),
        ip_address INET,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create indexes for better performance
    await this.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_${schema}_users_email ON ${schema}.users(email)
    `;

    await this.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_${schema}_users_tenant_id ON ${schema}.users(tenant_id)
    `;

    await this.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_${schema}_migration_jobs_tenant_id ON ${schema}.migration_jobs(tenant_id)
    `;

    await this.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_${schema}_migration_jobs_status ON ${schema}.migration_jobs(status)
    `;

    await this.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_${schema}_agents_tenant_id ON ${schema}.agents(tenant_id)
    `;

    await this.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_${schema}_agents_status ON ${schema}.agents(status)
    `;
  }

  /**
   * Validates that a tenant schema exists
   */
  async validateTenantSchema(tenantId: string): Promise<boolean> {
    try {
      const result = await this.$queryRaw`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = ${`schema_${tenantId}`}
      `;
      
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      this.logger.error('Failed to validate tenant schema', {
        tenant_id: tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Gets database connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    database: string;
    host: string;
    port: number;
  }> {
    try {
      const dbConfig = this.configService.getDatabaseConfig();
      const result = await this.$queryRaw`SELECT current_database(), inet_server_addr(), inet_server_port()`;
      
      if (Array.isArray(result) && result.length > 0) {
        const row = result[0] as any;
        return {
          connected: true,
          database: row.current_database,
          host: row.inet_server_addr,
          port: parseInt(row.inet_server_port),
        };
      }
      
      return {
        connected: false,
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
      };
    } catch (error) {
      const dbConfig = this.configService.getDatabaseConfig();
      return {
        connected: false,
        database: dbConfig.database,
        host: dbConfig.host,
        port: dbConfig.port,
      };
    }
  }
} 