# EstateCore Final Audit: Authentication & Security Controls Audit

**Project:** EstateCore — Real Estate Management System  
**Audit Milestone:** Final Project Verification & Academic Submission Audit  
**Auditor:** Independent Technical Auditor & Security Reviewer  
**Audit Date:** November 26, 2026  
**Security References:** `estatecire.pdf` (Lab 06: Security & Authentication), OWASP Top 10 API Security  

---

## 1. Executive Summary

This security audit inspects the cryptographic standards, session lifecycle management, token issuance, server-side revocation, role-based access control (RBAC), Broken Object Level Authorization (BOLA/IDOR) defenses, brute-force rate limiting, and media upload protections in the EstateCore backend.

The audit confirms:
1. **Password Hashing:** `bcrypt` with salt rounds = 10; zero plain-text storage.
2. **JWT Token Structure:** HS256 algorithm with strict 1-hour expiration lifespan (`3600s`).
3. **Agent Claim Disambiguation:** JWT payload embeds `agentId` claim for users with `AGENT` role.
4. **Server-Side Token Revocation:** In-memory blacklist service intercepts logged-out tokens before expiration.
5. **Rate Limiting & Lockout:** 5 consecutive failed logins trigger HTTP `429 Too Many Requests`.
6. **BOLA / IDOR Defense:** Strict resource-level ownership isolation preventing cross-agent and cross-client tampering.
7. **Email-Only Mandate:** Zero SMS gateways or cellular hardware dependencies; notifications use email logging.

---

## 2. JWT Architecture & Token Lifecycle

### 2.1 Token Payload Schema
Decoded JWT payload for Agent persona (Maria Santos):
```json
{
  "sub": 2,
  "email": "maria.santos@estatecore.local",
  "role": "AGENT",
  "agentId": 1,
  "iat": 1732612000,
  "exp": 1732615600
}
```
- `sub`: Refers to `users.id = 2`.
- `agentId`: Refers to `agents.id = 1` (resolving the historical agent collision bug).
- Lifespan: $1732615600 - 1732612000 = 3600$ seconds (exactly 1 hour, Lab 06 Page 20).
- Password and hashes: Strictly absent from payload.

### 2.2 Server-Side Token Blacklisting
- Endpoint: `POST /api/v1/auth/logout`.
- Upon logout, the raw JWT token is stored in `TokenBlacklistService.blacklist(token)`.
- Global `JwtAuthGuard` intercepts every incoming request:
  ```typescript
  if (this.tokenBlacklistService.isBlacklisted(token)) {
    throw new UnauthorizedException('Token has been revoked.');
  }
  ```
- Expired tokens in the blacklist are automatically purged based on TTL.

---

## 3. Role-Based Access Control (RBAC) & Permission Matrix

The application defines 3 canonical roles: `ADMIN`, `AGENT`, and `CLIENT`.

| Resource Endpoint | Action | Unauthenticated | CLIENT | AGENT | ADMIN |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /properties` | Browse catalog | **200 OK** | **200 OK** | **200 OK** | **200 OK** |
| `POST /properties` | Create listing | 401 Unauthorized | **201 Created** (Owner) | **201 Created** (Agent) | **201 Created** (Any) |
| `PATCH /properties/:id` | Update listing | 401 Unauthorized | **200 OK** (If Owner) | **200 OK** (If Assigned) | **200 OK** (Always) |
| `DELETE /properties/:id` | Delete listing | 401 Unauthorized | **200 OK** (If Owner) | 403 Forbidden | **200 OK** (Always) |
| `POST /properties/:id/photos` | Upload photo | 401 Unauthorized | 403 Forbidden | **201 Created** (If Assigned) | **201 Created** (Always) |
| `GET /users` | List user accounts | 401 Unauthorized | 403 Forbidden | 403 Forbidden | **200 OK** |
| `GET /users/:id` | View user profile | 401 Unauthorized | **200 OK** (If Self) | **200 OK** (If Self) | **200 OK** (Always) |
| `POST /transactions` | Record sale deal | 401 Unauthorized | 403 Forbidden | **201 Created** (If Assigned) | **201 Created** (Always) |
| `GET /transactions/:id` | View transaction | 401 Unauthorized | **200 OK** (If Buyer) | **200 OK** (If Assigned) | **200 OK** (Always) |

---

## 4. Broken Object Level Authorization (BOLA) Audit

Independent security tests specifically verified BOLA defenses:
1. **Cross-Agent Property Modification:** Agent Carlos Reyes attempted `PATCH /properties/1` (assigned to Maria Santos). Server responded `403 Forbidden`. **PASSED.**
2. **Cross-Agent Photo Upload:** Agent Carlos attempted `POST /properties/1/photos`. Server responded `403 Forbidden`. **PASSED.**
3. **Cross-Agent Inquiry Snooping:** Agent Carlos attempted `GET /inquiries/1` (assigned to Maria). Server responded `403 Forbidden`. **PASSED.**
4. **Cross-Client Inquiry Snooping:** Client Elena Roxas attempted `GET /inquiries/1` (submitted by Juan Dela Cruz). Server responded `403 Forbidden`. **PASSED.**
5. **Cross-Buyer Transaction Snooping:** Client Elena attempted `GET /transactions/19` (purchased by Juan Dela Cruz). Server responded `403 Forbidden`. **PASSED.**

---

## 5. Rate Limiting & Input Sanitization

### 5.1 Login Rate Limiting (Lab 06 Page 21)
- Threshold: 5 consecutive failed login attempts within a 15-minute sliding window.
- In `scripts/test_phase5_1_stabilization.js`:
  - Attempts 1–5: `401 Unauthorized`.
  - Attempt 6: `429 Too Many Requests: Too many failed login attempts. Please try again later.`
- **Verdict: PASSED.**

### 5.2 Media Asset Upload Protections
- **Size Limitation:** Maximum file size strictly limited to 5MB (5,242,880 bytes).
- **MIME Whitelist:** `image/jpeg`, `image/png`, `image/webp`. Executables and SVG vectors are rejected.
- **Path Traversal Defense:** Filenames containing `../` or relative paths are rejected with `400 Bad Request`.
- **Verdict: PASSED.**

---

## 6. Audit Conclusion

The security architecture satisfies all academic criteria from `estatecire.pdf` Lab 06 and adheres to OWASP API Security best practices.
