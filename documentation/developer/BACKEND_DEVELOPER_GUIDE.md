# EstateCore Developer Guide: Backend Developer Guide

**Project:** EstateCore — Real Estate Management System  
**Framework:** NestJS 10.4 + TypeORM 0.3.x + TypeScript 5.x  
**Runtime:** Node.js v18.x, v20.x, or v22.x LTS  
**Academic References:** `estatecire.pdf` (Labs 04, 05, 06) & `09_Final_Project_Student_Copy.pdf`  

---

## 1. Modular Architecture Overview

The backend is built around a domain-driven modular structure located in `backend/src/`:

```
backend/src/
 ├── agents/             # Agent profiles, brokerage metadata, directory
 ├── appointments/       # Viewing tour scheduling and calendar management
 ├── auth/               # JWT authentication, session issuance, token blacklist
 ├── common/             # Global filters, guards, decorators, enums
 ├── config/             # TypeORM and environment configuration
 ├── inquiries/          # Client prospect inquiries and price offers
 ├── properties/         # Property catalog, listings CRUD, photo attachments
 ├── transactions/       # Atomic deal settlements and financial audit trails
 ├── users/              # User account governance and role administration
 ├── app.module.ts       # Root NestJS application module
 └── main.ts             # Application entry point, global pipes, routing alias
```

---

## 2. In-Depth Module Specifications

### Module 1: `AuthModule`
1. **What it does:** Authenticates users, validates passwords via `bcrypt`, issues signed 1-hour JWT tokens containing the `agentId` claim, and provides server-side token revocation on logout.
2. **Why it exists:** Core security boundary fulfilling Lab 06 (p. 20–23) and Final Project requirements.
3. **Files:**
   - Controller: `backend/src/auth/auth.controller.ts`
   - Services: `backend/src/auth/auth.service.ts`, `backend/src/auth/token-blacklist.service.ts`
   - Strategy: `backend/src/auth/strategies/jwt.strategy.ts`
4. **Database Tables:** Reads from `users` and `agents` (to resolve `agentId`).
5. **Dependencies:** `UsersModule`, `JwtModule`, `PassportModule`, `TypeOrmModule.forFeature([Agent])`.
6. **Endpoints:**
   - `POST /api/v1/auth/register` (Public)
   - `POST /api/v1/auth/login` (Public, Rate-limited)
   - `POST /api/v1/auth/logout` (Authenticated, Revokes JWT)
   - `GET /api/v1/auth/me` (Authenticated)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 1, tests EP-01 to EP-06).

---

### Module 2: `UsersModule`
1. **What it does:** Manages user accounts, profile details, passwords, role assignments, and administrative soft deletion (`isActive = false`).
2. **Why it exists:** Provides identity management for all personas (`ADMIN`, `AGENT`, `CLIENT`).
3. **Files:**
   - Controller: `backend/src/users/users.controller.ts`
   - Service: `backend/src/users/users.service.ts`
   - Entity: `backend/src/users/entities/user.entity.ts`
   - DTOs: `create-user.dto.ts`, `update-user.dto.ts`
4. **Database Tables:** `users`.
5. **Dependencies:** `TypeOrmModule.forFeature([User])`.
6. **Endpoints:**
   - `POST /api/v1/users` (Public registration / Admin provision)
   - `GET /api/v1/users` (`ADMIN` only)
   - `GET /api/v1/users/:id` (Admin or Self)
   - `PUT /api/v1/users/:id` (Admin or Self)
   - `PATCH /api/v1/users/:id` (Admin or Self)
   - `DELETE /api/v1/users/:id` (`ADMIN` only)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 2, tests EP-07 to EP-12).

---

### Module 3: `AgentsModule`
1. **What it does:** Manages professional agent profiles, license numbers, brokerage affiliations, bios, and public directory listings.
2. **Why it exists:** Disambiguates licensed broker metadata from general user accounts, satisfying Lab 04 (p. 2) and Lab 05 (p. 3–4).
3. **Files:**
   - Controller: `backend/src/agents/agents.controller.ts`
   - Service: `backend/src/agents/agents.service.ts`
   - Entity: `backend/src/agents/entities/agent.entity.ts`
   - DTO: `agent.dto.ts`
4. **Database Tables:** `agents`, joins with `users`.
5. **Dependencies:** `TypeOrmModule.forFeature([Agent, User])`.
6. **Endpoints:**
   - `GET /api/v1/agents` (Public directory)
   - `GET /api/v1/agents/:id` (Public detail)
   - `POST /api/v1/agents` (Admin or Agent)
   - `PUT /api/v1/agents/:id` (Admin or Agent Self)
   - `PATCH /api/v1/agents/:id` (Admin or Agent Self)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 3, tests EP-13 to EP-17).

---

### Module 4: `PropertiesModule`
1. **What it does:** Complete real estate listings lifecycle: searching, filtering, publishing, updating, soft/hard deleting with relational checks, and attaching photo media.
2. **Why it exists:** Core business domain of the application (Lab 05 Cards 04–14).
3. **Files:**
   - Controller: `backend/src/properties/properties.controller.ts`
   - Service: `backend/src/properties/properties.service.ts`
   - Entities: `property.entity.ts`, `property-photo.entity.ts`
   - DTOs: `create-property.dto.ts`, `update-property.dto.ts`, `property-filter.dto.ts`
4. **Database Tables:** `properties`, `property_photos`, `agents`, `inquiries`, `property_transactions`.
5. **Dependencies:** `TypeOrmModule.forFeature([Property, PropertyPhoto, Inquiry, Agent, PropertyTransaction])`.
6. **Endpoints:**
   - `GET /api/v1/properties` (Public query catalog)
   - `GET /api/v1/properties/:id` (Public detail)
   - `POST /api/v1/properties` (Admin, Agent, Client Owner)
   - `PUT /api/v1/properties/:id` (Admin, Assigned Agent, Legal Owner)
   - `PATCH /api/v1/properties/:id` (Admin, Assigned Agent, Legal Owner)
   - `DELETE /api/v1/properties/:id` (Admin, Assigned Agent, Legal Owner — relational check)
   - `GET /api/v1/properties/:id/photos` (Public)
   - `POST /api/v1/properties/:id/photos` (Admin, Assigned Agent)
   - `POST /api/v1/properties/:id/inquiries` (Nested Client price offer)
   - `GET /api/v1/properties/:id/inquiries` (Assigned Agent, Admin)
   - `PATCH /api/v1/properties/:id/inquiries/:inquiryId` (Assigned Agent, Admin)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 4, tests EP-18 to EP-28).

---

### Module 5: `InquiriesModule`
1. **What it does:** Standalone inquiries pipeline supporting formal price offers, status progression (`PENDING` -> `CONTACTED` -> `QUALIFIED` -> `CLOSED`), and prospect correspondence.
2. **Why it exists:** Manages buyer-broker communication channel (Lab 05 Cards 15–17).
3. **Files:**
   - Controller: `backend/src/inquiries/inquiries.controller.ts`
   - Service: `backend/src/inquiries/inquiries.service.ts`
   - Entity: `backend/src/inquiries/entities/inquiry.entity.ts`
   - DTO: `create-inquiry.dto.ts`
4. **Database Tables:** `inquiries`, joins with `properties` and `users`.
5. **Dependencies:** `TypeOrmModule.forFeature([Inquiry, Property, User])`.
6. **Endpoints:**
   - `POST /api/v1/inquiries` (`CLIENT` role)
   - `GET /api/v1/inquiries` (Role-scoped catalog)
   - `GET /api/v1/inquiries/:id` (Client author, assigned agent, admin)
   - `PATCH /api/v1/inquiries/:id` (Assigned agent or admin)
   - `DELETE /api/v1/inquiries/:id` (Author or admin)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 5, tests EP-29 to EP-33).

---

### Module 6: `AppointmentsModule`
1. **What it does:** Booking, rescheduling, and status management for in-person property viewing tours.
2. **Why it exists:** Scheduling coordination between clients and assigned real estate advisors.
3. **Files:**
   - Controller: `backend/src/appointments/appointments.controller.ts`
   - Service: `backend/src/appointments/appointments.service.ts`
   - Entity: `backend/src/appointments/entities/appointment.entity.ts`
   - DTO: `create-appointment.dto.ts`
4. **Database Tables:** `appointments`, joins with `properties` and `users`.
5. **Dependencies:** `TypeOrmModule.forFeature([Appointment, Property, User])`.
6. **Endpoints:**
   - `POST /api/v1/appointments` (`CLIENT` role)
   - `GET /api/v1/appointments` (Role-scoped schedule)
   - `GET /api/v1/appointments/:id` (Client, Agent, Admin)
   - `PATCH /api/v1/appointments/:id` (Client, Agent, Admin)
   - `DELETE /api/v1/appointments/:id` (Client, Agent, Admin)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 6, tests EP-34 to EP-38).

---

### Module 7: `TransactionsModule`
1. **What it does:** Finalizes acquisitions, settles property sales with pessimistic write locking, transitions property status atomically to `SOLD`, and maintains immutable financial audit trails.
2. **Why it exists:** Fulfills Lab 05 Cards 18–19, Lab 04 Entity 6, and concurrency protection criteria.
3. **Files:**
   - Controller: `backend/src/transactions/transactions.controller.ts`
   - Service: `backend/src/transactions/transactions.service.ts`
   - Entity: `backend/src/transactions/entities/transaction.entity.ts`
   - DTO: `create-transaction.dto.ts`
4. **Database Tables:** `property_transactions`, `properties`, `users`, `agents`.
5. **Dependencies:** `TypeOrmModule.forFeature([PropertyTransaction, Property, User, Agent])`, `DataSource`.
6. **Endpoints:**
   - `POST /api/v1/transactions` (Admin or Assigned Agent — pessimistic lock)
   - `GET /api/v1/transactions` (Role-scoped financial records)
   - `GET /api/v1/transactions/:id` (Buyer, Broker, Admin)
7. **How to test:**
   - Suite: `node scripts/test_final_project_36_endpoints.js` (Module 7, tests EP-39 to EP-41).
   - Race condition test: `node scripts/test_phase5_1_stabilization.js` (Section 5).

---

## 3. Security Implementation Patterns

### 3.1 Authentication & Session Management
- **Bcrypt:** Passwords hashed with salt factor 10 (`bcrypt.hash(password, 10)`).
- **JWT Lifespan:** 1 hour (`3600s`). Token contains `sub` (User ID), `email`, `role`, and `agentId` (for Agents).
- **Token Blacklisting:** `TokenBlacklistService` tracks revoked tokens upon `POST /api/v1/auth/logout`. `JwtAuthGuard` checks revocation before granting access.

### 3.2 Brute-Force Rate Limiting & Account Lockout (Lab 06 p. 21)
- **Implementation:** Built into `AuthService` using an in-memory `Map<string, LoginAttemptTracker>` keyed by normalized email (`emailKey = email.toLowerCase().trim()`).
- **Policy:** Exactly matches `estatecire.pdf` Lab 06 (p. 21): 5 failed attempts within a 10-minute window triggers a temporary 10-minute lockout returning `429 Too Many Requests`:
  `"Too many failed login attempts. Account temporarily locked. Please try again in X seconds."`
- **Architectural Characteristics & Limitations:**
  - *In-Memory State:* Because attempts are tracked in the Node.js application memory heap, restarting the backend service resets the counter.
  - *Single-Instance Scope:* In multi-instance clustered or load-balanced deployments, rate limiting requires a centralized shared cache (such as Redis) to coordinate lockout state across nodes. For local academic demonstration and defense evaluation, the in-memory map provides lightweight, zero-dependency protection.

### 3.3 File Upload Security
- Multi-part file upload in `PropertiesController.addPhoto`:
  - 5MB size limit (`5,242,880 bytes`).
  - MIME whitelist: `image/jpeg`, `image/png`, `image/webp`.
  - Path traversal protection: sanitizes filenames and blocks `../` traversal.

### 3.4 Error Response Standard
Global `HttpExceptionFilter` intercepts all thrown exceptions and standardizes the response:
```json
{
  "statusCode": 403,
  "timestamp": "2026-11-26T12:00:00.000Z",
  "path": "/api/v1/properties/1",
  "method": "PATCH",
  "error": "Forbidden",
  "message": "You are not authorized to modify this property listing."
}
```
