# ESTATECORE &mdash; PHASE 1: SECURITY TEST & VERIFICATION REPORT

**Project:** EstateCore Real Estate Platform  
**Academic Reference:** `estatecire.pdf` &mdash; Laboratory Activity 06 (Authentication, Authorization & Security)  
**Milestone:** Phase 1 &mdash; Security Verification of API Contract & Token Lifecycle  
**Date:** November 24, 2026  
**Auditor:** Antigravity Engineering Agent  
**Evidence Source:** [`documentation/evidence/phase_1_api_test_results.json`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/phase_1_api_test_results.json)

---

## 1. Executive Summary

This report certifies the security verification of the API layer implemented in Phase 1. All security tests were executed against live endpoints on `http://127.0.0.1:3000`.

### Key Security Verifications:
- **JWT Lifespan Compliance:** Verified that access tokens expire after **strictly 3,600 seconds (1 hour)**, matching the exact PDF specification.
- **Genuine Session Revocation (Logout):** Implemented and verified that logging out revokes the JWT token server-side, preventing replay attacks.
- **Strict 401 vs 403 Status Enforcement:** Unauthenticated requests return `401 Unauthorized`; authenticated requests lacking role privileges return `403 Forbidden`.
- **IDOR Protection:** Verified that a client cannot view or update another user's private account record.
- **Payload Whitelisting:** Rejected unexpected or injected payload properties with `400 Bad Request`.

---

## 2. Security Test Matrix & Empirical Findings

| Security Requirement | Tested Vector | Expected Behavior | Actual Behavior | Result | Evidence Test |
|---|---|---|---|:---:|:---:|
| **JWT Lifespan** | Decoded `iat` vs `exp` timestamps | `exp - iat === 3600s` | `exp - iat = 3600` (1 hour) | **PASS** | Phase 1 Test #1 |
| **Token Revocation** | Reusing token after `POST /auth/logout` | `401 Unauthorized` | Status: `401 Unauthorized` | **PASS** | Phase 1 Test #4 |
| **401 Unauthorized** | Accessing `/api/v1/users` with no token | `401 Unauthorized` | Status: `401 Unauthorized` | **PASS** | Phase 1 Test #16 |
| **403 Forbidden** | Client accessing Admin `/api/v1/users` | `403 Forbidden` | Status: `403 Forbidden` | **PASS** | Phase 1 Test #6 |
| **IDOR Prevention** | Client (ID 4) requesting `/api/v1/users/1` | `403 Forbidden` | Status: `403 Forbidden` | **PASS** | Phase 1 Test #7 |
| **Agent Profile Isolation** | Client updating Agent `/api/v1/agents/2` | `403 Forbidden` | Status: `403 Forbidden` | **PASS** | Phase 1 Test #11 |
| **Photo Upload RBAC** | Client uploading photo `/properties/1/photos` | `403 Forbidden` | Status: `403 Forbidden` | **PASS** | Phase 1 Test #14 |
| **Input Whitelisting** | Injected `<script>` and non-DTO fields | `400 Bad Request` | Status: `400 Bad Request` | **PASS** | Phase 1 Test #17 |
| **SQL Injection Defense** | Parameterized search `' OR 1=1 --` | Prepared statement handling | Status: `200 OK` (0 leak) | **PASS** | Compliance Probe |

---

## 3. Deep-Dive on Cryptographic Token Revocation

Previous implementations only handled logout client-side by deleting the JWT token from browser `localStorage`. If an attacker intercepted the token before deletion, it remained valid for its full lifespan.

### Phase 1 Cryptographic Revocation Architecture:
1. When a user requests `POST /api/v1/auth/logout`:
   - `AuthController` extracts the raw Bearer JWT from the authorization header.
   - The token is passed to `TokenBlacklistService.revoke(rawToken, ttlSeconds = 3600)`.
2. On every protected request:
   - `JwtStrategy.validate()` extracts the bearer token before resolving database identity.
   - If `TokenBlacklistService.isRevoked(rawToken)` returns `true`, it immediately aborts:
     ```ts
     throw new UnauthorizedException('Authentication token has been revoked / logged out.');
     ```
3. Verified in automated test #4:
   ```
   [TEST 4] POST /api/v1/auth/logout revokes token; subsequent request rejected with 401 ... PASSED (148ms)
   ```

---

## 4. Policy Clarifications on MFA & Rate Limiting

1. **Multi-Factor Authentication (MFA):**  
   As instructed by user guidance, MFA has **not** been introduced in Phase 1. The PDF's academic requirements do not mandate SMS-based MFA, and SMS functionality is permanently excluded.
2. **Rate Limiting & Lockout:**  
   To be implemented in Phase 4 (Authentication & Security Hardening) using `@nestjs/throttler` across authentication endpoints.

---

## 5. Phase 1 Safety Confirmation

- **Zero modifications were made to the live MySQL database.**
- **Existing passwords, hashes, and records remain completely unaltered.**
- **Working tree is ready for review.**
