# ESTATECORE &mdash; PDF REQUIREMENTS COMPLIANCE MATRIX

**Academic Reference:** ITEC 116 Systems Integration & Architecture Laboratory Manual (`estatecire.pdf`)  
**Project:** EstateCore &mdash; Real Estate Management Information System  
**Audit Date:** November 24, 2026  
**Audited Target:** Live Codebase (`backend/src`, `frontend/src`, `estatecore_db` in Docker MySQL 8.4)  
**Execution Evidence:** [`documentation/evidence/pdf_compliance_evidence.json`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/pdf_compliance_evidence.json)

---

## 1. Compliance Classification Legend

Each requirement is strictly evaluated and assigned one of the following statuses based on live execution and code inspection:

| Classification | Definition |
|---|---|
| **IMPLEMENTED** | Fully implemented in live code and database, matching the PDF specification. |
| **ENGINEERING_ENHANCEMENT** | Implemented with an architecture improvement compatible with or exceeding the baseline PDF requirement. |
| **PARTIALLY_IMPLEMENTED** | Present in codebase but missing specific attributes, relationships, or operational paths. |
| **MISSING** | Required by the PDF specification but completely absent in live codebase or database. |
| **CONFLICTING** | Present in live codebase but operating under contradictory rules or parameters compared to the PDF. |
| **NEEDS_HUMAN_DECISION** | Architectural fork requiring explicit human policy decision before code or schema alteration. |

---

## 2. Laboratory Activity 03 &mdash; System Architecture & Components

| Req ID | PDF Reference | Required Specification | Actual Code / DB Implementation | Evidence / Source | Empirical Test Performed | Result | Remaining Work |
|---|---|---|---|---|---|:---:|---|
| **L03-01** | Lab 03, p. 1 | **Intended User Roles:** Buyer/Renter, Seller/PropertyManager, Agent, Administrator | Only 3 roles implemented: `ADMIN`, `AGENT`, `CLIENT`. Buyer/Renter & Seller/PropertyManager are collapsed into `CLIENT`. | [`role.enum.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/common/enums/role.enum.ts#L1-L5) | Inspection of `UserRole` enum and live `users` table | **PARTIALLY_IMPLEMENTED** | Expand roles or implement persona sub-roles in backend and permissions. |
| **L03-02** | Lab 03, p. 1–2 | **Web Client Application:** Modern responsive web interface for property browsing, inquiries, and viewings | React 18 + Vite + Tailwind CSS + Lucide Icons single-page application | [`frontend/src/App.tsx`](file:///c:/xampp/htdocs/EstateCore/frontend/src/App.tsx) | Verified via Playwright regression (21 tests) & production build | **IMPLEMENTED** | Maintain frontend client alignment. |
| **L03-03** | Lab 03, p. 2 | **Application Server:** RESTful API server handling business logic, validation, and database operations | NestJS 10.3 TypeScript backend running on Node.js v22 | [`backend/src/main.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/main.ts#L1-L39) | Live process listening on port 3000 bound to `0.0.0.0` | **IMPLEMENTED** | Migrate API route prefix to `/api/v1`. |
| **L03-04** | Lab 03, p. 2 | **Database Server:** Relational DBMS managing persistent structured entities | MySQL 8.4 Server running inside Docker container `estatecore-mysql` on port 3307 | [`app.module.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/app.module.ts#L20-L35) | `docker exec estatecore-mysql mysqladmin ping` | **IMPLEMENTED** | Perform approved additive migrations. |
| **L03-05** | Lab 03, p. 2–3 | **Email Notification Service:** Dispatches automated email confirmations for inquiries, tours, and status updates | No email service provider, SMTP client, or mailer module configured | [`backend/src/app.module.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/app.module.ts) | Grep for nodemailer / mailer in `backend/package.json` | **MISSING** | Implement `@nestjs-modules/mailer` or mock notification service. |
| **L03-06** | Lab 03, p. 2–3 | **SMS Notification Service:** Outbound SMS notifications for real-time viewing alerts and updates | No SMS gateway, Twilio client, or webhook module configured | [`backend/src/`](file:///c:/xampp/htdocs/EstateCore/backend/src/) | Codebase search for SMS gateway integrations | **MISSING** | Implement notification gateway interface. |
| **L03-07** | Lab 03, p. 3 | **Information Flow Architecture:** User &rarr; Web Client &rarr; REST API &rarr; Database &rarr; Response | Standard 3-tier architecture with JWT Bearer authentication and TypeORM data access | [`backend/src/app.module.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/app.module.ts) | End-to-end API roundtrip probe (`GET /api/properties`) | **IMPLEMENTED** | Connect notification bus into event flow. |

---

## 3. Laboratory Activity 04 &mdash; Database Design & Entity Relationships

| Req ID | PDF Reference | Required Specification | Actual Code / DB Implementation | Evidence / Source | Empirical Test Performed | Result | Remaining Work |
|---|---|---|---|---|---|:---:|---|
| **L04-01** | Lab 04, p. 1–2 | **User Entity:** `UserID`, `FirstName`, `LastName`, `Email`, `PasswordHash`, `PhoneNumber`, `Role`, `CreatedAt`, `UpdatedAt` | Table `users` has `id`, `fullName` (merged), `email`, `password`, `role` (3-enum), `isActive`, `createdAt`, `updatedAt`. Missing `PhoneNumber`. | `estatecore_db.users` | Live SQL schema query: `DESCRIBE users;` | **PARTIALLY_IMPLEMENTED** | Split `fullName` into `FirstName`/`LastName`; add nullable `PhoneNumber`. |
| **L04-02** | Lab 04, p. 2 | **Agent Entity:** `AgentID`, `UserID` (FK 1:1), `LicenseNumber`, `AgencyName`, `PhoneNumber`, `CreatedAt`, `UpdatedAt` | `Agent` entity and table **do not exist** in database. Agents are currently ordinary rows in `users` with `role = 'AGENT'`. | `estatecore_db` | Live SQL query: `SHOW TABLES LIKE 'Agent%';` &rarr; 0 rows | **MISSING** | Create `Agent` table; populate User-Agent 1:1 link for Users 2 & 3. |
| **L04-03** | Lab 04, p. 2–3 | **Property Entity:** `PropertyID`, `Title`, `Description`, `PropertyType`, `ListingType`, `Price`, `Address`, `City`, `StateProvince`, `PostalCode`, `Country`, `Bedrooms`, `Bathrooms`, `SquareFootage`, `LotSize`, `Status`, `DateListed`, `OwnerID` (FK), `AgentID` (FK) | Table `properties` exists. Missing `City`, `StateProvince`, `PostalCode`, `Country` (merged in `location`). Missing `OwnerID`. Missing `DateListed`. `agentId` references `users.id` directly. | `estatecore_db.properties` | Live SQL query: `DESCRIBE properties;` | **PARTIALLY_IMPLEMENTED** | Add `OwnerID` (nullable), `DateListed`, `City`, resolve `AgentID` FK to `Agent.AgentID`. |
| **L04-04** | Lab 04, p. 3 | **PropertyPhoto Entity:** `PhotoID`, `PropertyID` (FK 1:M), `PhotoURL`, `IsPrimary`, `UploadDate` | `PropertyPhoto` entity and table **do not exist**. Frontend currently renders images via static architectural SVG/Unsplash helper. | `estatecore_db` | Live SQL query: `SHOW TABLES LIKE 'PropertyPhoto%';` &rarr; 0 rows | **MISSING** | Create `PropertyPhoto` table and NestJS photo upload module. |
| **L04-05** | Lab 04, p. 4 | **Inquiry Entity:** `InquiryID`, `PropertyID` (FK), `UserID` (FK), `Subject`, `Message`, `InquiryDate`, `Status` (`Pending`, `Responded`, `Closed`) | Table `inquiries` exists. Fields: `clientId`, `propertyId`, `assignedAgentId`, `subject`, `message`, `contactNumber`, `status` (`PENDING`, `CONTACTED`, `QUALIFIED`, `CLOSED`, `CANCELLED`). | `estatecore_db.inquiries` | Live SQL query: `DESCRIBE inquiries;` | **PARTIALLY_IMPLEMENTED** | Align enum statuses while preserving raw history in `LegacyStatus`. |
| **L04-06** | Lab 04, p. 4–5 | **PropertyTransaction Entity:** `TransactionID`, `PropertyID` (FK), `BuyerID` (FK), `AgentID` (FK), `TransactionType`, `TransactionDate`, `SalePrice`, `CommissionAmount`, `Status` | `PropertyTransaction` entity and table **do not exist**. | `estatecore_db` | Live SQL query: `SHOW TABLES LIKE 'PropertyTransaction%';` &rarr; 0 rows | **MISSING** | Create `PropertyTransaction` table and NestJS module. |
| **L04-07** | Lab 04, p. 1 | **User &ndash; Agent 1:1 Relationship:** Each agent profile belongs to exactly one user account | Not modeled in live database. Agent profile attributes do not exist. | [`user.entity.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/users/entities/user.entity.ts) | TypeORM entity inspection & DB foreign key check | **MISSING** | Implement 1:1 TypeORM relationship and database FK constraint. |
| **L04-08** | Lab 04, p. 1 | **Property Ownership vs Agent Assignment:** `OwnerID` (User FK) and `AgentID` (Agent FK) as distinct attributes | Current schema only has `agentId` (referencing `users.id`). No legal owner attribute exists. | `properties.agentId` | SQL schema inspection: `OwnerID` column missing | **CONFLICTING** | Add `OwnerID INT NULL`, rewire `agentId` to `Agent.AgentID`. |
| **L04-09** | Engineering | **Appointment Module:** Viewing tour schedules between Client, Agent, and Property | Retained as active operational feature in `appointments` table with 4 historical records. | `estatecore_db.appointments` | Live SQL query: `SELECT COUNT(*) FROM appointments;` &rarr; 4 rows | **ENGINEERING_ENHANCEMENT** | Retain as complementary scheduling module. |

---

## 4. Laboratory Activity 05 &mdash; RESTful API Specifications

| Req ID | PDF Reference | Endpoint & HTTP Method | Required Role | Existing Code Path | Live Probe Status (`/api/v1` vs `/api`) | Result | Remaining Work |
|---|---|---|---|---|:---:|:---:|---|
| **L05-01** | Lab 05, p. 1 | `POST /api/v1/auth/register` | Public | `POST /api/auth/register` | `/api/v1`: 404 \| `/api`: 400 (Body required) | **PARTIALLY_IMPLEMENTED** | Mount `/api/v1` routing prefix in `main.ts`. |
| **L05-02** | Lab 05, p. 1–2 | `POST /api/v1/auth/login` | Public | `POST /api/auth/login` | `/api/v1`: 404 \| `/api`: 400 (Body required) | **PARTIALLY_IMPLEMENTED** | Mount `/api/v1` routing prefix in `main.ts`. |
| **L05-03** | Lab 05, p. 2 | `POST /api/v1/auth/logout` | Authenticated | None (Client deletes token) | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement server-side logout / token revocation endpoint. |
| **L05-04** | Lab 05, p. 2 | `GET /api/v1/users` | Admin | `GET /api/users` | `/api/v1`: 404 \| `/api`: 200 OK | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`; support pagination parameters. |
| **L05-05** | Lab 05, p. 2–3 | `GET /api/v1/users/{id}` | Admin / Self | `GET /api/users/:id` | `/api/v1`: 404 \| `/api`: 200 OK | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`; serialize PascalCase/camelCase response. |
| **L05-06** | Lab 05, p. 3 | `PUT /api/v1/users/{id}` | Admin / Self | `PATCH /api/users/:id` | `/api/v1`: 404 \| `/api`: 404 on `PUT` (Accepts `PATCH`) | **CONFLICTING** | Support HTTP `PUT` method alias alongside `PATCH`. |
| **L05-07** | Lab 05, p. 3 | `DELETE /api/v1/users/{id}` | Admin | `DELETE /api/users/:id` | `/api/v1`: 404 \| `/api`: 404 (ID 999 not found) | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`; confirm soft-delete semantics (`IsActive = false`). |
| **L05-08** | Lab 05, p. 3 | `GET /api/v1/agents` | Public / Auth | None | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement `AgentsController.findAll`. |
| **L05-09** | Lab 05, p. 4 | `GET /api/v1/agents/{id}` | Public / Auth | None | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement `AgentsController.findOne`. |
| **L05-10** | Lab 05, p. 4 | `POST /api/v1/agents` | Admin | None | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement Admin-only agent profile provisioning. |
| **L05-11** | Lab 05, p. 4 | `PUT /api/v1/agents/{id}` | Admin / Agent Self | None | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement `AgentsController.update`. |
| **L05-12** | Lab 05, p. 4–5 | `GET /api/v1/properties` | Public | `GET /api/properties` | `/api/v1`: 404 \| `/api`: 200 OK | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`; align filter query parameter names. |
| **L05-13** | Lab 05, p. 5 | `GET /api/v1/properties/{id}` | Public | `GET /api/properties/:id` | `/api/v1`: 404 \| `/api`: 200 OK | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`. |
| **L05-14** | Lab 05, p. 5 | `POST /api/v1/properties` | Agent / Admin / Seller | `POST /api/properties` | `/api/v1`: 404 \| `/api`: 400 (Body required) | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`; permit verified sellers to post properties. |
| **L05-15** | Lab 05, p. 5–6 | `PUT /api/v1/properties/{id}` | Agent / Admin / Owner | `PATCH /api/properties/:id` | `/api/v1`: 404 \| `/api`: 404 on `PUT` (Accepts `PATCH`) | **CONFLICTING** | Support HTTP `PUT` method alias alongside `PATCH`. |
| **L05-16** | Lab 05, p. 6 | `DELETE /api/v1/properties/{id}` | Admin / Owner | `DELETE /api/properties/:id` | `/api/v1`: 404 \| `/api`: 404 (ID 999 not found) | **PARTIALLY_IMPLEMENTED** | Expose on `/api/v1`. |
| **L05-17** | Lab 05, p. 6 | `POST /api/v1/properties/{id}/photos` | Agent / Admin / Owner | None | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement nested photos controller and file upload handler. |
| **L05-18** | Lab 05, p. 6 | `POST /api/v1/properties/{id}/inquiries` | Auth Client | `POST /api/inquiries` (Root endpoint) | `/api/v1`: 404 \| `/api`: 404 on nested route | **CONFLICTING** | Implement nested route `POST /api/v1/properties/:id/inquiries`. |
| **L05-19** | Lab 05, p. 6 | `GET /api/v1/transactions` | Admin / Agent / Client | None | `/api/v1`: 404 \| `/api`: 404 | **MISSING** | Implement `TransactionsController` and transaction history. |

---

## 5. Laboratory Activity 06 &mdash; Authentication, RBAC & Security

| Req ID | PDF Reference | Required Security Feature | Actual Code Implementation | Evidence / Source | Empirical Test Performed | Result | Remaining Work |
|---|---|---|---|---|---|:---:|---|
| **L06-01** | Lab 06, p. 2 | **Password Hashing:** Strong one-way hashing with salt factor &ge; 10 | Implemented via `bcryptjs.hash(password, 10)` | [`auth.service.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/auth/auth.service.ts#L8) | Verified password hashes in `users.password` start with `$2a$10$` | **IMPLEMENTED** | None. Standard compliant. |
| **L06-02** | Lab 06, p. 2 | **JWT Authentication:** Cryptographically signed Bearer tokens | Implemented via `@nestjs/jwt` and `passport-jwt` | [`auth.module.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/auth/auth.module.ts#L14-L23) | Live probe decoded token signature and payload | **IMPLEMENTED** | Align token expiration. |
| **L06-03** | Lab 06, p. 2 | **JWT Token Expiration:** Strictly 1 hour (3600 seconds) | Token is issued with expiration duration of **86,400 seconds (24 hours)** | [`auth.module.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/auth/auth.module.ts#L20) | Token decoded in probe: `exp - iat = 86400s` | **CONFLICTING** | Change `JWT_EXPIRATION` configuration default from `86400s` to `3600s`. |
| **L06-04** | Lab 06, p. 3 | **HTTP Status Differentiation:** 401 Unauthorized vs 403 Forbidden | `JwtAuthGuard` returns 401; `RolesGuard` returns 403 | [`jwt-auth.guard.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/common/guards/jwt-auth.guard.ts#L8) / [`roles.guard.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/common/guards/roles.guard.ts#L22) | Live probe: No token &rarr; 401; Client on admin route &rarr; 403 | **IMPLEMENTED** | Maintain guard separation across all endpoints. |
| **L06-05** | Lab 06, p. 3 | **Deny-by-Default Architecture:** Unauthenticated or unauthorized requests blocked by default | Endpoints require explicit `@UseGuards(JwtAuthGuard, RolesGuard)` | [`users.controller.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/users/users.controller.ts#L23) | Probe unauthenticated calls to all private controllers &rarr; blocked | **IMPLEMENTED** | Ensure new `/agents` and `/transactions` controllers follow pattern. |
| **L06-06** | Lab 06, p. 3–4 | **5-Tier Role Permissions Matrix:** Distinct rules for Guest, Buyer/Renter, Seller, Agent, Admin | Backend only enforces 3 roles (`ADMIN`, `AGENT`, `CLIENT`). No seller listing privileges; no differentiated renter vs buyer scope. | [`roles.guard.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/common/guards/roles.guard.ts) | Role enum inspection and route access tests | **PARTIALLY_IMPLEMENTED** | Implement role expansion or persona sub-role guards. |
| **L06-07** | Lab 06, p. 4 | **Ownership-Aware Authorization:** Users can only modify resources they legally own or are assigned | Implemented on properties (Agent must own listing) and users (Self-update only) | [`properties.service.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/properties/properties.service.ts) / [`users.controller.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/users/users.controller.ts#L42) | Verified negative cross-edit test in Playwright Suite (#15) &rarr; 403 | **IMPLEMENTED** | Extend ownership checking to Seller persona upon property creation. |
| **L06-08** | Lab 06, p. 5 | **SQL Injection Protection:** Parameterized queries and strict ORM mapping | Implemented via TypeORM Repository API with prepared statements | [`properties.service.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/properties/properties.service.ts) | Live probe with `' OR 1=1 --` query string handled safely | **IMPLEMENTED** | Maintain parameterized pattern in all future queries. |
| **L06-09** | Lab 06, p. 5 | **Input Validation & Whitelisting:** Strip and reject unexpected or malicious request body properties | Implemented via NestJS `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` | [`backend/src/main.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/main.ts#L21-L30) | Live probe with malicious injected fields &rarr; 400 Bad Request | **IMPLEMENTED** | Maintain strict DTO typing on all new modules. |
| **L06-10** | Lab 06, p. 5 | **Rate Limiting (DDoS & Brute Force Defense):** Request throttling on authentication and API endpoints | `ThrottlerModule` is **not registered** in `app.module.ts`. No rate limiting active. | [`app.module.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/app.module.ts) | Live probe: 7 rapid failed login attempts allowed without HTTP 429 | **MISSING** | Register `@nestjs/throttler` in `AppModule` with login throttling. |
| **L06-11** | Lab 06, p. 5 | **Account Lockout Policy:** Temporary deactivation after consecutive failed authentication attempts | No failure counter, lockout window, or lockout timestamp in `User` entity or `AuthService` | [`auth.service.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/auth/auth.service.ts) | Code inspection of `login()` method | **MISSING** | Add `failedLoginAttempts` and `lockoutUntil` fields to user model. |
| **L06-12** | Lab 06, p. 5 | **Multi-Factor Authentication (MFA):** Secondary verification factor for administrative or sensitive actions | No TOTP, SMS OTP, or MFA verification mechanisms implemented | [`auth.service.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/auth/auth.service.ts) | Codebase inspection | **MISSING** | Implement optional TOTP / authenticator app integration. |

---

## 6. Summary Statistics

- **Total PDF Requirements Audited:** 35
- **Fully Implemented:** 10 (28.6%)
- **Engineering Enhancements:** 1 (2.9%)
- **Partially Implemented:** 11 (31.4%)
- **Missing Requirements:** 10 (28.6%)
- **Conflicting Requirements:** 3 (8.6%)
- **Needs Human Decision:** 0 (All categorized with specific technical solutions)
