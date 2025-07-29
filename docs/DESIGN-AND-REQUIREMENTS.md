Okay, this is where the rubber meets the road\! Developing comprehensive documentation from the outset is a hallmark of a professional, scalable, and maintainable software product. It also forces clarity in the design.

Here's a full set of design, requirements, architecture, and developer documentation for your ChalkOps platform, incorporating all our discussions, including the hybrid worker agent model and robust security.

-----

# ChalkOps Platform Documentation

**Version:** 0.1 (Initial Draft)
**Date:** 2025-07-28
**Authors:** [Your Name/Team]

-----

## Table of Contents

1.  **Introduction & Vision**
      * 1.1. Project Overview
      * 1.2. Vision & Goals
      * 1.3. Core Architectural Principles
2.  **High-Level Requirements**
      * 2.1. Functional Requirements (User Stories/Features)
      * 2.2. Non-Functional Requirements (NFRs)
          * 2.2.1. Performance
          * 2.2.2. Security
          * 2.2.3. Data Sovereignty & Compliance
          * 2.2.4. Scalability
          * 2.2.5. Reliability & Resilience
          * 2.2.6. Usability & User Experience
          * 2.2.7. Maintainability & Observability
3.  **System Architecture Overview**
      * 3.1. Conceptual Architecture Diagram
      * 3.2. Global Control Plane
      * 3.3. Regional Data Planes
      * 3.4. Worker Agent Types
      * 3.5. Key Communication Flows
4.  **Detailed Design & Implementation Guidelines**
      * 4.1. Database Design (PostgreSQL)
          * 4.1.1. Global Database Schema
          * 4.1.2. Regional Database Schema (Tenant-Specific)
          * 4.1.3. UUID v7 Usage Standard
          * 4.1.4. Naming Conventions
      * 4.2. Authentication & Authorization
          * 4.2.1. Login Flow (Password & Passkey)
          * 4.2.2. Password Hashing (Argon2id)
          * 4.2.3. Passkey (FIDO2/WebAuthn) Implementation
          * 4.2.4. JWT Structure & Verification
          * 4.2.5. Role-Based Access Control (RBAC)
      * 4.3. Secrets Management Strategy
          * 4.3.1. HashiCorp Vault Usage
          * 4.3.2. Database Secrets Storage (Permitted & Prohibited)
          * 4.3.3. Secure Credential Injection for Agents
      * 4.4. Job Orchestration & Execution
          * 4.4.1. Global Job Orchestrator
          * 4.4.2. Regional Job Dispatch & Queuing
          * 4.4.3. **Worker Agents (Common Core)**
          * 4.4.4. **Self-Hosted Agents (Our Platform)**
          * 4.4.5. **Customer-Hosted Agents (Remote Agents)**
      * 4.5. AI/LLM Integration
      * 4.6. API Design Principles
      * 4.7. Networking & Security
      * 4.8. Observability (Logging, Monitoring, Tracing)
5.  **Developer Guidelines**
      * 5.1. Tech Stack Overview
      * 5.2. Coding Standards & Best Practices
      * 5.3. Git Workflow
      * 5.4. Testing Strategy
      * 5.5. Deployment & CI/CD
6.  **QA & Testing Considerations**
      * 6.1. General Testing Approach
      * 6.2. Specific Test Areas
      * 6.3. Security Testing

-----

## 1\. Introduction & Vision

### 1.1. Project Overview

ChalkOps is an AI-powered SaaS platform designed to automate the complex and time-consuming process of migrating DevOps pipelines and code repositories between various enterprise DevOps platforms (e.g., Azure DevOps to GitLab, Jenkins to GitHub Actions). Our solution drastically reduces manual effort, risk, and downtime for enterprises, ensuring data sovereignty throughout the migration process.

### 1.2. Vision & Goals

  * **Vision:** To be the leading, most trusted, and most secure solution for enterprise DevOps platform migrations globally.
  * **Key Goals:**
      * Provide a highly automated, AI-driven migration experience.
      * Guarantee strict data sovereignty adherence for sensitive customer data.
      * Offer flexible deployment options (cloud-hosted & customer-hosted agents).
      * Deliver enterprise-grade security, scalability, and reliability.
      * Significantly reduce migration time and cost for customers.

### 1.3. Core Architectural Principles

  * **Data Sovereignty First:** All sensitive tenant operational data and user authentication PII must reside and be processed within the customer's specified geographic region/country.
  * **Hybrid Multi-Tenancy:** Separation of global control plane from regional data planes, ensuring isolation and compliance.
  * **Schema-per-Tenant:** Strong logical isolation within regional databases via dedicated schemas for each tenant.
  * **UUID v7 for Primary Keys:** Universal standard for all primary keys to ensure global uniqueness, distributed generation, and optimized database indexing.
  * **Multi-Method Authentication:** Support for secure password-based (Argon2id) and cutting-edge passwordless (Passkey/WebAuthn) authentication.
  * **Robust Security & Secrets Management:** Clear delineation of secret storage (Vault vs. DB) and adherence to least privilege.
  * **Agent-Based Hybrid Execution:** Offloading compute-intensive and sensitive data processing to agents, either self-hosted or customer-deployed, dramatically enhancing data sovereignty and cost efficiency.
  * **Scalability & Resilience:** Designed for horizontal scaling, high availability, and fault tolerance across distributed components.
  * **Observability:** Comprehensive logging, monitoring, and tracing for proactive issue detection and rapid debugging.

-----

## 2\. High-Level Requirements

### 2.1. Functional Requirements (User Stories/Features)

  * **Authentication & User Management:**
      * As a user, I can register a new tenant account by providing a unique human-readable `Tenant Name`.
      * As a user, I can create an initial administrator user account for my tenant.
      * As a user, I can log in using my `Tenant Name`, `Username/Email`, and `Password`.
      * As a user, I can log in using my `Tenant Name`, `Username/Email`, and a registered Passkey.
      * As an administrator, I can invite other users to my tenant.
      * As a user, I can reset my password securely.
      * As a user, I can register and manage multiple Passkeys for my account.
      * As a user, I can manage my profile (e.g., change email, update Passkeys).
  * **Migration Job Management:**
      * As a user, I can initiate a new migration job for a specific source/target DevOps platform pair.
      * As a user, I can configure migration parameters (e.g., specific repositories, branches, pipeline definitions to include/exclude).
      * As a user, I can monitor the progress of active migration jobs in real-time.
      * As a user, I can view detailed logs for completed or failed migration jobs.
      * As a user, I can pause, resume, or cancel a migration job.
      * As a user, I can review AI-generated pipeline transformations before applying them.
  * **Platform Integration:**
      * As a user, I can securely store credentials for my source and target DevOps platforms (e.g., GitHub, GitLab, Azure DevOps, Jenkins).
      * As a user, I can select specific repositories and pipelines from connected source platforms.
  * **Agent Management (NEW):**
      * As an administrator, I can deploy a self-hosted agent (containerized) within my internal network.
      * As an administrator, I can view the status and health of my deployed remote agents from the ChalkOps platform.
      * As an administrator, I can monitor the compute, storage, and network resource consumption of my remote agents.
      * As an administrator, I can deploy multiple remote agents for horizontal scalability.
      * As an administrator, I can configure network access for my remote agents (e.g., proxy settings).
      * As the ChalkOps system, I can intelligently assign migration jobs to available self-hosted agents within a customer's environment.
  * **Reporting & Auditing:**
      * As a user, I can view a history of all migration jobs for my tenant.
      * As an administrator, I can audit user activity within my tenant.

### 2.2. Non-Functional Requirements (NFRs)

#### 2.2.1. Performance

  * Login time: \< 1 second (perceived), actual processing \< 500ms.
  * API response times: \< 500ms for typical data retrieval/updates.
  * Migration job initiation: \< 5 seconds to schedule.
  * Agent communication latency: \< 200ms for command/status updates.
  * Scalability for migration volume: Support for migrating 1000s of repositories/pipelines concurrently across all tenants.

#### 2.2.2. Security

  * **Authentication:** Adherence to OWASP ASVS Level 3 for authentication. Argon2id for password hashing. Passkey (FIDO2/WebAuthn) support for phishing resistance.
  * **Authorization:** Strict RBAC. Least privilege principle enforced.
  * **Data in Transit:** All network communication (client-to-server, server-to-server, agent-to-server) must use TLS 1.2+ (or VPN tunnel).
  * **Data at Rest:** All sensitive data (database, object storage, secrets) must be encrypted at rest using strong, regularly rotated keys.
  * **Secrets Management:** Dedicated secrets management system (HashiCorp Vault) for application credentials and customer integration secrets.
  * **Input Validation:** Robust input validation on all API endpoints to prevent injection attacks (SQLi, XSS, etc.).
  * **Vulnerability Management:** Regular security audits, penetration testing, and vulnerability scanning.
  * **Threat Detection:** Implement IP blacklisting and brute-force protection.
  * **Agent Security:** Remote agents must be hardened, sandboxed, and have minimal attack surface. Secure JIT credential handling.

#### 2.2.3. Data Sovereignty & Compliance

  * **Tenant Data Localization:** Customer's sensitive operational data (source code, pipeline configs, migration artifacts, detailed logs) and associated user authentication PII (username, hashed password, Passkey public keys) must be stored and processed within the customer's specified geographic region/country.
  * **Compliance:** Design for compliance with GDPR, CCPA, and similar regional data protection regulations.
  * **Auditability:** Comprehensive audit logs for all data access and processing.

#### 2.2.4. Scalability

  * **Horizontal Scalability:** All Stateless services (API Gateways, orchestrators) must be horizontally scalable.
  * **Database Scalability:** Regional databases designed for read/write scaling (e.g., read replicas, connection pooling).
  * **Worker Agents:** Ability to scale worker agents (both self-hosted and customer-hosted) horizontally to meet demand.
  * **Messaging:** Message queues capable of handling high throughput for job dispatch.

#### 2.2.5. Reliability & Resilience

  * **High Availability:** Redundant deployments for all critical services across multiple availability zones within a region.
  * **Fault Tolerance:** Graceful degradation in case of component failures.
  * **Data Backup & Recovery:** Regular, automated backups of all databases and persistent storage, with tested recovery procedures.
  * **Disaster Recovery:** Defined RTO/RPO for each service tier.

#### 2.2.6. Usability & User Experience

  * Intuitive and responsive web UI.
  * Clear status updates and progress indicators for migrations.
  * Comprehensive and accessible documentation for deploying and managing remote agents.

#### 2.2.7. Maintainability & Observability

  * Clean, modular code with clear interfaces.
  * Comprehensive structured logging with unique IDs (UUID v7) for correlation.
  * Extensive monitoring dashboards and alerting for all system components.
  * End-to-end tracing for complex requests and job execution.
  * Automated testing for all code changes.

-----

## 3\. System Architecture Overview

### 3.1. Conceptual Architecture Diagram

```mermaid
graph TD
    subgraph Global Control Plane (Primary Region)
        UserClients(Users / Browsers) --- CentralAPIGateway(Central API Gateway / NestJS)
        CentralAPIGateway --- GlobalPG(Global PostgreSQL DB)
        CentralAPIGateway --- GlobalJobOrchestrator(Global Job Orchestrator)
        GlobalJobOrchestrator -- Dispatches Jobs --> RegionalMsgQ(Regional Message Queue)
        GlobalJobOrchestrator -- Dispatches Jobs --> CustomerRegionalMsgQ(Customer-Specific Regional Message Queue)
    end

    subgraph Regional Data Plane (Region A - e.g., US-East)
        direction LR
        RegionalAPIGatewayA(Regional API Gateway A / NestJS) --- RegionalPGA(Regional PostgreSQL DB A)
        RegionalAPIGatewayA --- RegionalVaultA(Regional HashiCorp Vault A)
        RegionalMsgQA(Regional Message Queue A) --> SelfHostedWorkerA(Self-Hosted Worker Agent A)
        SelfHostedWorkerA --> RegionalObjectStorageA(Regional Object Storage A)
        SelfHostedWorkerA --> RegionalLLMServiceA(Regional LLM Service A)
        RegionalPGA --- RegionalAPIGatewayA
        RegionalVaultA --- RegionalAPIGatewayA
        RegionalLLMServiceA --- SelfHostedWorkerA
    end

    subgraph Regional Data Plane (Region B - e.g., EU-West)
        direction LR
        RegionalAPIGatewayB(Regional API Gateway B / NestJS) --- RegionalPGB(Regional PostgreSQL DB B)
        RegionalAPIGatewayB --- RegionalVaultB(Regional HashiCorp Vault B)
        RegionalMsgQB(Regional Message Queue B) --> SelfHostedWorkerB(Self-Hosted Worker Agent B)
        SelfHostedWorkerB --> RegionalObjectStorageB(Regional Object Storage B)
        SelfHostedWorkerB --> RegionalLLMServiceB(Regional LLM Service B)
        RegionalPGB --- RegionalAPIGatewayB
        RegionalVaultB --- RegionalAPIGatewayB
        RegionalLLMServiceB --- SelfHostedWorkerB
    end

    subgraph Customer Network (Customer X, Region A)
        direction LR
        CustomerNetworkBoundaryX((Customer Network Boundary)) --- CustomerRegionalMsgQ(Customer-Specific Regional Message Queue)
        CustomerRegionalMsgQ --> CustomerHostedWorkerX1(Customer-Hosted Worker Agent X1)
        CustomerHostedWorkerX1 --- CustomerInternalDevOps(Customer Internal DevOps Platforms)
        CustomerHostedWorkerX1 --- CustomerLocalStorage(Customer Local Storage)
        CustomerHostedWorkerX1 -. Streamed Logs .-> RegionalAPIGatewayA
        CustomerHostedWorkerX2(Customer-Hosted Worker Agent X2) --- CustomerInternalDevOps
        CustomerHostedWorkerX2 --- CustomerLocalStorage
        CustomerHostedWorkerX2 -. Streamed Logs .-> RegionalAPIGatewayA

        CustomerHostedWorkerX1 -.- VPN Tunnel (Outbound) -.- RegionalAPIGatewayA
        CustomerHostedWorkerX2 -.- VPN Tunnel (Outbound) -.- RegionalAPIGatewayA
    end

    CentralAPIGateway -- Routes to Region --> RegionalAPIGatewayA
    CentralAPIGateway -- Routes to Region --> RegionalAPIGatewayB

    Style SelfHostedWorkerA fill:#bbf,stroke:#333,stroke-width:2px
    Style SelfHostedWorkerB fill:#bbf,stroke:#333,stroke-width:2px
    Style CustomerHostedWorkerX1 fill:#fbb,stroke:#333,stroke-width:2px
    Style CustomerHostedWorkerX2 fill:#fbb,stroke:#333,stroke-width:2px

```

### 3.2. Global Control Plane

  * **Central API Gateway / NestJS Application:**
      * Single public entry point for all client requests.
      * Handles initial tenant/region routing based on `Tenant Name`.
      * Manages global IP blacklisting/rate limiting.
      * Routes authentication requests to the appropriate Regional API Gateway.
      * Routes other requests (e.g., job initiation) to the appropriate Regional API Gateway.
  * **Global PostgreSQL DB:**
      * Stores global system metadata (tenant mapping, regions, core user for ChalkOps admins, IP blacklist).
      * **NO tenant-specific operational data or user PII.**
  * **Global Job Orchestrator:**
      * High-level job scheduling and dispatch.
      * Determines which region a job belongs to.
      * Dispatches jobs to the correct Regional Message Queue or signals to a Customer-Specific Regional Message Queue.

### 3.3. Regional Data Planes

  * **Regional API Gateway / NestJS Application:**
      * Receives authenticated requests from Central API Gateway.
      * Performs tenant-specific authentication (password/Passkey verification).
      * Handles all tenant-specific CRUD operations.
      * Communicates with **self-hosted agents** via message queues.
      * Receives call-home VPN connections and commands from **customer-hosted agents**.
  * **Regional PostgreSQL DB Instance:**
      * Stores all tenant-specific data within dedicated `schema_<tenant_id>` schemas.
      * Includes user authentication data (hashed passwords, Passkey public keys), migration job details, integration configurations, etc.
  * **Regional HashiCorp Vault:**
      * Stores highly sensitive secrets:
          * API keys/credentials for customer DevOps platform integrations (e.g., GitHub, Azure DevOps tokens). These are fetched just-in-time by agents.
          * Application-level encryption keys (e.g., for disk encryption, specific DB field encryption).
          * Database credentials for regional services.
  * **Regional Message Queue (Valkey/Redis):**
      * Queues migration jobs for **self-hosted agents** within that region.
      * Can also be used for command dispatch to customer-hosted agents, or agents can poll an endpoint.
  * **Regional Object Storage (MinIO / S3-compatible):**
      * Stores large migration artifacts, temporary data, and detailed job logs *for self-hosted agent migrations*.
      * Logs streamed from customer-hosted agents are also stored here.
  * **Regional LLM Inference Service (LiteLLM + Vector DB):**
      * Provides AI capabilities (e.g., pipeline translation).
      * Deploys within each region to maintain data sovereignty for AI processing of sensitive data.

### 3.4. Worker Agent Types

  * **Self-Hosted Agents (Our Platform):**
      * Containerized workers deployed within our regional Kubernetes clusters.
      * Pulled jobs from regional message queues.
      * Perform migrations using our own cloud compute, storage, and network resources.
      * Ideal for customers without strict internal network restrictions or who prefer fully managed solutions.
  * **Customer-Hosted Agents (Remote Agents):**
      * Containerized workers (Docker image/Kubernetes manifest) provided to customers for deployment within *their* internal network.
      * Establish an **outbound VPN tunnel** to a secure DMZ-like environment within our **Regional API Gateway / Data Service**.
      * Receive commands from our platform via the VPN tunnel.
      * Perform data processing, manipulation, temporary storage, and network traffic for migrations **entirely within the customer's network**.
      * Stream sanitized logs to our platform while maintaining a local copy.
      * Scalable: Customers can deploy multiple instances for horizontal scaling; our platform intelligently distributes jobs.
      * **Major benefits:** Drastic cost savings for us (customer bears compute/storage/network), maximum data sovereignty for customer, access to internal DevOps platforms.

### 3.5. Key Communication Flows

  * **User Login (Hybrid):**
    1.  User enters `Tenant Name`, `Username/Email`, (and `Password` OR triggers Passkey).
    2.  Client sends request to `Central API Gateway`.
    3.  `Central API Gateway` resolves `Tenant Name` to `tenant_id` (UUID v7) and `assigned_region` from `Global PostgreSQL DB`.
    4.  Request is securely routed to `Regional API Gateway` in `assigned_region`.
    5.  `Regional API Gateway` (setting `search_path` to `schema_<tenant_id>`) performs either Argon2id password verification or WebAuthn/FIDO2 Passkey assertion verification against data in `Regional PostgreSQL DB`.
    6.  Upon success, `Regional API Gateway` issues a JWT.
  * **Job Submission:**
    1.  User initiates job via `Regional API Gateway` (using JWT).
    2.  `Regional API Gateway` validates request, persists job metadata in `Regional PostgreSQL DB` (`schema_<tenant_id>`).
    3.  `Regional API Gateway` dispatches job to `Global Job Orchestrator`.
    4.  `Global Job Orchestrator` determines if job should run on a **self-hosted agent** (dispatches to regional message queue) or a **customer-hosted agent** (signals to specific agent via `Regional API Gateway`).
  * **Agent Call Home & Command Processing (Customer-Hosted Agents):**
    1.  Customer-hosted agent boots up within customer network.
    2.  Agent establishes **outbound VPN tunnel** to designated endpoint on our `Regional API Gateway`.
    3.  Agent registers itself with `Regional API Gateway` (including `agent_id` UUID v7).
    4.  `Regional API Gateway` sends commands/job assignments to agent via VPN.
    5.  Agent executes commands, interacts with internal customer systems.
    6.  Agent streams sanitized logs to `Regional API Gateway`.
    7.  Agent sends job status updates to `Regional API Gateway`.

-----

## 4\. Detailed Design & Implementation Guidelines

### 4.1. Database Design (PostgreSQL)

#### 4.1.1. Global Database Schema (`public` schema in Global PostgreSQL DB)

  * **`tenants` table:**
      * `tenant_id` UUID v7 PRIMARY KEY
      * `tenant_name` VARCHAR(255) UNIQUE NOT NULL
      * `home_country` VARCHAR(100) NOT NULL
      * `data_sovereignty_required` BOOLEAN NOT NULL DEFAULT TRUE
      * `assigned_region_cluster_id` VARCHAR(100) NOT NULL
      * `assigned_regional_db_endpoint` VARCHAR(255) NOT NULL
      * `status` VARCHAR(50) NOT NULL (e.g., 'active', 'onboarding', 'suspended')
      * `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
      * `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
  * **`global_system_users` table:**
      * `user_id` UUID v7 PRIMARY KEY
      * `email` VARCHAR(255) UNIQUE NOT NULL
      * `password_hash` TEXT NOT NULL (Argon2id)
      * `role` VARCHAR(50) NOT NULL (e.g., 'super\_admin', 'support\_engineer')
      * `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
      * `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
  * **`ip_blacklist` table:**
      * `ip_address` INET PRIMARY KEY
      * `blocked_until` TIMESTAMPTZ NOT NULL
      * `reason` TEXT

#### 4.1.2. Regional Database Schema (Within `Regional PostgreSQL DB`)

  * **Tenant Schemas:** Each tenant will have a dedicated schema named `schema_<tenant_id>` (where `tenant_id` is the UUID v7 from the Global DB).
  * **Within each `schema_<tenant_id>`:**
      * **`users` table:**
          * `user_id` UUID v7 PRIMARY KEY
          * `email` VARCHAR(255) UNIQUE NOT NULL
          * `password_hash` TEXT (NULLABLE for Passkey-only users, Argon2id for password users)
          * `tenant_id` UUID v7 NOT NULL REFERENCES `Global.tenants(tenant_id)` (for clarity, though implicit via schema)
          * `tenant_user_role` VARCHAR(50) NOT NULL (e.g., 'admin', 'developer', 'viewer')
          * `status` VARCHAR(50) NOT NULL
          * `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
          * `updated_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
      * **`webauthn_credentials` table:**
          * `credential_id` UUID v7 PRIMARY KEY
          * `user_id` UUID v7 NOT NULL REFERENCES `users(user_id)`
          * `public_key` BYTEA NOT NULL
          * `sign_count` BIGINT NOT NULL DEFAULT 0
          * `aaguid` UUID
          * `transports` VARCHAR(50)[]
          * `friendly_name` VARCHAR(255)
          * `is_discoverable` BOOLEAN NOT NULL DEFAULT FALSE
          * `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
          * `last_used_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()
      * **`integrations` table:**
          * `integration_id` UUID v7 PRIMARY KEY
          * `tenant_id` UUID v7 NOT NULL
          * `platform_type` VARCHAR(100) NOT NULL (e.g., 'GITHUB\_CLOUD', 'AZURE\_DEVOPS\_SERVER')
          * `name` VARCHAR(255) NOT NULL
          * `description` TEXT
          * `vault_secret_path` VARCHAR(255) NOT NULL (path to API keys in regional Vault)
          * `created_at`, `updated_at` TIMESTAMPTZ
      * **`migration_jobs` table:**
          * `job_id` UUID v7 PRIMARY KEY
          * `tenant_id` UUID v7 NOT NULL
          * `user_id` UUID v7 NOT NULL REFERENCES `users(user_id)`
          * `source_platform_id` UUID v7 REFERENCES `integrations(integration_id)`
          * `target_platform_id` UUID v7 REFERENCES `integrations(integration_id)`
          * `status` VARCHAR(50) NOT NULL (e.g., 'pending', 'in\_progress', 'completed', 'failed', 'cancelled')
          * `job_type` VARCHAR(50) NOT NULL (e.g., 'REPO\_MIGRATION', 'PIPELINE\_CONVERSION')
          * `config_data` JSONB (JSON configuration for the job)
          * `assigned_agent_id` UUID v7 (nullable, FK to `agents.agent_id` for customer-hosted jobs)
          * `result_summary` JSONB
          * `created_at`, `updated_at`, `completed_at` TIMESTAMPTZ
      * **`migration_job_steps` table:** (details of each step within a job)
          * `step_id` UUID v7 PRIMARY KEY
          * `job_id` UUID v7 NOT NULL REFERENCES `migration_jobs(job_id)`
          * `step_name` VARCHAR(255)
          * `status` VARCHAR(50)
          * `start_time`, `end_time` TIMESTAMPTZ
          * `details` JSONB
      * **`agents` table:** (Tracks both self-hosted and customer-hosted agents)
          * `agent_id` UUID v7 PRIMARY KEY
          * `tenant_id` UUID v7 NOT NULL
          * `type` VARCHAR(50) NOT NULL (e.g., 'SELF\_HOSTED', 'CUSTOMER\_HOSTED')
          * `status` VARCHAR(50) NOT NULL (e.g., 'online', 'offline', 'busy', 'idle')
          * `version` VARCHAR(50) NOT NULL
          * `last_heartbeat` TIMESTAMPTZ NOT NULL
          * `capabilities` JSONB (e.g., supported platforms, resource indicators)
          * `current_job_id` UUID v7 REFERENCES `migration_jobs(job_id)` (nullable)
          * `ip_address` INET (for customer-hosted agents' VPN endpoint)
          * `created_at`, `updated_at` TIMESTAMPTZ

#### 4.1.3. UUID v7 Usage Standard

  * **Generation:** All new primary keys must be generated as UUID v7s. Libraries should be used that support RFC 4122 / Draft-ietf-uuidrev-rfc4122-bis, specifically v7. (e.g., `uuid-ossp` extension for PostgreSQL with `uuid_generate_v7()` function, or application-side generation).
  * **Data Type:** Use `UUID` data type in PostgreSQL for all UUID fields.
  * **Indexing:** Default B-tree indexes will benefit from the time-ordered nature of v7. Consider primary key indexes.
  * **Foreign Keys:** All foreign key references to primary keys must also use `UUID` type.

#### 4.1.4. Naming Conventions

  * **Databases:** `devops2_global_db`, `devops2_<region_code>_db`.
  * **Schemas:** `schema_<tenant_id>` (e.g., `schema_1a2b3c4d-5e6f-4a0b-9c8d-7e6f5a4b3c2d`).
  * **Tables:** Plural, lowercase, snake\_case (e.g., `users`, `migration_jobs`).
  * **Columns:** Lowercase, snake\_case (e.g., `user_id`, `password_hash`, `created_at`).

### 4.2. Authentication & Authorization

#### 4.2.1. Login Flow (Password & Passkey)

  * **Initial Request:** Client sends `Tenant Name`, `Username/Email`, and either `Password` or WebAuthn `credentialId`/`authenticatorData`/`clientDataJSON` to `Central API Gateway /auth/login`.
  * **Tenant Resolution:** `Central API Gateway` resolves `Tenant Name` to `tenant_id` and `assigned_region_cluster_id` from `Global.tenants` table.
  * **Regional Routing:** Request securely forwarded to `/auth/login` on `Regional API Gateway` for that cluster.
  * **Regional Authentication:**
    1.  `Regional API Gateway` establishes database session for `schema_<tenant_id>`.
    2.  Fetches user record (`user_id`, `password_hash` if present, etc.) by `email`.
    3.  **If Password Login:** Perform Argon2id verification of provided password against `password_hash`.
    4.  **If Passkey Login:**
          * Fetch associated `webauthn_credentials` for `user_id`.
          * Verify WebAuthn assertion using public key and `sign_count`. Increment `sign_count` on success.
    5.  On success, `Regional API Gateway` creates and signs a JWT.
    6.  JWT contains: `user_id` (UUID v7), `tenant_id` (UUID v7), `tenant_name`, `assigned_region_cluster_id`, `roles`, `exp`.

#### 4.2.2. Password Hashing (Argon2id)

  * **Algorithm:** Argon2id (RFC 9106) is the **mandatory** password hashing algorithm.
  * **Parameters:**
      * `m` (memory cost): Start with `1GiB` (2^20 KiB).
      * `t` (time cost): Start with `3` iterations.
      * `p` (parallelism cost): Start with `1` thread.
  * **Tuning:** Benchmark these parameters on production hardware to achieve a hash time between 200ms and 500ms. Adjust `m` and `t` (prioritizing `m`) to meet this target. `p` can be adjusted based on CPU cores.
  * **Libraries:** Use well-vetted libraries (e.g., `node-argon2` for Node.js).
  * **Storage:** Store full Argon2id hash string (including parameters, salt) in `password_hash` column.

#### 4.2.3. Passkey (FIDO2/WebAuthn) Implementation

  * **Relying Party ID (RP ID):** Your root domain (e.g., `app.devops2.com`). All Passkeys will be registered against this single RP ID.
  * **Registration Flow:**
      * User initiates "Add Passkey" from authenticated session.
      * `Regional API Gateway` generates WebAuthn `credentialCreationOptions` (challenge, RP, user, pubKeyCredParams).
      * Client uses WebAuthn API to interact with authenticator, generates credential.
      * Client sends `PublicKeyCredential` to `Regional API Gateway`.
      * `Regional API Gateway` verifies credential, stores `public_key`, `credential_id` (UUID v7), `sign_count`, etc. in `webauthn_credentials` table for the specific user/tenant.
  * **Authentication Flow:** As described in 4.2.1.
  * **User Management:** Allow users to view, rename, and revoke their registered Passkeys.

#### 4.2.4. JWT Structure & Verification

  * **Algorithm:** HS256 (symmetric, signed by Vault-managed key) or RS256 (asymmetric, signed by private key from Vault). RS256 preferred for scalability across services if validation is widely distributed.
  * **Payload:**
      * `sub`: `user_id` (UUID v7)
      * `tid`: `tenant_id` (UUID v7)
      * `tname`: `tenant_name` (string)
      * `rid`: `assigned_region_cluster_id` (string)
      * `roles`: `tenant_user_role` (array of strings)
      * `iss`: Issuer (e.g., `devops2.auth.api`)
      * `exp`: Expiration (e.g., 1-2 hours)
      * `iat`: Issued at
  * **Verification:** `Central API Gateway` and `Regional API Gateways` verify JWTs for all protected routes. JWTs route requests to the correct regional cluster.

#### 4.2.5. Role-Based Access Control (RBAC)

  * Define roles: `tenant_admin`, `developer`, `viewer` for internal tenant roles.
  * Map roles to specific permissions (e.g., `tenant_admin` can manage users, create/delete jobs; `developer` can create jobs, view logs).
  * Implement authorization checks at the API Gateway level (policy enforcement point) and service level (policy decision point).

### 4.3. Secrets Management Strategy

#### 4.3.1. HashiCorp Vault Usage

  * **Regional Vault Clusters:** Deploy a HashiCorp Vault cluster in each regional data plane.
  * **Storage:**
      * Customer integration credentials (API keys, tokens for GitHub, Azure DevOps, Jenkins, etc.) are stored here, specifically for tenants assigned to that region. Organized by `tenant_id` (UUID v7) and `integration_id` (UUID v7) or a similar path.
      * Database connection strings/credentials for regional PostgreSQL DB.
      * Internal application encryption keys (e.g., for JWT signing, data encryption at rest).
  * **Access:**
      * Use Kubernetes Service Account authentication for services to authenticate with Vault.
      * Strict Vault policies (ACLs) to ensure services (e.g., Regional API Gateway, Worker Agents) can only read specific secrets they need for their assigned tasks, only for the `tenant_id` they are operating on.
  * **Transit Secret Engine:** Use Vault's Transit Secret Engine for encryption-as-a-service, e.g., if specific PII within a database field needs an additional layer of encryption, or for encrypting temporary sensitive data passing between services.

#### 4.3.2. Database Secrets Storage (Permitted & Prohibited)

  * **Permitted:**
      * Argon2id password hashes (already hashed, not reversible secrets).
      * WebAuthn Public Keys (inherently public, but secured via DB access controls).
  * **Prohibited:**
      * Plaintext passwords.
      * Customer integration API keys/tokens.
      * Any raw private keys.

#### 4.3.3. Secure Credential Injection for Agents

  * **Self-Hosted Agents:** Fetch secrets directly from the **Regional Vault** using their Kubernetes Service Account and specific Vault policies for the tenant/job they are processing.
  * **Customer-Hosted Agents:**
      * **NO direct access to our Vault.**
      * `Regional API Gateway` fetches necessary secrets from **Regional Vault** for a given job.
      * These secrets are securely transmitted *just-in-time* over the **outbound VPN tunnel** to the specific customer-hosted agent that has been assigned the job.
      * The agent receives the secrets directly in memory, uses them for the job, and **DOES NOT PERSIST** them to disk. Secrets are discarded immediately after use or job completion.
      * Encryption of secrets in transit over the VPN tunnel is implied.

### 4.4. Job Orchestration & Execution

#### 4.4.1. Global Job Orchestrator

  * Receives job requests from `Regional API Gateways`.
  * Consults `Global.tenants` to confirm region assignment.
  * Determines execution strategy: **self-hosted** or **customer-hosted agent**.
  * Dispatches job to appropriate regional queue or directly to registered customer agent via Regional API Gateway.

#### 4.4.2. Regional Job Dispatch & Queuing

  * Maintains a queue (Valkey/Redis) for jobs assigned to **self-hosted agents**.
  * Tracks available **customer-hosted agents** (via `Regional.agents` table) for tenants in its region.
  * Intelligently assigns incoming jobs to available agents, considering load, capabilities, and agent type preference.

#### 4.4.3. Worker Agents (Common Core)

  * **Containerized:** Docker image available for both deployment types.
  * **Connectivity:** Establish secure outbound VPN tunnel to `Regional API Gateway`.
  * **Command Processor:** Receives and executes commands (e.g., `clone_repo`, `transform_pipeline`, `push_repo`).
  * **Data Handling:** All data manipulation (source code, pipeline YAMLs) happens *within* the agent container's memory/local filesystem. No sensitive data leaves the agent's environment unless explicitly streamed as sanitized logs.
  * **Logging:**
      * Streams structured, sanitized logs (JSON format) over VPN tunnel to `Regional API Gateway` for central logging.
      * Maintains a local log file copy for customer debugging. PII/sensitive code must be redacted/omitted from streamed logs.
  * **Heartbeat:** Periodically sends heartbeats to `Regional API Gateway` to indicate status and availability.
  * **Resource Management:** Monitors its own resource usage (CPU, memory, disk).

#### 4.4.4. Self-Hosted Agents (Our Platform)

  * **Deployment:** Managed by our Kubernetes clusters in our cloud environment.
  * **Scaling:** KEDA-driven autoscaling based on regional message queue depth.
  * **Secrets Access:** Authenticates with `Regional HashiCorp Vault` to retrieve job-specific credentials.
  * **Storage:** Utilizes `Regional Object Storage` for temporary files, job artifacts.

#### 4.4.5. Customer-Hosted Agents (Remote Agents)

  * **Deployment:** Customer deploys the provided Docker image or K8s manifest within their internal network.
  * **VPN Tunnel:** Agent initiates an **outbound** VPN tunnel to a dedicated endpoint on our `Regional API Gateway`.
  * **Job Assignment:** `Regional API Gateway` pushes commands/jobs to the agent via the established VPN tunnel.
  * **Secrets Access:** Receives job-specific credentials securely over the VPN tunnel *from the Regional API Gateway* at job execution time; credentials are volatile in memory.
  * **Resource Consumption:** Uses customer's internal compute, temporary storage, and network egress for migration tasks.
  * **Scalability:** Customer can deploy multiple instances of the agent; our platform tracks and assigns jobs to them.

### 4.5. AI/LLM Integration

  * **Regional Deployment:** LLM Inference Service (LiteLLM) and Vector DB deployed within each regional data plane.
  * **API:** Internal API for workers to submit pipeline fragments for AI transformation and receive translated code.
  * **Data Flow:** Sensitive pipeline/code snippets for AI processing stay within the regional data plane. Vector DB for RAG is also regional.

### 4.6. API Design Principles

  * **RESTful:** Resource-oriented, using standard HTTP methods.
  * **Versioning:** `/api/v1/...`
  * **Stateless:** API servers do not store session state (rely on JWTs).
  * **JSON:** Request and response bodies.
  * **Error Handling:** Consistent error response format (e.g., HTTP status codes + JSON body with `code`, `message`, `details`).
  * **Swagger/OpenAPI:** Document all APIs for developers.

### 4.7. Networking & Security

  * **VPC & Subnets:** Segregated VPCs for Global Control Plane and each Regional Data Plane. Private subnets for databases and internal services.
  * **Security Groups/Firewalls:** Strict ingress/egress rules allowing only necessary traffic.
  * **TLS Everywhere:** Enforce TLS 1.2+ for all communication channels.
  * **VPN Tunnels:** Strong encryption and authentication for agent VPNs (e.g., IPsec or WireGuard-based).
  * **DMZ for Agent VPN Endpoints:** A dedicated, tightly controlled network zone in our cloud for incoming agent VPN connections.
  * **DDoS Protection & WAF:** Implement at the edge (Cloudflare, AWS WAF, GCP Cloud Armor).
  * **Container Security:** Use minimal base images, regularly scan for vulnerabilities, run containers with least privilege (no root).

### 4.8. Observability (Logging, Monitoring, Tracing)

  * **Logging:**
      * **Structured Logging (JSON):** All logs.
      * **Contextual IDs:** Include `tenant_id` (UUID v7), `user_id` (UUID v7), `job_id` (UUID v7), `agent_id` (UUID v7) in all relevant log entries for correlation.
      * **PII Redaction:** Implement strict PII/sensitive data redaction before logs are streamed to centralized logging.
      * **Central Aggregation:** Stream logs to a centralized system (e.g., Elasticsearch/Loki, Datadog Logs).
  * **Monitoring:**
      * **Metrics:** Collect system metrics (CPU, RAM, network, disk I/O), application metrics (request rates, error rates, latency), and business metrics (jobs completed, active agents).
      * **Tools:** Prometheus/Grafana, Datadog, or cloud-native monitoring solutions.
      * **Dashboards:** Create intuitive dashboards for SRE/Ops teams.
  * **Alerting:** Define thresholds for critical metrics and system errors, sending alerts to on-call rotations.
  * **Tracing:** Implement distributed tracing (e.g., OpenTelemetry) to follow requests across microservices and agent execution, linking traces via `job_id`, `tenant_id`, etc.

-----

## 5\. Developer Guidelines

### 5.1. Tech Stack Overview

  * **Backend (API Gateways, Orchestrators, Services):** Node.js with NestJS framework.
  * **Databases:** PostgreSQL (Primary), Valkey/Redis (Message Queues, Caching).
  * **Secrets Management:** HashiCorp Vault.
  * **Object Storage:** MinIO (compatible with S3 API).
  * **Container Orchestration:** Kubernetes (EKS/GKE/AKS).
  * **Worker Agents:** Node.js (containerized).
  * **AI/ML:** Python (for LLM processing logic), LiteLLM, Vector DB.
  * **Cloud Providers:** [To be determined, e.g., AWS, GCP, Azure - cross-cloud strategy implies multi-provider support].

### 5.2. Coding Standards & Best Practices

  * **Language Specific:** Adhere to ESLint rules for TypeScript/JavaScript.
  * **Clean Code Principles:** Readability, maintainability, modularity.
  * **Error Handling:** Consistent try-catch, throw custom exceptions, proper logging of errors.
  * **Asynchronous Programming:** Use `async/await` for all asynchronous operations.
  * **Type Safety:** Strict TypeScript usage.
  * **Documentation:** JSDoc/TSDoc for all functions, classes, and modules.

### 5.3. Git Workflow

  * **Branching Strategy:** Git Flow or GitHub Flow (e.g., `main` for production, `develop` for integration, `feature/` branches).
  * **Commit Messages:** Conventional Commits standard (e.g., `feat: add new migration type`, `fix: resolve auth bug`).
  * **Pull Requests:** Mandatory for all code changes, require at least one approval.

### 5.4. Testing Strategy

  * **Unit Tests:** Mandatory for all new code, 80%+ coverage target.
  * **Integration Tests:** For service-to-service communication, database interactions.
  * **End-to-End (E2E) Tests:** Automated browser tests for critical user flows.
  * **Security Tests:** Static Application Security Testing (SAST), Dynamic Application Security Testing (DAST), regular penetration tests.
  * **Performance Tests:** Load testing, stress testing.

### 5.5. Deployment & CI/CD

  * **Automated Pipelines:** Jenkins, GitLab CI, GitHub Actions, or Azure DevOps Pipelines.
  * **Environments:** `dev`, `staging`, `production`.
  * **Containerization:** Docker for all services.
  * **Orchestration:** Kubernetes manifests (Helm charts) for deployment.
  * **Infrastructure as Code (IaC):** Terraform for cloud infrastructure provisioning.

-----

## 6\. QA & Testing Considerations

### 6.1. General Testing Approach

  * **Shift-Left Testing:** Integrate testing early in the development lifecycle.
  * **Automated Testing:** Prioritize automation for unit, integration, and E2E tests.
  * **Manual Exploratory Testing:** For complex UIs and edge cases.
  * **Regression Testing:** Ensure new features don't break existing functionality.

### 6.2. Specific Test Areas

  * **Authentication:**
      * Password login (correct/incorrect credentials, brute-force, IP blacklisting).
      * Passkey registration (various authenticators, multiple Passkeys per user).
      * Passkey login (successful, revocation, lost device scenarios).
      * Session management, JWT validity, token refresh.
      * Role-based access control enforcement.
  * **Multi-Tenancy & Data Isolation:**
      * Verify strict data isolation between tenants within the same regional DB schema.
      * Verify cross-region data isolation.
      * Ensure a user from Tenant A cannot access data from Tenant B.
  * **Migration Job Execution:**
      * End-to-end migration for all supported source/target platform pairs.
      * Testing various migration configurations (repo selection, branch filtering, pipeline options).
      * Error handling for external API failures, network interruptions.
      * AI pipeline conversion accuracy and fallback mechanisms.
  * **Agent Functionality (Self-Hosted & Customer-Hosted):**
      * **Deployment:** Ease of deployment for customer-hosted agents.
      * **Connectivity:** VPN tunnel establishment, persistence, reconnection.
      * **Job Processing:** Agent successfully receiving, executing, and reporting on jobs.
      * **Scalability:** Multiple agents per customer handling concurrent jobs.
      * **Resource Usage:** Agent correctly reporting on its resource consumption.
      * **Secrets Handling:** Agent securely receiving and discarding ephemeral credentials.
      * **Logging:** Logs streamed correctly, local logs maintained, sensitive data redacted.
      * **Agent Updates:** Verify update mechanisms.
  * **Data Sovereignty:**
      * Verify that all sensitive data for a tenant (source code, pipeline definitions, user auth PII) remains in its assigned region. This requires specific test cases for data routing and storage.
  * **Performance & Load:**
      * Load testing API endpoints.
      * Load testing migration throughput with varying number of agents and job sizes.
      * Latency tests for critical paths.
  * **Resilience & Disaster Recovery:**
      * Failover testing for database replicas, service instances.
      * Simulated region failures.
      * Backup and restore testing.

### 6.3. Security Testing

  * **Penetration Testing:** Regular external and internal penetration tests.
  * **Vulnerability Scanning:** Automated scans of application code, container images, and infrastructure.
  * **Security Audits:** Review code for common vulnerabilities (OWASP Top 10).
  * **Authentication & Authorization Specific Tests:** Brute-force, credential stuffing, broken access control, session hijacking.
  * **Data Exposure Testing:** Attempt to access data from other tenants, or data in unauthorized regions.

-----