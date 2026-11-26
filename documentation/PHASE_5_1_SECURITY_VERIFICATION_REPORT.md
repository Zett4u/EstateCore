# ESTATECORE — PHASE 5.1 SECURITY VERIFICATION REPORT
**Academic Source of Truth:** `estatecire.pdf` (Cabico, Cristina O. | BSIT 4-C — Lab Activity 06)  
**Security Scope:** 8 Defense Layers, Concurrency Attacks, Rate Limiting, BOLA Mitigation, Zero SMS  
**Branch:** `feature/phase5-1-verification-stabilization`  
**Execution Environment:** Isolated Sandbox (`estatecore_test_restore` on MySQL Port 3307)  

---

## 1. Executive Summary

This report provides independent security verification and stabilization evidence for the EstateCore Real Estate Management System under Phase 5.1. The system was challenged against horizontal privilege escalation, race conditions on financial transactions, path traversal file uploads, brute-force credential stuffing, broken object level authorization (BOLA), and unauthorized role elevation.

All 60 test cases from the Phase 3 RBAC suite and 18 additional Phase 5.1 stabilization security scenarios passed with **100.0% success rate (78/78 total security checks)**.

---

## 2. 8 Security Defense Layers Verification (Lab 06)

### Layer 1: Network & Global Middleware Protection
- Parameterized SQL queries via TypeORM prevent SQL injection.
- Global exception filter masks raw database errors and stack traces.
- URL prefix middleware transparently bridges `/api` and `/api/v1` routes.

### Layer 2: Canonical Role-Based Access Control (RBAC)
- Only the 3 canonical roles (`ADMIN`, `AGENT`, `CLIENT`) are recognized.
- Rejection of synthetic or ungrounded global roles (no global SELLER, RENTER, or BROKER).

### Layer 3: Authentication & 1-Hour Token Expiration
- JWT tokens signed with SHA-256 HMAC and an exact 3600-second expiration (`exp - iat === 3600`).
- Tested in `test_phase5_1_stabilization.js` (Test `JWT-EXPIRATION`).

### Layer 4: Server-Side Logout Revocation
- Active tokens are blacklisted in `TokenBlacklistService` upon `POST /api/v1/auth/logout`.
- Blacklisted tokens are rejected immediately with 401 Unauthorized upon reuse.

### Layer 5: Resource-Level Property Ownership & Agent Isolation
- Property ownership is tied to `ownerId` (Client owner) and `agentId` (assigned Agent profile).
- Verified that Maria (`agentId: 1`) cannot update, delete, or upload photos to Carlos's listings (`agentId: 2`).

### Layer 6: Horizontal Authorization & BOLA Elimination
- Client Juan (`userId: 4`) cannot view Elena's user profile (`userId: 5`) -> `403 Forbidden`.
- Client Elena cannot view Juan's purchase transaction receipt -> `403 Forbidden`.
- Agent Carlos cannot record a deal or update an inquiry on Maria's property -> `403 Forbidden`.

### Layer 7: Transaction Concurrency & Relational Deletion Protection
- Transaction creation wrapped in an atomic database transaction with pessimistic write locking (`setLock('pessimistic_write')`).
- Verified with concurrent race condition test: 2 simultaneous requests to buy the same property result in exactly 1 completed deal and 1 rejected with `409 Conflict`.
- Deleting a property with existing transactions returns `409 Conflict`.
- `ON DELETE RESTRICT` foreign keys protect inquiries and transactions against accidental cascading erasure.

### Layer 8: Email-Only Notification Security (Zero SMS)
- All automated alerts use `MailerService`.
- Zero SMS libraries, SDKs, gateways, or configuration variables exist in the codebase.

---

## 3. Maria / Carlos Integer ID Collision Protection

- **The Collision Risk:**
  - Maria Santos: `users.id = 2`, `agents.id = 1`
  - Carlos Reyes: `users.id = 3`, `agents.id = 2`
  - In a naive implementation comparing `property.agentId === user.id`, Maria (`user.id = 2`) would be mistakenly granted permission to manage Carlos's listings (`property.agentId = 2`).
- **Remediation & Independent Verification:**
  - Controllers and services look up the agent profile via `agentsRepository.findOne({ where: { userId: user.id } })` to obtain `agentProfile.id`.
  - Permissions compare `property.agentId === agentProfile.id` (1 === 2 -> False).
  - Cross-agent operations by Maria against Carlos's listings are rejected with `403 Forbidden`.
  - Regression test `AGENT_ISOLATION` and `TX-NEG-CROSS-AGENT` confirm 100% protection.

---

## 4. Rate Limiting Verification (Lab 06 Security Measure 6)

- When an attacker submits 5 consecutive invalid passwords within 10 minutes:
  - Attempt 1: 401 Unauthorized
  - Attempt 2: 401 Unauthorized
  - Attempt 3: 401 Unauthorized
  - Attempt 4: 401 Unauthorized
  - Attempt 5: 401 Unauthorized
  - Attempt 6: **429 Too Many Requests** ("Too many failed login attempts. Account temporarily locked.")
- Verified in `test_phase5_1_stabilization.js` (Test `RATE-LIMIT-LOGIN`).
