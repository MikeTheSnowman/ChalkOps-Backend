To break ground on ChalkOps, the core idea remains: **Build the secure backbone first, then iterate on features.**

Given the complexity, we'll aim for parallel tracks where possible, with clear dependencies.

---

## Groundbreaking Development Plan for ChalkOps

The development will proceed in phases, with an emphasis on establishing the core architecture and security foundations before diving into extensive feature development.

### Phase 0: Setup & Foundational Infrastructure (DevOps Lead, Parallel with Core Devs)

This phase establishes the bedrock for all subsequent development.

* **0.1 Cloud Infrastructure Setup (Core DevOps)**
    * Provision primary cloud accounts (e.g., AWS, GCP, Azure).
    * Set up core networking: Global VPC, regional VPCs, subnets, routing tables.
    * Establish secure connectivity between regions.
    * Configure foundational security policies (IAM roles, network ACLs, security groups).
    * **Decision:** Choose VPN technology for customer-hosted agent "call home" (e.g., OpenVPN, WireGuard endpoint in our VPC).
* **0.2 HashiCorp Vault Deployment (DevOps/Security Lead)**
    * Deploy a highly available, **central HashiCorp Vault cluster** in the primary region.
    * Implement initial authentication methods (e.g., Kubernetes service account auth, IAM auth).
    * Configure initial secrets engines (e.g., `kv-v2` for general secrets, `transit` for encryption-as-a-service, database secrets engine for dynamic DB credentials).
    * Define initial Vault policies for core services.
* **0.3 Version Control & CI/CD Bootstrap (DevOps Lead)**
    * Set up Git repositories (e.g., GitHub, GitLab) with initial monorepo or polyrepo structure.
    * Bootstrap basic CI/CD pipelines (e.g., for backend API Gateway and a placeholder Angular app):
        * Automated builds (Docker images).
        * Basic linting/security scanning.
        * Automated deployment to a `dev` environment.
* **0.4 Shared Utilities & Libraries (Core Backend Devs)**
    * Establish a common library or package for generating and handling **UUID v7s** across all services.
    * Standardize structured logging utilities (JSON format, auto-inclusion of `tenant_id`, `user_id`, `job_id`, `agent_id`).
    * Shared error handling and configuration management.
    * Core crypto utilities (e.g., Argon2id wrapper).
* **0.5 Frontend (Angular) Project Setup (Frontend Lead)**
    * Initialize the Angular project with best practices (routing, state management strategy).
    * Set up build tooling, linting, and basic component structure.

### Phase 1: Global Control Plane - Core Backbone (Backend Focus, minimal Angular)

This phase establishes the global routing and tenant management.

* **1.1 Global PostgreSQL Database (DB Lead)**
    * Deploy the `Global PostgreSQL DB` in the primary region.
    * Create the `tenants` table, `global_system_users` table, and `ip_blacklist` table as per schema.
* **1.2 Central API Gateway (Backend Devs)**
    * Implement basic NestJS application.
    * Implement the `/auth/register` endpoint for new tenant and global admin user registration:
        * Persists to `Global.tenants` and `Global.global_system_users`.
        * **Crucially:** Triggers the provisioning of the first `Regional Data Plane` components (specifically, the tenant's schema and initial user in a regional DB, this can be stubbed out for now or done manually for the first tenant).
    * Implement the `/auth/login` endpoint for global admins (password/Argon2id only).
    * Implement tenant name to region resolution logic.
    * Implement basic request forwarding/routing to (placeholder) regional APIs.
    * Integrate with `ip_blacklist` for initial security.
* **1.3 Minimal Angular UI (Frontend Devs)**
    * Build a basic login page for global administrators.
    * Build a basic tenant registration form that calls the `/auth/register` endpoint.

### Phase 2: First Regional Data Plane - Tenant Core (Backend & DB Focus)

This phase establishes the full tenant-specific authentication and data isolation.

* **2.1 Regional PostgreSQL Database (DB Lead)**
    * Deploy the first `Regional PostgreSQL DB` instance.
    * Develop the **schema-per-tenant provisioning logic** (e.g., a service that creates `schema_<tenant_id>` dynamically when a new tenant is registered or assigned to this region).
    * Define and create the `users` and `webauthn_credentials` tables *within* this tenant-specific schema.
* **2.2 Regional API Gateway (Backend Devs)**
    * Deploy the `Regional API Gateway` (NestJS).
    * Implement the `search_path` logic for every DB interaction to ensure tenant isolation.
    * Implement the full `/auth/login` endpoint:
        * Receives requests from `Central API Gateway`.
        * Handles both **password-based (Argon2id)** authentication against the tenant's schema.
        * Handles initial **Passkey (FIDO2/WebAuthn)** authentication and registration against the tenant's `webauthn_credentials` table.
        * Issues JWTs upon successful authentication (containing `tenant_id`, `user_id`, `roles`, etc.).
    * Implement placeholder `/users` endpoints for testing user creation/management within a tenant.
    * Integrate with **Regional HashiCorp Vault** for retrieving DB credentials.
* **2.3 End-to-End Tenant & User Login Slice (Team Collaboration)**
    * Verify: New tenant registration -> Regional DB schema creation -> Regional user creation -> User can log in with password -> User can register a Passkey -> User can log in with Passkey. This is a critical vertical slice.

### Phase 3: Hybrid Worker Agent Foundation & Job Orchestration (Backend & DevOps Focus)

This phase lays the groundwork for job execution and agent management.

* **3.1 Worker Agent Common Core (Backend/DevOps)**
    * Develop the base Docker image for the worker agent.
    * Implement the "call home" heartbeat mechanism (initial simple HTTP POST to `Regional API Gateway`).
    * Implement basic command reception and execution placeholder (e.g., `ping` command).
    * Implement structured logging from the agent, streaming to the `Regional API Gateway`'s logging endpoint.
    * Set up local log file retention within the agent.
* **3.2 Regional API Gateway - Agent Management Endpoints (Backend Devs)**
    * Add endpoints for agents to register (`/agents/register`) and send heartbeats (`/agents/heartbeat`).
    * Implement persistence of agent status into the `Regional.agents` table.
    * Add a basic command dispatch endpoint for testing (e.g., `/agents/<agent_id>/command`).
* **3.3 Global Job Orchestrator - Initial Logic (Backend Devs)**
    * Implement the logic to differentiate between **self-hosted** (our internal queue) and **customer-hosted** (direct communication via Regional API Gateway).
    * Start developing the job assignment logic.
* **3.4 Regional Message Queue (DevOps)**
    * Deploy Valkey/Redis instance for regional message queues.
    * Integrate `Regional API Gateway` and `Global Job Orchestrator` with this queue for self-hosted agent job dispatch.

### Phase 4: First Migration Feature & Hybrid Agent Activation (Full Team)

This phase brings a core migration capability to life, demonstrating the full power of the hybrid agent model.

* **4.1 Self-Hosted Agent Deployment & Testing (DevOps)**
    * Deploy the first **self-hosted agents** in our regional Kubernetes cluster, pulling jobs from the regional message queue.
    * Implement our internal `Regional HashiCorp Vault` integration for these agents to pull migration credentials.
* **4.2 Customer-Hosted Agent - Secure VPN & Initial Job (DevOps/Backend)**
    * Establish the secure **outbound VPN tunnel** from a mock customer network to our `Regional API Gateway`'s DMZ endpoint.
    * Develop the secure, just-in-time credential injection mechanism over the VPN.
    * Test a simple job (e.g., "list GitHub repositories") execution on a customer-hosted agent.
* **4.3 First Migration Type (Backend/Agent Devs)**
    * Focus on a **single, simplified migration type** (e.g., public GitHub repository to GitLab project).
    * Implement the migration logic within the common worker agent core.
    * Integrate AI/LLM for a very basic pipeline transformation (e.g., a simple `echo` command in Jenkinsfile to GitLab CI/CD).
* **4.4 UI for Job Submission & Agent Monitoring (Angular & Backend)**
    * Build UI to submit this first migration type.
    * Build UI to view agent status (online/offline, busy/idle).
    * Display basic job progress and streamed logs in the UI.

### Continuous & Cross-Cutting Concerns (Throughout All Phases)

* **Security:** Integrate security considerations into every design decision and code review. Automated security scanning from day one.
* **Observability:** Implement structured logging, metrics collection, and tracing from the very first lines of code. Build initial dashboards.
* **Documentation:** Maintain the living documentation (like this plan!) as development progresses.
* **Automated Testing:** Write unit, integration, and initial E2E tests for every component developed.

By following this phased approach, you'll build out the ChalkOps platform with a strong, secure, and flexible foundation, allowing you to iterate on complex features efficiently and demonstrate key value propositions early on.