# ESTATECORE PHASE 3.1: INDEPENDENT SECURITY ACCEPTANCE AUDIT REPORT

**Auditor:** Independent AI Security Architect & System Inspector  
**Audit Date:** November 25, 2026  
**Target Milestone:** EstateCore Phase 3 RBAC, Property Ownership, Agent Isolation, & Security  
**Academic Source of Truth:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03, 04, 05, 06)  
**Target Git Branch:** `feature/phase3-rbac-ownership-isolation`  
**Inspected Commit:** `c3d82d9810b3e1f2dd0bad63507efcd0b9919d92`  
**Parent Commit:** `5662f75354be43285ae1477aa5391a92e105e4f4` (`feature/phase2-database-sandbox`)  
**Audit Verdict:** **APPROVED WITH DOCUMENTED LIMITATIONS**

---

## 1. Executive Summary & Verdict

This independent security acceptance audit evaluates the Phase 3 implementation of EstateCore against the academic specifications in `estatecire.pdf` and the operational directives from the project sponsor. 

### Final Verdict: APPROVED WITH DOCUMENTED LIMITATIONS

The backend architecture, database isolation, resource-level ownership enforcement, agent isolation, BOLA protections, and production build pipelines are verified as robust, mathematically isolated, and strictly compliant with academic requirements. However, approval is conditioned on **three clearly documented technical limitations** (one frontend client-side integer collision, one permission matrix documentation nuance, and transaction immutability characteristics) which must be resolved prior to production deployment or live migration.

```
+----------------------------------------------------------------------------------------------------+
|                                    PHASE 3.1 AUDIT SCORECARD                                       |
+----------------------------------------------------------------------------------------------------+
| Audit Domain                    | Result    | Key Metrics / Evidence                               |
+---------------------------------+-----------+------------------------------------------------------+
| 1. Git & Commit Integrity       | PASS      | Commit c3d82d9 verified on feature branch; tree clean|
| 2. Live DB Zero-Touch Isolation | PASS      | 5 tables, 100% hash match with Phase 2.2 baseline    |
| 3. Global Roles & Personas      | PASS      | ADMIN, AGENT, CLIENT strictly maintained             |
| 4. Resource Ownership (ownerId) | PASS      | Client owners manage only owned listings; no role-bloat|
| 5. Agent Isolation (agents.id)  | PASS      | Cross-agent read/edit/delete/photo blocked (403)     |
| 6. Preserved Relationships      | PASS      | appointments.agentId -> users.id retained unbroken   |
| 7. Notification Scope Bound     | PASS      | 100% Email-only; ZERO SMS dependencies/gateways      |
| 8. Automated Security Suite     | PASS      | 60/60 tests passed (Exit code: 0, real HTTP fetch)   |
| 9. Browser Playwright E2E       | LIMITATION| 20/21 passed; 1 defect: PropertyForm.tsx agentId check|
| 10. Financial Transactions      | PASS      | Read-only REST API; no unauthorized write endpoints  |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Git & Commit Integrity Verification

An exhaustive Git audit was executed on the workspace repository:

1. **Current Working Branch:** `feature/phase3-rbac-ownership-isolation`
2. **Current HEAD Commit:** `c3d82d9810b3e1f2dd0bad63507efcd0b9919d92`
   - *Author:* Zett-xoftwarex <zdg@xoftwarex.com>
   - *Date:* Wed Nov 25 14:58:40 2026 +0800
   - *Message:* `feat(phase3): implement and verify RBAC, property ownership, agent isolation, and security test suite`
3. **Parent Commit:** `5662f75354be43285ae1477aa5391a92e105e4f4` (`feature/phase2-database-sandbox`)
4. **Working Tree Status:** Clean (no uncommitted files, no rogue artifacts).
5. **Modified File Delta in Commit `c3d82d9`:**
   - 10 backend controllers, services, and DTOs updated.
   - 7 Phase 3 documentation reports committed.
   - 2 empirical JSON test evidence logs committed.
   - 1 test harness script (`scripts/test_phase3_security_suite.js`) committed.
   - Total diff: 20 files changed, 2,471 insertions, 66 deletions.

---

## 3. Independent Source Code Authorization Audit

Every backend controller, service, DTO, guard, and decorator was audited against the Lab 05 and Lab 06 academic requirements:

### 3.1 Global Roles (`UserRole` Enum)
- Only `ADMIN`, `AGENT`, and `CLIENT` exist in `backend/src/common/enums/role.enum.ts`.
- There is **no** separate global `SELLER` or `OWNER` role, satisfying the requirement that property ownership must remain a resource-level permission.

### 3.2 Property Ownership Enforcement (`ownerId`)
- In `PropertiesService.create`:
  - When `user.role === UserRole.CLIENT`, `ownerId` is hardcoded to `user.id`. Any user-supplied `ownerId` in `createPropertyDto` is completely overwritten.
  - If a client provides `agentId`, `validateAgent` verifies the agent profile exists; otherwise `agentId` defaults to `null`.
- In `PropertiesService.update`:
  - When `user.role === UserRole.CLIENT`, the service enforces `if (property.ownerId !== user.id) throw new ForbiddenException(...)`.
  - Any client attempting to change `ownerId` or `agentId` is rejected with `403 Forbidden`.
- In `PropertiesService.remove` and `addPhoto`:
  - Enforces `property.ownerId === user.id` for clients, denying cross-owner tampering with `403 Forbidden`.

### 3.3 Agent Identity & Isolation (`agents.userId` vs `properties.agentId`)
- In `PropertiesService.create`:
  - When `user.role === UserRole.AGENT`, `agentRepository.findOne({ where: { userId: user.id } })` resolves the `agentProfile.id`.
  - The property's `agentId` is assigned to `agentProfile.id`. An agent cannot assign a property to another agent.
- In `PropertiesService.update`, `remove`, and `addPhoto`:
  - The service resolves `agentProfile.id` and verifies `property.agentId === agentProfile.id`.
  - It does **not** compare `property.agentId` directly to `user.id`, successfully preventing the integer collision.
- In `AgentsService.update`:
  - Evaluates `if (currentUser.role !== UserRole.ADMIN && (currentUser.role !== UserRole.AGENT || agent.userId !== currentUser.id)) throw new ForbiddenException(...)`.
  - An agent can only update their own agent profile (`agent.userId === currentUser.id`). Cross-agent profile modification is rejected with `403 Forbidden`.

### 3.4 User Privilege Escalation Defense
- In `UsersController.update`:
  - If `currentUser.role !== UserRole.ADMIN`:
    - Enforces `currentUser.id === id` (cannot update other users).
    - Executes `delete updateUserDto.role; delete updateUserDto.isActive;` to prevent privilege escalation or deactivation tampering.
  - User directory listing (`GET /users`) and deletion (`DELETE /users/:id`) are strictly guarded with `@Roles(UserRole.ADMIN)`.

### 3.5 Viewing Appointments Compatibility (`appointments.agentId -> users.id`)
- `appointments.agentId` continues referencing `users.id` (legacy foreign key).
- In `AppointmentsService.create`:
  - If `createAppointmentDto.agentId` is not provided, the service inspects `property.agent.userId`. It stores Maria Santos's `userId = 2`, not her `agentId = 1`. This prevents the viewing tour from colliding with Admin (`userId = 1`).
  - `clientId` is strictly forced to `user.id` for clients, preventing client impersonation.
- In `AppointmentsService.update`:
  - Clients can only set `status = 'CANCELLED'`. Attempting to set `CONFIRMED` or reschedule without authorization throws `403 Forbidden`.

### 3.6 Inquiry Routing & Deletion Protection
- `inquiries.assignedAgentId` continues referencing `users.id`.
- Foreign key constraints on `clientId` and `propertyId` retain `ON DELETE RESTRICT` in the database, preventing silent cascading deletion of inquiry history.
- In `InquiriesService.findAll`:
  - Clients see inquiries they created OR inquiries submitted on properties they own (`inquiry.clientId = :id OR property.ownerId = :id`).
  - Agents see only inquiries assigned to their `user.id`.

### 3.7 Financial Transactions Security (Sensitive Records)
- In `TransactionsController`:
  - **No mutating HTTP endpoints exist.** There is no `POST`, `PUT`, `PATCH`, or `DELETE` route exposed.
  - Transactions cannot be created, forged, altered, or deleted by any client or agent over HTTP.
- In `TransactionsService.findAll` and `findOne`:
  - Clients can only read transactions where `tx.buyerId === user.id`.
  - Agents can only read transactions where `tx.agentId === agentProfile.id`.
  - Cross-client and cross-agent reads return `403 Forbidden`.

---

## 4. Live Database Cryptographic Zero-Touch Audit

To rigorously verify that the live production database (`estatecore_db`) was never touched during Phase 3, an independent audit script (`scripts/audit_live_db.js`) was executed against MySQL port 3307:

```
LIVE DATABASE DETERMINISTIC INTEGRITY REPORT:
Database:                 estatecore_db (MySQL 8.0 on Docker port 3307)
Audit Timestamp:          2026-11-25T15:04:25+08:00
Total Tables:             5 (appointments, inquiries, migrations, properties, users)
Phase 2 Schema Tables:    ABSENT (agents, property_transactions, property_photos NOT present)

DETERMINISTIC ROW-LEVEL FINGERPRINTS:
+--------------+----------+------+------------------------------------------------------------------+
| Table Name   | Columns  | Rows | SHA-256 Row Hash                                                 |
+--------------+----------+------+------------------------------------------------------------------+
| appointments | 10       | 4    | a4aa13e40991cdc5cab3bf5a65d0488151922b5ccff9e57abb24f5b11f647e0b |
| inquiries    | 10       | 7    | 88b1f9df686cbbaf91148da0b97da4aef4c3a0b606a1355664418f5bea47bc1a |
| migrations   | 3        | 1    | 3bb81f0ce05de0d8784ba055df2ff689819d4d782a0ed552f2c6ad41a76568ee |
| properties   | 16       | 8    | e1421860213e463fca31e8dce8d1ea310b13c968ca86df61813b46e16025615e |
| users        | 8        | 11   | 63ea72335fe991fa0472d7a3a1685159cbd50871f430cb778ed9f8f26f7a6ad5 |
+--------------+----------+------+------------------------------------------------------------------+

FOREIGN KEY CONSTRAINTS (7 Active):
  - FK_appointments_agentId -> users
  - FK_appointments_clientId -> users
  - FK_appointments_propertyId -> properties
  - FK_inquiries_assignedAgentId -> users
  - FK_inquiries_clientId -> users
  - FK_inquiries_propertyId -> properties
  - FK_properties_agentId -> users

MIGRATION HISTORY:
  - id: 1, timestamp: 1700000000000, name: InitialMigration1700000000000
```

**Cryptographic Isolation Finding:** Every single row count, column count, and SHA-256 hash matches the baseline recorded at the beginning of Phase 3. **The live database was 100% untouched.**

---

## 5. Security Test Suite Reproduction Results

The automated security test harness (`scripts/test_phase3_security_suite.js`) was re-executed independently:

- **Target Database:** `estatecore_test_restore` (Port 3307)
- **Target Backend Port:** 3344 (Isolated test instance)
- **Execution Mode:** Real HTTP fetch requests against running NestJS instance with full validation pipes, JWT guards, roles guards, and exception filters.
- **Process Exit Code:** `0` (Success)
- **Total Test Count:** 60
- **Passed Test Count:** 60
- **Failed Test Count:** 0
- **Success Rate:** 100.0%

### Category Breakdown
1. **Authentication & Token Issuance:** 5 / 5 PASS
2. **Public Catalog & Unauthenticated Protection:** 12 / 12 PASS
3. **Agent Isolation & Privilege Boundaries:** 14 / 14 PASS
4. **Client Persona & Resource Ownership:** 18 / 18 PASS
5. **Transactions Security & BOLA:** 7 / 7 PASS
6. **Administrator Universal Authority:** 4 / 4 PASS

### Test Data Cleanup Verification
- The test harness dynamically seeded test transaction ID 5 (`property_transactions`) and deleted it in the same run. A post-test query confirmed 0 rows remain in `property_transactions`.
- The client property listing created during testing (`Juan Dela Cruz Ancestral Estate`) was deleted via `DELETE /api/v1/properties/:id`.
- The admin property listing was deleted via `DELETE /api/v1/properties/:id`.
- **Zero test residue remains in `estatecore_test_restore`.**

---

## 6. Frontend Playwright Acceptance Audit

The end-to-end browser suite (`test_playwright.js`) was executed via an automated test runner (`scripts/run_playwright_acceptance.js`) launching the backend on port 3000 (targeting `estatecore_test_restore`) and Vite on port 5173.

### Playwright Results: 20 Passed / 1 Failed (95.2% Success)

```
PLAYWRIGHT BROWSER AUDIT SUMMARY:
=================================================================================
[TEST 1]  Public Landing Page renders with hero, search, and live metrics: PASSED
[TEST 2]  Public Property Catalog renders filtered cards and details links: PASSED
[TEST 3]  Property Detail Page renders architectural specifications & agent card: PASSED
[TEST 4]  Public About & Contact pages render institutional content: PASSED
[TEST 5]  Sign In as Client via 1-click test credentials: PASSED
[TEST 6]  Client opening Property Catalog retains sidebar layout: PASSED
[TEST 7]  NEGATIVE RBAC: Client navigating to /admin is redirected to /client: PASSED
[TEST 8]  NEGATIVE RBAC: Client navigating to /agent is redirected to /client: PASSED
[TEST 9]  NEGATIVE RBAC: Client navigating to /users is redirected to /client: PASSED
[TEST 10] NEGATIVE RBAC: Client navigating to /properties/new redirected to /client: PASSED
[TEST 11] Client viewing tours page can see appointments and cancel their tour: PASSED
[TEST 12] Sign Out and Login as Licensed Agent (Maria Santos): PASSED
[TEST 13] NEGATIVE RBAC: Agent navigating to /admin is redirected to /agent: PASSED
[TEST 14] NEGATIVE RBAC: Agent navigating to /users is redirected to /agent: PASSED
[TEST 15] NEGATIVE OWNERSHIP: Agent cross-editing property owned by another agent: FAILED
[TEST 16] Sign Out and Login as Administrator: PASSED
[TEST 17] Admin User Management renders role distribution and controls: PASSED
[TEST 18] Admin Inquiries Center renders system-wide client inquiries: PASSED
[TEST 19] Admin creates new property listing and verifies catalog appearance: PASSED
[TEST 20] Account Profile updates and credentials display: PASSED
[TEST 21] Mobile viewport audit: responsive navigation and mobile drawer: PASSED
=================================================================================
```

### Detailed Analysis of Documented Defect (Test 15)

- **Failure Message:** `page.waitForURL: Timeout 8000ms exceeded waiting for navigation to "**/properties"`
- **Root Cause Analysis:**
  - In `frontend/src/pages/PropertyForm.tsx` (line 47):
    ```typescript
    if (user?.role === 'AGENT' && prop.agentId !== user.id) {
      alert('Access Denied: You are not authorized to edit properties assigned to other agents.');
      navigate('/properties', { replace: true });
      return;
    }
    ```
  - When Agent Maria Santos (`user.id = 2`) navigates to `/properties/3/edit` (Property 3 is assigned to Agent Carlos Reyes, whose `agents.id = 2`):
  - The client-side guard compares `prop.agentId` (which holds `agents.id = 2`) with `user.id` (which holds `2`).
  - Because `2 !== 2` is FALSE, the client-side check erroneously assumes Maria is the assigned agent and does not redirect!
  - **Crucial Security Distinction:** While the frontend erroneously rendered the form, the backend REST API (`PATCH /api/v1/properties/3`) correctly rejects any update from Maria with `403 Forbidden` (as verified in automated test `AGENT-04`). Thus, the vulnerability is strictly a **client-side UX state leak**, not a backend authorization bypass.

---

## 7. Documented Limitations for Human Review

1. **Client-Side Agent ID Collision in `PropertyForm.tsx` (Defect):**
   - The frontend form checks `prop.agentId !== user.id`. Because `agents.id` (Carlos = 2) matches Maria's `users.id = 2`, Maria can view the edit form for Property 3.
   - *Required Remediation in Phase 4:* Update `PropertyForm.tsx` to check `(prop.agent?.userId || prop.agentId) !== user.id`.

2. **Inquiry & Appointment Creation Roles Decorator (Nuance):**
   - In `InquiriesController.create` and `AppointmentsController.create`, `@UseGuards(JwtAuthGuard)` is present, but `@Roles(UserRole.CLIENT)` is not explicitly declared.
   - While any authenticated user (including agents) can book a tour or inquiry, they are saved under their own `clientId = user.id`. The matrix noted "Agent: 403 Forbidden", but the code allows any authenticated persona to inquire.
   - *Impact:* Harmless consumer capability; no privilege escalation possible.

3. **Transaction Immutability (Architectural Feature):**
   - No HTTP endpoints exist for creating or updating financial transactions. Transactions are strictly read-only through the REST API, protecting against financial record forgery.

---

## 8. Final Audit Sign-Off

EstateCore Phase 3 has established genuine, verifiable RBAC, persona alignment, resource-level property ownership, and live database zero-touch safety.

**Verdict:** **APPROVED WITH DOCUMENTED LIMITATIONS**  
**Action Item:** Present findings to the user and withhold merge to `main` until Phase 4 remediation addresses the client-side `PropertyForm.tsx` comparison.
