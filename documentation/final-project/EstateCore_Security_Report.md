# ESTATECORE — APPLICATION SECURITY REPORT

**Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student:** Cabico, Cristina O. | BSIT 4-C  
**Document Ref:** SEC-AUDIT-FINAL-2026-v1.0  
**Audit Scope:** Authentication, Authorization, RBAC, BOLA, File Security, Rate Limiting & Isolation  

---

## 1. Security Architecture Summary

EstateCore implements defense-in-depth security across presentation, transport, application, and persistence tiers:

1. **Authentication:**
   - Stateless JWT authentication utilizing HMAC-SHA256 (`HS256`).
   - Token lifespan strictly configured to 1 hour (`3600s`).
   - Token claims include `sub`, `email`, `role`, and `agentId` (for agent accounts).
   - Server-side revocation mechanism (`TokenBlacklistService`) revokes tokens upon logout.

2. **Role-Based Access Control (RBAC):**
   - Three well-defined personas: `ADMIN`, `AGENT`, `CLIENT`.
   - Global `JwtAuthGuard` and `RolesGuard` intercept requests before controller execution.
   - Self-privilege elevation prevention: Clients cannot update their own role or active status.

3. **Broken Object-Level Authorization (BOLA / IDOR):**
   - Property listing modifications verify that the authenticated agent owns the listing (`property.agentId === currentAgent.id`).
   - Inquiry modifications enforce listing agent or owner association.
   - Financial settlements can only be viewed by the buyer, listing agent, or administrator.

4. **Media Upload Security:**
   - File extension and MIME-type whitelisting (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
   - 5MB maximum file size limit.
   - Directory traversal sanitization: Rejects paths containing `..` or null byte `\0`.
   - Cryptographically random filename generation preventing overwrites and predictability.

5. **Rate Limiting & Anti-Brute Force:**
   - In-memory rate limiting on `/auth/login`. Five consecutive failures trigger HTTP 429 Too Many Requests.

6. **Email-Only Architecture Mandate:**
   - Zero cellular/SMS libraries, gateways, or dependencies present in codebase.

7. **Database Isolation & Audit:**
   - Live database `estatecore_db` remains 100% untouched. All validation executed strictly on `estatecore_test_restore`.

---

## 2. Security Test Suite Empirical Results

- **Suite 1: Final 36+ Endpoint Suite (`scripts/test_final_project_36_endpoints.js`):**
  - Total Tests: 46 | Passed: 46 | Failed: 0 (100.0%)
  - Negative Security Vectors Verified: 401 Unauthorized, 403 Forbidden, 400 Bad Request, 404 Not Found, 409 Double Transaction Conflict.

- **Suite 2: Phase 5.1 Stabilization Suite (`scripts/test_phase5_1_stabilization.js`):**
  - Concurrency & Atomicity: Verified (Pessimistic write locking prevents double-sale).
  - Traversal Hardening: Verified (Rejects traversal sequences).
  - Rate Limiter: Verified (HTTP 429 returned on 5th consecutive failure).
  - Claims Verification: Verified (`agentId` claim present in Maria Santos token).
  - Expiration Verification: Verified (Token expires in 3600 seconds).

- **Suite 3: Phase 3 RBAC Suite (`scripts/test_phase3_security_suite.js`):**
  - 60/60 Security test vectors passed with zero violations.
