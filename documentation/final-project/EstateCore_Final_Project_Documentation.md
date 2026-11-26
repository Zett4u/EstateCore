# ESTATECORE — REAL ESTATE MANAGEMENT SYSTEM
## Final Project Technical Documentation & Systems Integration Report

**Course:** ITEC 116 — IT Elective 4: Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student:** Cabico, Cristina O.  
**Class Section:** BSIT 4-C  
**Academic Term:** First Semester, Academic Year 2026–2027  
**Submission Date:** November 26, 2026  
**Document Version:** 1.0 (Final Comprehensive Defense Release)  

---

## TABLE OF CONTENTS

1. [Executive Summary & System Overview](#1-executive-summary--system-overview)
2. [Systems Integration Architecture & Design Topology](#2-systems-integration-architecture--design-topology)
3. [Database Architecture & Data Dictionary](#3-database-architecture--data-dictionary)
4. [RESTful API Architecture & Endpoint Catalog](#4-restful-api-architecture--endpoint-catalog)
5. [Authentication, Authorization & Application Security](#5-authentication-authorization--application-security)
6. [Backend Implementation & Design Patterns](#6-backend-implementation--design-patterns)
7. [Frontend Architecture & User Experience](#7-frontend-architecture--user-experience)
8. [Quality Assurance, Automated Verification & Security Testing](#8-quality-assurance-automated-verification--security-testing)
9. [Deployment Architecture, Containerization & Operational Runbook](#9-deployment-architecture-containerization--operational-runbook)
10. [Academic Requirements Traceability Matrix](#10-academic-requirements-traceability-matrix)
11. [Conclusion, Project Reflection & Defense Preparedness](#11-conclusion-project-reflection--defense-preparedness)
12. [Appendices](#12-appendices)

---

## 1. EXECUTIVE SUMMARY & SYSTEM OVERVIEW

### 1.1 Project Identification
- **System Title:** EstateCore Real Estate Management System
- **Academic Context:** ITEC 116 (Systems Integration and Architecture 2)
- **Primary Domain:** Enterprise Real Estate, Property Lifecycle Management, Client Inquiries, and Financial Transaction Processing.

### 1.2 Problem Statement
Traditional real estate listing systems frequently suffer from architectural decoupling issues, unprotected access controls, improper data modeling, and unsafe transaction lifecycles. Common flaws include:
1. Broken Object-Level Authorization (BOLA), where unauthorized users can modify property listings or view confidential buyer inquiries.
2. Race conditions during simultaneous property acquisitions, resulting in double-selling or inconsistent listing statuses.
3. Insecure file uploads permitting arbitrary script execution and path traversal attacks.
4. Rigid monolithic systems lacking clean separation between API gateways, business logic, data persistence, and interactive user interfaces.

### 1.3 Solution Architecture
EstateCore is engineered as a robust, enterprise-grade multi-tier web application built on NestJS (TypeScript), MySQL 8.4 (InnoDB Engine via TypeORM), and React 18 (Vite + Tailwind CSS). The system integrates seven specialized domain modules:
1. **Authentication & Session Management:** Stateless JWT authentication with server-side token revocation and strict 1-hour expiration.
2. **User Account Governance:** Role-Based Access Control (RBAC) supporting `ADMIN`, `AGENT`, and `CLIENT` personas with soft-delete capabilities.
3. **Professional Agent Registry:** Verified agent directory linking professional credentials, agency affiliations, and listing attributions.
4. **Property Listings Engine:** Multi-attribute property catalog with parametric filtering, photo management, and strict ownership validation.
5. **Inquiries Coordination:** Bidirectional communication pipeline allowing prospective buyers to query listings and track responses.
6. **Appointments Scheduling:** Conflict-checked calendar system for on-site property viewings.
7. **Property Transactions & Settlement:** Atomically isolated financial transaction processing engine featuring pessimistic row-level locking (`PESSIMISTIC_WRITE`) to ensure absolute data consistency and prevent double-sale scenarios.

---

## 2. SYSTEMS INTEGRATION ARCHITECTURE & DESIGN TOPOLOGY

### 2.1 3-Tier Layered Architecture
EstateCore follows a strict multi-tier systems integration model:

```
+-------------------------------------------------------------------------+
|                         PRESENTATION TIER                               |
|   React 18 SPA (Vite) + Tailwind CSS + Lucide Icons + Axios Interceptors |
|   State Management: Local Storage JWT + React Context                   |
+-------------------------------------------------------------------------+
                                    |
                    HTTP / HTTPS (REST API JSON)
                      Canonical Prefix: /api/v1
                                    v
+-------------------------------------------------------------------------+
|                         APPLICATION TIER                                |
|   NestJS 10 Framework (TypeScript)                                      |
|   - Global Exception Filter (Uniform Error Response RFC 7807)            |
|   - Global Validation Pipe (class-validator + class-transformer)        |
|   - Route Guards: JwtAuthGuard, RolesGuard                              |
|   - Custom Decorators: @Roles(), @CurrentUser()                         |
|   - Dependency Injection: Modular Domain Services                       |
+-------------------------------------------------------------------------+
                                    |
                         TypeORM 0.3 / MySQL Driver
                            Connection Pooling
                                    v
+-------------------------------------------------------------------------+
|                            DATA TIER                                    |
|   MySQL 8.4 Enterprise Engine (Docker Containerized, Port 3307)         |
|   - Relational Tables (InnoDB, Foreign Key Constraints, Cascades)       |
|   - ACID Concurrency Control (SELECT ... FOR UPDATE)                    |
|   - Strict Sandbox / Production Isolation Strategy                      |
+-------------------------------------------------------------------------+
```

### 2.2 Domain Module Decomposition
The application tier is partitioned into cohesive, decoupled modules:
- `AuthModule`: Manages registration, authentication, bcrypt credential verification, JWT issuance, and in-memory blacklist token revocation.
- `UsersModule`: Controls user lifecycle, profile retrieval, administrative role management, and account deactivation.
- `AgentsModule`: Handles professional agent directory profiles, PRC licensing information, and brokerage linkages.
- `PropertiesModule`: Encapsulates property listings, multi-criteria filtering, media uploads, and nested inquiry routing.
- `InquiriesModule`: Orchestrates standalone and nested property inquiries with strict role-based visibility.
- `AppointmentsModule`: Enforces calendar scheduling, future date validation, and agent conflict detection.
- `TransactionsModule`: Executes transactional settlement with atomic status transitions.

---

## 3. DATABASE ARCHITECTURE & DATA DICTIONARY

### 3.1 Relational Schema & Entity-Relationship Modeling
The database utilizes MySQL 8.4 InnoDB with strict foreign key constraints, UTF-8 collation (`utf8mb4_unicode_ci`), and audited timestamp columns (`createdAt`, `updatedAt`).

#### Core Relational Tables:
1. `users`: Master user accounts containing credentials, global roles (`ADMIN`, `AGENT`, `CLIENT`), and active status.
2. `agents`: Professional agent metadata referencing `users.id` with a 1-to-1 foreign key constraint.
3. `properties`: Real estate listings with property type, listing type (`SALE`, `RENT`), price, location, `agentId` (referencing `agents.id`), and `ownerId` (referencing `users.id`).
4. `property_photos`: Photographic assets linked via foreign key to `properties.id` with `ON DELETE CASCADE`.
5. `inquiries`: Client inquiries linked to `properties.id` and `users.id` with `ON DELETE RESTRICT` to preserve historical correspondence.
6. `appointments`: On-site viewing bookings linked to `properties.id`, client `users.id`, and agent `users.id`.
7. `property_transactions`: Financial settlement records linking `properties.id`, buyer `users.id`, and agent `agents.id`.

### 3.2 Data Dictionary

#### Table: `users`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `email` | VARCHAR(255) | No | UK | Unique user email address |
| `password` | VARCHAR(255) | No | - | Bcrypt hashed password (10 rounds) |
| `fullName` | VARCHAR(255) | No | - | Full name of the user |
| `role` | ENUM | No | - | `ADMIN`, `AGENT`, `CLIENT` (Default: `CLIENT`) |
| `contactNumber` | VARCHAR(50) | Yes | - | Primary telephone/mobile contact |
| `isActive` | TINYINT(1) | No | - | Account active flag (Default: 1) |
| `createdAt` | DATETIME(6) | No | - | Record creation timestamp |
| `updatedAt` | DATETIME(6) | No | - | Record modification timestamp |

#### Table: `agents`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `userId` | INT | No | UK, FK | Foreign key -> `users.id` (1:1) |
| `licenseNumber` | VARCHAR(100) | Yes | - | PRC real estate license number |
| `agencyName` | VARCHAR(255) | Yes | - | Real estate brokerage or agency |
| `verificationStatus`| VARCHAR(50) | No | - | Verification state (`PENDING_VERIFICATION`, `VERIFIED`) |
| `phoneNumber` | VARCHAR(50) | Yes | - | Professional direct phone line |
| `createdAt` | DATETIME(6) | No | - | Record creation timestamp |
| `updatedAt` | DATETIME(6) | No | - | Record modification timestamp |

#### Table: `properties`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `title` | VARCHAR(255) | No | - | Property listing headline |
| `description` | TEXT | No | - | Detailed architectural description |
| `propertyType` | ENUM | No | - | `HOUSE`, `CONDOMINIUM`, `TOWNHOUSE`, `COMMERCIAL`, `LAND`, `APARTMENT` |
| `listingType` | ENUM | No | - | `SALE`, `RENT` |
| `status` | ENUM | No | - | `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED` |
| `price` | DECIMAL(12,2) | No | - | Property valuation / listing price |
| `location` | VARCHAR(255) | No | - | City / District / Area |
| `address` | VARCHAR(255) | No | - | Street address |
| `bedrooms` | INT | Yes | - | Number of bedrooms |
| `bathrooms` | INT | Yes | - | Number of bathrooms |
| `floorArea` | DECIMAL(10,2) | Yes | - | Usable floor area in square meters |
| `agentId` | INT | Yes | FK | Foreign key -> `agents.id` (Nullable) |
| `ownerId` | INT | Yes | FK | Foreign key -> `users.id` (Nullable) |
| `createdAt` | DATETIME(6) | No | - | Record creation timestamp |
| `updatedAt` | DATETIME(6) | No | - | Record modification timestamp |

#### Table: `property_photos`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `propertyId` | INT | No | FK | Foreign key -> `properties.id` (CASCADE) |
| `filePath` | VARCHAR(500) | No | - | Relative media asset file path |
| `isPrimary` | TINYINT(1) | No | - | Thumbnail/featured photo flag |
| `caption` | VARCHAR(255) | Yes | - | Media description |
| `createdAt` | DATETIME(6) | No | - | Upload timestamp |

#### Table: `inquiries`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `propertyId` | INT | No | FK | Foreign key -> `properties.id` (RESTRICT) |
| `clientId` | INT | No | FK | Foreign key -> `users.id` (RESTRICT) |
| `message` | TEXT | No | - | Client inquiry content |
| `status` | VARCHAR(50) | No | - | `PENDING`, `CONTACTED`, `QUALIFIED`, `CLOSED` |
| `inquiryType` | VARCHAR(50) | Yes | - | Category (Viewing, Pricing, Financing) |
| `offerAmount` | DECIMAL(12,2) | Yes | - | Optional monetary offer amount |
| `createdAt` | DATETIME(6) | No | - | Inquiry timestamp |
| `updatedAt` | DATETIME(6) | No | - | Status update timestamp |

#### Table: `appointments`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `propertyId` | INT | No | FK | Foreign key -> `properties.id` |
| `clientId` | INT | No | FK | Foreign key -> `users.id` (Client) |
| `agentId` | INT | No | FK | Foreign key -> `users.id` (Agent) |
| `appointmentDate`| DATE | No | - | Scheduled date (YYYY-MM-DD) |
| `appointmentTime`| VARCHAR(10) | No | - | Scheduled time (HH:MM) |
| `status` | VARCHAR(50) | No | - | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `notes` | TEXT | Yes | - | Scheduling remarks and instructions |
| `createdAt` | DATETIME(6) | No | - | Booking timestamp |
| `updatedAt` | DATETIME(6) | No | - | Update timestamp |

#### Table: `property_transactions`
| Column | Type | Nullable | Key | Description |
|---|---|---|---|---|
| `id` | INT | No | PK | Auto-incrementing primary key |
| `propertyId` | INT | No | FK | Foreign key -> `properties.id` |
| `buyerId` | INT | No | FK | Foreign key -> `users.id` |
| `agentId` | INT | No | FK | Foreign key -> `agents.id` |
| `amount` | DECIMAL(12,2) | No | - | Settled monetary transaction value |
| `transactionType`| VARCHAR(50) | No | - | `SALE`, `RENT`, `LEASE` |
| `paymentMethod` | VARCHAR(50) | No | - | `BANK_TRANSFER`, `CASH`, `CHECK`, `CARD` |
| `status` | VARCHAR(50) | No | - | `COMPLETED`, `PENDING` |
| `notes` | TEXT | Yes | - | Settlement audit remarks |
| `transactionDate`| DATETIME(6) | No | - | Settlement timestamp |
| `createdAt` | DATETIME(6) | No | - | Audit creation timestamp |

---

## 4. RESTFUL API ARCHITECTURE & ENDPOINT CATALOG

### 4.1 Routing Standards & Versioning Strategy
- **Canonical API Prefix:** `/api/v1`
- **Backward Compatibility:** Rewrite middleware automatically handles legacy `/api/...` paths.
- **Total Registered Handlers:** 39 REST endpoints across 7 controllers.
- **HTTP Methods:** GET (Read/Query), POST (Creation/Authentication), PUT (Full replacement), PATCH (Partial update), DELETE (Removal/Deactivation).

### 4.2 Complete Endpoint Index

| # | HTTP Method | Path | Access Level | Description |
|---|---|---|---|---|
| 1 | POST | `/api/v1/auth/register` | Public | Register client account |
| 2 | POST | `/api/v1/auth/login` | Public | Authenticate user & issue JWT |
| 3 | POST | `/api/v1/auth/logout` | Authenticated | Revoke JWT session token |
| 4 | GET | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |
| 5 | GET | `/api/v1/users` | Admin | List all registered users |
| 6 | POST | `/api/v1/users` | Admin / Public | Create new user account |
| 7 | GET | `/api/v1/users/:id` | Admin / Self | Retrieve user by ID |
| 8 | PATCH | `/api/v1/users/:id` | Admin / Self | Partial update user record |
| 9 | PUT | `/api/v1/users/:id` | Admin / Self | Full replacement update user |
| 10 | DELETE | `/api/v1/users/:id` | Admin | Soft-delete / deactivate user |
| 11 | GET | `/api/v1/agents` | Public | Directory listing of agents |
| 12 | GET | `/api/v1/agents/:id` | Public | Retrieve agent profile by ID |
| 13 | POST | `/api/v1/agents` | Admin / Agent | Create professional agent profile |
| 14 | PATCH | `/api/v1/agents/:id` | Admin / Agent | Partial update agent profile |
| 15 | PUT | `/api/v1/agents/:id` | Admin / Agent | Full update agent profile |
| 16 | GET | `/api/v1/properties` | Public | Query property catalog with filters |
| 17 | GET | `/api/v1/properties/:id` | Public | Retrieve property specifications |
| 18 | POST | `/api/v1/properties` | Admin / Agent / Client | Create listing with ownership attribution |
| 19 | PATCH | `/api/v1/properties/:id` | Admin / Agent / Owner | Partial update property details |
| 20 | PUT | `/api/v1/properties/:id` | Admin / Agent / Owner | Full replacement update listing |
| 21 | DELETE | `/api/v1/properties/:id` | Admin / Agent / Owner | Delete property listing |
| 22 | GET | `/api/v1/properties/:id/photos` | Public | Get media photos for listing |
| 23 | POST | `/api/v1/properties/:id/photos` | Admin / Agent / Owner | Upload photographic media asset |
| 24 | POST | `/api/v1/properties/:id/inquiries` | Authenticated Client | Submit inquiry on property |
| 25 | GET | `/api/v1/properties/:id/inquiries` | Admin / Listing Agent / Owner | List inquiries for property |
| 26 | PATCH | `/api/v1/properties/:id/inquiries/:inquiryId` | Admin / Listing Agent | Update inquiry status via property |
| 27 | POST | `/api/v1/inquiries` | Authenticated Client | Create inquiry via root controller |
| 28 | GET | `/api/v1/inquiries` | Authenticated | List inquiries (role filtered) |
| 29 | GET | `/api/v1/inquiries/:id` | Admin / Agent / Participant | Get single inquiry details |
| 30 | PATCH | `/api/v1/inquiries/:id` | Admin / Agent | Update inquiry status |
| 31 | DELETE | `/api/v1/inquiries/:id` | Admin | Delete inquiry record |
| 32 | POST | `/api/v1/appointments` | Authenticated Client | Schedule viewing appointment |
| 33 | GET | `/api/v1/appointments` | Authenticated | List appointments (role filtered) |
| 34 | GET | `/api/v1/appointments/:id` | Admin / Agent / Client | Get appointment details |
| 35 | PATCH | `/api/v1/appointments/:id` | Admin / Agent / Client | Update appointment status/time |
| 36 | DELETE | `/api/v1/appointments/:id` | Admin / Agent / Client | Cancel/delete appointment |
| 37 | POST | `/api/v1/transactions` | Admin / Agent | Record atomic property sale |
| 38 | GET | `/api/v1/transactions` | Admin / Agent / Buyer | List financial transactions |
| 39 | GET | `/api/v1/transactions/:id` | Admin / Agent / Buyer | Retrieve transaction details |

---

## 5. AUTHENTICATION, AUTHORIZATION & APPLICATION SECURITY

### 5.1 JSON Web Token (JWT) Architecture
- **Cryptographic Algorithm:** HMAC-SHA256 (`HS256`).
- **Token Lifespan:** Exactly 1 hour (`3600s`).
- **Token Claims Payload:**
  ```json
  {
    "sub": 2,
    "email": "maria.santos@estatecore.local",
    "role": "AGENT",
    "agentId": 1,
    "iat": 1795594000,
    "exp": 1795597600
  }
  ```
- **Server-Side Token Revocation:** Implemented via `TokenBlacklistService`. Upon logging out, the token signature is indexed in an in-memory TTL cache for its remaining validity duration. Subsequent requests using the revoked token are immediately rejected with HTTP 401 Unauthorized.

### 5.2 Role-Based Access Control (RBAC) & Principle of Least Privilege
EstateCore defines three distinct global roles:
1. `ADMIN`: System-wide supervisory authority. Unrestricted read/write access to user management, properties, transactions, inquiries, and appointments.
2. `AGENT`: Licensed professional broker. Authorized to create listings, upload media, respond to assigned inquiries, confirm appointments, and execute sales settlements.
3. `CLIENT`: Prospective buyer, tenant, or property owner. Authorized to browse catalog listings, create personal listings, submit inquiries, and book property viewing appointments.

### 5.3 Broken Object-Level Authorization (BOLA) Prevention
BOLA vulnerabilities are mitigated through contextual ownership verification in service methods:
- Agents can only modify properties where `property.agentId === currentAgent.id`.
- Clients can only access appointments where `appointment.clientId === currentUser.id`.
- Transaction records are restricted to the buyer, listing agent, or system administrator.

### 5.4 Photo Upload Security & Traversal Hardening
Photo uploads undergo strict multi-layered validation:
1. **MIME-Type Whitelisting:** Strictly limited to `image/jpeg`, `image/png`, `image/webp`, and `image/gif`. Executable formats (`.exe`, `.php`, `.sh`, `.js`) are rejected.
2. **File Size Enforcement:** Hard cap at 5 Megabytes (5,242,880 bytes).
3. **Path Traversal Defense:** Candidate file paths are sanitized to prohibit directory traversal sequences (`..`) and null byte injection (`\0`).
4. **Filename Randomization:** Uploaded files are renamed using cryptographically secure random suffixes (`${Date.now()}-${randomBytes(8).hex}${ext}`).

### 5.5 Rate Limiting & Brute-Force Protection
An in-memory rate limiter protects `/auth/login`. Exceeding 5 consecutive failed login attempts locks the originating client identifier and issues HTTP 429 (Too Many Requests).

### 5.6 Email-Only Communication Mandate
In strict compliance with project architectural boundaries, all system notifications operate exclusively over Email (SMTP/Mock notification services). The system maintains **zero SMS libraries, dependencies, or external cellular gateways**.

---

## 6. BACKEND IMPLEMENTATION & DESIGN PATTERNS

### 6.1 NestJS Modular Dependency Injection
The backend is structured under NestJS best practices:
- **Controllers:** Responsible exclusively for HTTP route binding, status codes, and DTO extraction.
- **Services:** Encapsulate business logic, database transactions, validation, and authorization checks.
- **DTOs:** Annotated with `class-validator` and `class-transformer` to provide declarative schema enforcement before service invocation.
- **Guards:** `JwtAuthGuard` verifies cryptographic token validity; `RolesGuard` enforces `@Roles()` metadata against `currentUser.role`.
- **Global Filters:** `AllExceptionsFilter` intercepts unhandled exceptions, formatting them into standardized JSON error envelopes containing `statusCode`, `timestamp`, `path`, `method`, `error`, and `message`.

### 6.2 Atomic Concurrency Control (Double-Sale Prevention)
The `TransactionsService` employs TypeORM's `dataSource.transaction` combined with pessimistic locking:
```typescript
await this.dataSource.transaction(async (manager) => {
  const property = await manager
    .getRepository(Property)
    .createQueryBuilder('property')
    .setLock('pessimistic_write')
    .where('property.id = :id', { id: dto.propertyId })
    .getOne();

  if (property.status === PropertyStatus.SOLD) {
    throw new ConflictException(`Property ${dto.propertyId} already has status Sold.`);
  }

  property.status = PropertyStatus.SOLD;
  await manager.save(property);
  // Persist PropertyTransaction record atomically...
});
```
This guarantees that concurrent acquisition requests cannot create duplicate sales for the same property.

---

## 7. FRONTEND ARCHITECTURE & USER EXPERIENCE

### 7.1 Single-Page Application (SPA) Design
The user interface is constructed in React 18 with Vite, featuring:
- **Role-Aware Navigation:** Dynamic header and sidebar rendering appropriate controls based on the logged-in user's role.
- **Axios HTTP Client Interceptor:** Automatically injects the stored JWT `Authorization: Bearer <token>` header into all outbound requests and handles global 401 redirection.
- **Property Catalog & Filtering UI:** Interactive filtering by property type, listing type, price range, and search keywords.
- **Property Detail & Media Viewer:** Full-width photo gallery, agent contact card, inquiry submission form, and appointment scheduler.
- **Agent Directory View:** Displays licensed agent profiles, agency affiliations, and active portfolio listings.
- **Client & Agent Dashboards:** Dedicated management consoles for viewing submitted inquiries, managing scheduled appointments, and monitoring transaction statuses.

---

## 8. QUALITY ASSURANCE, AUTOMATED VERIFICATION & SECURITY TESTING

### 8.1 Automated Test Suites Summary
EstateCore is backed by an automated test harness covering all application tiers:

1. **36+ REST Endpoint Verification Suite (`scripts/test_final_project_36_endpoints.js`):**
   - **Total Tests Executed:** 46
   - **Passed:** 46
   - **Failed:** 0
   - **Pass Rate:** **100.0%**
   - **Endpoints Verified:** 41 distinct endpoints covering all 7 controllers and 8 negative security tests.

2. **Phase 5.1 Stabilization Suite (`scripts/test_phase5_1_stabilization.js`):**
   - **Verification:** Transaction atomicity, pessimistic locking, photo traversal prevention, 5MB upload limits, 1-hour JWT expiration, agentId claim presence, in-memory rate limiting (HTTP 429), and Zero SMS verification.
   - **Status:** 100% Passed.

3. **Phase 3 Security & RBAC Suite (`scripts/test_phase3_security_suite.js`):**
   - **Verification:** 60/60 automated security test vectors validating cross-agent isolation, BOLA prevention, and role boundaries.
   - **Status:** 100% Passed.

### 8.2 Database Isolation Audit
The live database `estatecore_db` has been continuously audited using `scripts/audit_live_database_isolation.js`. All tests and schema operations are strictly isolated inside the sandbox database `estatecore_test_restore`. The live database remains 100% untouched.

---

## 9. DEPLOYMENT ARCHITECTURE, CONTAINERIZATION & OPERATIONAL RUNBOOK

### 9.1 Environment Prerequisites
- Node.js: v20.x or v22.x LTS
- Docker Desktop: MySQL 8.4 Engine Container
- Ports:
  - Backend API: `3000` (Production) / `3348-3350` (Automated Test Suites)
  - Frontend SPA: `5173` (Vite Dev) / `80` (Production Nginx)
  - MySQL Database: `3307` (Host Mapping -> Container Port 3306)

### 9.2 Launching the System
```bash
# 1. Start MySQL 8.4 Docker Container
docker compose up -d

# 2. Start Backend NestJS Server
cd backend
npm install
npm run start:dev

# 3. Start Frontend React SPA
cd ../frontend
npm install
npm run dev
```

---

## 10. ACADEMIC REQUIREMENTS TRACEABILITY MATRIX

| Academic Requirement Source | Requirement Description | Implementation Status | Evidence Reference |
|---|---|---|---|
| **ITEC 116 Project (p. 2)** | Minimum of 20 REST endpoints with GET, POST, PUT/PATCH, DELETE | **EXCEEDED (39 Endpoints)** | `07_api_testing/final_36_endpoints_results.json` |
| **ITEC 116 Project (p. 2)** | At least two functional CRUD modules beyond auth | **EXCEEDED (6 CRUD Modules)** | Properties, Inquiries, Appointments, Users, Transactions, Agents |
| **ITEC 116 Project (p. 2)** | JWT-based authentication & route protection | **COMPLETED (100%)** | `auth/guards/jwt-auth.guard.ts`, 1-hr exp, token blacklist |
| **ITEC 116 Project (p. 3)** | MySQL Relational Database with TypeORM | **COMPLETED (100%)** | MySQL 8.4 InnoDB, TypeORM Entities, Migrations |
| **ITEC 116 Project (p. 3)** | Postman Collection & Environment Export | **COMPLETED (100%)** | `EstateCore_Final_Project.postman_collection.json` |
| **ITEC 116 Project (p. 3)** | SQL Database Export File | **COMPLETED (100%)** | `EstateCore_Final_Project.sql` (Verified import) |
| **ITEC 116 Project (p. 4)** | Comprehensive Technical Documentation (PDF) | **COMPLETED (100%)** | `EstateCore_Final_Project_Documentation.pdf` |
| **ITEC 116 Project (p. 7)** | 5-10 Minute Demonstration Script | **COMPLETED (100%)** | `EstateCore_5_to_10_Minute_Demo_Script.md` |
| **ITEC 116 Project (p. 8)** | Presentation Slides (.pptx) & Defense Q&A | **COMPLETED (100%)** | `EstateCore_Final_Project_Presentation.pptx`, Defense Q&A |
| **Lab Activity 03** | System Architecture & ER Modeling | **COMPLETED (100%)** | 6 Academic Entities + Appointments Table |
| **Lab Activity 04** | Database Implementation & Foreign Keys | **COMPLETED (100%)** | Cascade photo delete, restrict inquiry delete |
| **Lab Activity 05** | 19 Core REST Endpoints & Workflows | **EXCEEDED (39 Endpoints)** | All 19 Lab endpoints fully active and verified |
| **Lab Activity 06** | Security, RBAC & Token Expiration | **COMPLETED (100%)** | 1-hr JWT, server blacklist, 429 rate limit |

---

## 11. CONCLUSION, PROJECT REFLECTION & DEFENSE PREPAREDNESS

The EstateCore Real Estate Management System successfully satisfies and exceeds all academic, technical, and architectural requirements established in ITEC 116 and Laboratory Activities 03 through 06. 

By integrating a clean multi-tier architecture, robust relational modeling, enterprise-grade NestJS design patterns, rigorous input validation, atomic concurrency control, and a responsive frontend interface, EstateCore stands as a verified, secure, and production-ready enterprise prototype. The comprehensive empirical evidence, verified test suites, Postman deliverables, SQL exports, and defense presentation materials ensure complete readiness for final academic evaluation and oral defense.

---

## 12. APPENDICES

### Appendix A: Default Academic Credentials (Local Sandbox)
- **Administrator:** `admin@estatecore.local` | Password: `Password123!`
- **Licensed Agent 1 (Maria Santos):** `maria.santos@estatecore.local` | Password: `Password123!`
- **Licensed Agent 2 (Carlos Reyes):** `carlos.reyes@estatecore.local` | Password: `Password123!`
- **Verified Client 1 (Juan Dela Cruz):** `juan.delacruz@client.local` | Password: `Password123!`
- **Verified Client 2 (Elena Roxas):** `elena.roxas@client.local` | Password: `Password123!`

### Appendix B: Verification Output Signature
- **Final Test Suite:** `46 Passed / 0 Failed` (100% Pass Rate)
- **Database Import Test:** `7/7 Tables Verified Valid`
- **Postman Collection:** `46 Tested Request Items`
