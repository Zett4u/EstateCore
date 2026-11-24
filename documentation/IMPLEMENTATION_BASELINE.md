# ESTATECORE &mdash; REPOSITORY & DATABASE IMPLEMENTATION BASELINE (PHASE 0)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03&ndash;06)  
**Milestone:** Phase 0 &mdash; Pre-Implementation Baseline & Risk Audit  
**Date:** November 24, 2026  
**Auditor:** Antigravity Engineering Agent  
**Live Target Database:** `estatecore_db` (Docker MySQL 8.4 on Port 3307)  
**Live Target API:** NestJS 10.3 on Port 3000

---

## 1. Executive Summary

This document establishes the verified baseline of the existing EstateCore repository and live database prior to executing the implementation phases mandated by the Master Implementation Prompt.

### Core Baseline Findings:
1. **Database Schema:** The live database `estatecore_db` contains **5 tables** (`users`, `properties`, `inquiries`, `appointments`, `migrations`). Three core PDF entities (**`Agent`**, **`PropertyPhoto`**, and **`PropertyTransaction`**) do not physically exist in the database or backend entities.
2. **Live Data Integrity:** Exactly **9 users**, **7 properties**, **6 inquiries**, **4 appointments**, and **1 migration** exist in the live database. No records have been modified, fabricated, or deleted.
3. **API Routing:** The backend currently serves routes under the global prefix **`/api`**. The PDF-mandated **`/api/v1`** prefix returns `404 Not Found` across all 19 endpoints.
4. **Application Roles:** The backend enforces **3 roles** (`ADMIN`, `AGENT`, `CLIENT`). The PDF's required roles of `Buyer/Renter` and `Seller/PropertyManager` are collapsed into `CLIENT`, preventing clients from publishing or managing listings as sellers.
5. **Notification Services:** Outbound notification services (Email and SMS) are completely absent. In accordance with the Master Prompt instructions, **Email notifications will be implemented; SMS notifications will not be implemented under any circumstances.**

---

## 2. Existing Database Architecture & Inventory

### 2.1 Table Row Counts (Verified via Live MySQL Query)

| Physical Table Name | Logical Role | Row Count | Status | PDF Entity Equivalent |
|---|---|:---:|:---:|---|
| `users` | User Accounts & Authentication | **9** | Intact | `User` (Partially aligned) |
| `properties` | Real Estate Portfolio Listings | **7** | Intact | `Property` (Partially aligned) |
| `inquiries` | Property Inquiries & Leads | **6** | Intact | `Inquiry` (Partially aligned) |
| `appointments` | Viewing Tours & Schedules | **4** | Intact | Supplemental Feature (Retained) |
| `migrations` | TypeORM Migration History | **1** | Intact | Internal Infrastructure |
| `Agent` | Licensed Real Estate Agents | **0** | **MISSING** | `Agent` (Mandatory Lab 04) |
| `PropertyPhoto` | Architectural Image Gallery | **0** | **MISSING** | `PropertyPhoto` (Mandatory Lab 04) |
| `PropertyTransaction` | Financial & Closing Records | **0** | **MISSING** | `PropertyTransaction` (Mandatory Lab 04) |

---

### 2.2 Live Data Record Inspection

#### Users (`users` &mdash; 9 records)
- **ID 1:** `System Administrator` (`admin@estatecore.local`) &mdash; Role: `ADMIN`, Active: `1`
- **ID 2:** `Maria Santos` (`maria.santos@estatecore.local`) &mdash; Role: `AGENT`, Active: `1`
- **ID 3:** `Carlos Reyes` (`carlos.reyes@estatecore.local`) &mdash; Role: `AGENT`, Active: `1`
- **ID 4:** `Juan Dela Cruz` (`juan.delacruz@client.local`) &mdash; Role: `CLIENT`, Active: `1`
- **ID 5:** `Elena Roxas` (`elena.roxas@client.local`) &mdash; Role: `CLIENT`, Active: `1`
- **IDs 6&ndash;9:** Test client accounts generated during automated RBAC isolation tests.

#### Properties (`properties` &mdash; 7 records)
- **ID 1:** *Modern High-Rise Condominium in BGC* (CONDOMINIUM / SALE / ₱18.5M) &mdash; Agent: `2` (Maria Santos)
- **ID 2:** *Spacious 4-Bedroom Suburban Family Home* (HOUSE / SALE / ₱24.0M) &mdash; Agent: `2` (Maria Santos)
- **ID 3:** *Prime Commercial Corner Lot for Development* (COMMERCIAL / SALE / ₱52.0M) &mdash; Agent: `3` (Carlos Reyes)
- **ID 4:** *Contemporary 3-Storey Townhouse* (TOWNHOUSE / RENT / ₱75K/mo) &mdash; Agent: `3` (Carlos Reyes)
- **ID 5:** *Cozy Studio Apartment in Makati CBD* (APARTMENT / RENT / ₱35K/mo) &mdash; Agent: `2` (Maria Santos)
- **ID 6:** *Scenic Agricultural & Residential Land* (LAND / SALE / ₱12.5M) &mdash; Agent: `3` (Carlos Reyes)
- **ID 17:** *Regency Villa* (CONDOMINIUM / SALE / ₱1.0M) &mdash; Created during automated Admin publishing test; Agent: `1` (Admin).

#### Inquiries (`inquiries` &mdash; 6 records)
- **ID 1:** Client `4` &rarr; Property `1`, Agent `2` &mdash; Status: `QUALIFIED`
- **ID 2:** Client `5` &rarr; Property `4`, Agent `3` &mdash; Status: `PENDING`
- **ID 3:** Client `4` &rarr; Property `2`, Agent `2` &mdash; Status: `CONTACTED`
- **ID 6:** Client `4` &rarr; Property `1`, Agent `2` &mdash; Status: `PENDING`
- **ID 7:** Client `4` &rarr; Property `1`, Agent `2` &mdash; Status: `PENDING`
- **ID 8:** Client `4` &rarr; Property `5`, Agent `2` &mdash; Status: `CLOSED`

#### Appointments (`appointments` &mdash; 4 records)
- **ID 1:** Prop `1`, Client `4`, Agent `2` (2026-12-05 10:00) &mdash; Status: `CONFIRMED`
- **ID 2:** Prop `4`, Client `5`, Agent `3` (2026-12-07 14:30) &mdash; Status: `PENDING`
- **ID 5:** Prop `1`, Client `4`, Agent `2` (2026-11-27 14:00) &mdash; Status: `CANCELLED`
- **ID 6:** Prop `1`, Client `4`, Agent `2` (2026-11-27 14:00) &mdash; Status: `CANCELLED`

---

### 2.3 Foreign Key Constraint Inventory

All currently active foreign keys in `estatecore_db`:

```sql
CONSTRAINT `FK_appointments_agentId` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`) ON DELETE CASCADE
CONSTRAINT `FK_appointments_clientId` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`) ON DELETE CASCADE
CONSTRAINT `FK_appointments_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE CASCADE
CONSTRAINT `FK_inquiries_assignedAgentId` FOREIGN KEY (`assignedAgentId`) REFERENCES `users` (`id`) ON DELETE SET NULL
CONSTRAINT `FK_inquiries_clientId` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`) ON DELETE CASCADE
CONSTRAINT `FK_inquiries_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE CASCADE
CONSTRAINT `FK_properties_agentId` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`) ON DELETE SET NULL
```

> [!WARNING]
> **Relational Inconsistency with PDF:**  
> Notice that `FK_properties_agentId` and `FK_appointments_agentId` reference **`users.id`**, not **`Agent.AgentID`**.  
> The PDF requires a true `Agent` entity with a 1:1 link to `User`, and properties referencing `Agent.AgentID`.

---

## 3. Existing Software Architecture & Technology Stack

```
Frontend (Port 5173)         Backend REST API (Port 3000)          Database (Port 3307)
+-----------------------+    +--------------------------+    +-------------------------+
| React 18 + Vite 6     |    | NestJS 10.3              |    | Docker MySQL 8.4        |
| TypeScript + Tailwind |===>| TypeORM + Passport JWT   |===>| estatecore_db           |
| AdaptiveCatalogLayout |    | ValidationPipe (Strict)  |    | 5 tables, 7 FKs         |
| Public & Dash Layouts |    | Prefix: /api             |    | InnoDB, utf8mb4         |
+-----------------------+    +--------------------------+    +-------------------------+
```

### 3.1 Backend Modules
- **`AppModule`:** Configures database connection, environment loading, and core feature modules.
- **`AuthModule`:** Issues JWTs via Passport JWT strategy; bcrypt password hashing.
- **`UsersModule`:** User CRUD, role querying, profile management.
- **`PropertiesModule`:** Property CRUD, filtering by location, price, type, status.
- **`InquiriesModule`:** Client inquiry submission, status updates, agent assignment.
- **`AppointmentsModule`:** Tour booking, schedule conflict checks, cancellation.

### 3.2 Frontend Layout & Routing
- **Institutional Public Pages:** `/`, `/about`, `/contact` (Wrapped in `PublicLayout`).
- **Adaptive Property Catalog:** `/properties`, `/properties/:id` (Wrapped in `AdaptiveCatalogLayout` &mdash; renders `DashboardLayout` for authenticated users and `PublicLayout` for guests).
- **Protected Dashboards:** `/admin`, `/agent`, `/client`, `/inquiries`, `/appointments`, `/users`, `/profile` (Protected by `ProtectedRoute` and `DashboardLayout`).

---

## 4. Existing Test Results & Quality Metrics

1. **Backend Compilation (`nest build`):** **PASSED** (0 TypeScript errors).
2. **Frontend Production Build (`tsc && vite build`):** **PASSED** (1,613 modules transformed, 0 errors).
3. **Frontend E2E Regression Suite (`test_playwright.js`):** **21 / 21 PASSED** (0 console errors).
4. **Frontend Adaptive Routing Suite (`test_frontend_acceptance.js`):** **10 / 10 PASSED** (100% across all 4 personas).
5. **Backend PDF Compliance Probe (`test_pdf_compliance_backend.js`):**
   - Base path `/api/v1`: **FAILED (All 19 endpoints return 404)**.
   - Alternate path `/api`: 7 passed, 9 missing, 3 method/path conflicts.
   - JWT Expiration: **FAILED (Issues 24h tokens vs PDF requirement of 1h)**.
   - 401 vs 403 Separation: **PASSED**.
   - SQL Injection Defense: **PASSED**.
   - Input Whitelisting: **PASSED**.
   - Rate Limiting & Account Lockout: **MISSING**.

---

## 5. Identified Implementation Risks & Mitigation Strategies

| # | Risk Description | Severity | Mitigation Strategy |
|---|---|:---:|---|
| **R1** | **Orphaned Foreign Keys during Agent Migration:** Rewiring `properties.agentId` to `Agent.AgentID` before `Agent` records exist will cause constraint violations. | **HIGH** | Staged additive migration: 1) Create `Agent` table; 2) Insert `Agent` records matching existing users 2 & 3; 3) Build verified old-to-new ID map; 4) Update foreign keys only after 0 orphans are asserted. |
| **R2** | **Arbitrary Property Ownership Assignment:** Assigning all existing properties to Admin or inventing fake deed holders violates legal reality. | **HIGH** | `Property.OwnerID` must remain `INT NULL` in staging. Existing properties are flagged as unassigned until verified title holders are identified. |
| **R3** | **Breaking Frontend API Integration:** Changing the global prefix to `/api/v1` without dual-routing will immediately break the frontend single-page app. | **MEDIUM** | Implement backward-compatible dual-routing: mount endpoints under `/api/v1` while preserving `/api` aliases, or update frontend `VITE_API_BASE_URL` simultaneously. |
| **R4** | **HTTP PUT vs PATCH Semantic Conflicts:** Frontend currently uses `PATCH`; PDF specifies `PUT`. | **LOW** | Support both HTTP `PUT` and `PATCH` decorators on controller update actions to guarantee 100% contract compliance without breaking callers. |
| **R5** | **Session Dropping from 1-Hour JWT Expiry:** Shortening JWT expiration from 24h to 1h may disrupt users without silent refresh. | **MEDIUM** | Configure JWT expiration to 3600s as strictly required by Lab 06, and ensure frontend gracefully handles expired sessions with redirect to `/login`. |
| **R6** | **Email Delivery Failure during Business Transactions:** A failed SMTP connection could crash appointment or inquiry creation. | **MEDIUM** | Asynchronous / non-blocking email dispatch wrapped in `try/catch`. Delivery failure is logged without rolling back the valid database record. |

---

## 6. Proposed Implementation Sequence

To satisfy all requirements safely, execution must proceed through the following phased sequence:

```
[Phase 1: API Contract Alignment]
  ├── Dual-mount routes: support /api/v1 as primary and /api for backward compatibility
  ├── Implement HTTP PUT handlers alongside PATCH
  └── Align DTOs and response envelopes

[Phase 2: Database Schema & Entity Alignment (Isolated Sandbox First)]
  ├── Prepare TypeORM migration for Agent, PropertyPhoto, and PropertyTransaction
  ├── Prepare User name splitting (FirstName, LastName) and PhoneNumber addition
  ├── Test migration against sandbox database (estatecore_test_restore)
  └── Present sandbox verification report for explicit human approval before live execution

[Phase 3: Role-Based Access Control]
  ├── Expand role model: Differentiate Seller/PropertyManager permissions
  ├── Implement ownership verification on property creation and updates
  └── Verify 401 vs 403 enforcement across all endpoints

[Phase 4: Authentication & Security Hardening]
  ├── Update JWT expiration default to 3600s (1 hour)
  ├── Install and register @nestjs/throttler for brute-force rate limiting
  └── Implement account lockout service tracking consecutive failed logins

[Phase 5: Email Notification System (Email Only — Zero SMS)]
  ├── Implement Configurable MailerModule using environment SMTP settings
  ├── Create HTML/Text email templates for inquiry, viewing, and registration
  └── Integrate non-blocking notification dispatch into service workflows

[Phase 6: Frontend Integration]
  ├── Integrate agent directory view
  ├── Add photo gallery and upload interface
  └── Update inquiry and viewing feedback states

[Phase 7: Full Acceptance Suite & Verification]
  ├── Run automated API contract tests for all 19 endpoints
  ├── Run Playwright E2E and visual regression suite
  └── Update compliance matrix and deliver final audit report
```

---

## 7. Phase 0 Safety Confirmation

- **No live database modifications were performed during Phase 0.**
- **No migrations were executed.**
- **All 9 user records, 7 property listings, 6 inquiries, and 4 appointments remain unaltered.**
- **Live database is ready for isolated sandbox preparation.**
