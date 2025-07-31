-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'ONBOARDING', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."GlobalUserRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT_ENGINEER');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'DEVELOPER', 'VIEWER');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."PlatformType" AS ENUM ('GITHUB_CLOUD', 'GITHUB_ENTERPRISE', 'GITLAB_CLOUD', 'GITLAB_SELF_HOSTED', 'AZURE_DEVOPS_CLOUD', 'AZURE_DEVOPS_SERVER', 'JENKINS');

-- CreateEnum
CREATE TYPE "public"."JobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('REPO_MIGRATION', 'PIPELINE_CONVERSION', 'FULL_MIGRATION');

-- CreateEnum
CREATE TYPE "public"."StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "public"."AgentType" AS ENUM ('SELF_HOSTED', 'CUSTOMER_HOSTED');

-- CreateEnum
CREATE TYPE "public"."AgentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'IDLE');

-- CreateTable
CREATE TABLE "public"."tenants" (
    "id" UUID NOT NULL,
    "tenant_name" TEXT NOT NULL,
    "home_country" TEXT NOT NULL,
    "data_sovereignty_required" BOOLEAN NOT NULL DEFAULT true,
    "assigned_region_cluster_id" TEXT NOT NULL,
    "assigned_regional_db_endpoint" TEXT NOT NULL,
    "status" "public"."TenantStatus" NOT NULL DEFAULT 'ONBOARDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."global_system_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."GlobalUserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_system_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ip_blacklist" (
    "ip_address" TEXT NOT NULL,
    "blocked_until" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ip_blacklist_pkey" PRIMARY KEY ("ip_address")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "tenant_id" UUID NOT NULL,
    "tenant_user_role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."webauthn_credentials" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "public_key" BYTEA NOT NULL,
    "sign_count" BIGINT NOT NULL DEFAULT 0,
    "aaguid" UUID,
    "transports" TEXT[],
    "friendly_name" TEXT,
    "is_discoverable" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integrations" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "platform_type" "public"."PlatformType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "vault_secret_path" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."migration_jobs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "source_platform_id" UUID,
    "target_platform_id" UUID,
    "status" "public"."JobStatus" NOT NULL DEFAULT 'PENDING',
    "job_type" "public"."JobType" NOT NULL,
    "config_data" JSONB NOT NULL,
    "assigned_agent_id" UUID,
    "result_summary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "migration_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."migration_job_steps" (
    "id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "step_name" TEXT NOT NULL,
    "status" "public"."StepStatus" NOT NULL DEFAULT 'PENDING',
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "details" JSONB,

    CONSTRAINT "migration_job_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agents" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "type" "public"."AgentType" NOT NULL,
    "status" "public"."AgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "version" TEXT NOT NULL,
    "last_heartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capabilities" JSONB NOT NULL,
    "current_job_id" UUID,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_tenant_name_key" ON "public"."tenants"("tenant_name");

-- CreateIndex
CREATE UNIQUE INDEX "global_system_users_email_key" ON "public"."global_system_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "agents_current_job_id_key" ON "public"."agents"("current_job_id");

-- AddForeignKey
ALTER TABLE "public"."webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."migration_jobs" ADD CONSTRAINT "migration_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."migration_jobs" ADD CONSTRAINT "migration_jobs_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."migration_jobs" ADD CONSTRAINT "migration_jobs_source_platform_id_fkey" FOREIGN KEY ("source_platform_id") REFERENCES "public"."integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."migration_jobs" ADD CONSTRAINT "migration_jobs_target_platform_id_fkey" FOREIGN KEY ("target_platform_id") REFERENCES "public"."integrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."migration_job_steps" ADD CONSTRAINT "migration_job_steps_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."migration_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agents" ADD CONSTRAINT "agents_current_job_id_fkey" FOREIGN KEY ("current_job_id") REFERENCES "public"."migration_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
