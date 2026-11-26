# ESTATECORE — PHASE 5.1 REMEDIATION LOG
**Milestone:** Phase 5.1 — Independent Verification & Stabilization  
**Branch:** `feature/phase5-1-verification-stabilization`  
**Base Commit:** `659e746b66d6b68544e49224e8e7a0da670f82dd`  

---

## 1. Executive Summary

This remediation log records all defects, potential vulnerabilities, race conditions, and compliance gaps identified during the independent Phase 5.1 audit of EstateCore, along with the concrete technical remedies implemented and verified.

---

## 2. Identified Defects & Implemented Remediation

### DEFECT-01: Transaction Concurrency & Non-Atomic Property Status Updates
- **Severity:** High (Business & Financial Integrity)
- **Affected Requirement:** REQ-L04-06, REQ-L05-18
- **Root Cause:** In Phase 5.0, `recordTransaction` in `TransactionsService` performed separate, uncoordinated `save` operations on `PropertyTransaction` and `Property`. Under concurrent requests, two buyers could simultaneously purchase the same property before the status updated to `SOLD`.
- **Remediation Implemented:**
  - Injected `DataSource` into `TransactionsService`.
  - Wrapped deal creation and property status update in an atomic database transaction (`this.dataSource.transaction(async (manager) => { ... })`).
  - Added pessimistic write locking (`setLock('pessimistic_write')`) on the property row query within the transaction.
  - Added explicit check: if property is already `SOLD` or `RENTED`, throws `409 ConflictException`.
  - Admin deal attribution now defaults to `property.agentId` rather than hardcoded `1`.
- **Verification Evidence:** `test_phase5_1_stabilization.js` (Test `TX-CONCURRENCY-RACE`): two simultaneous concurrent requests executed against property; exactly 1 succeeded (201 Created) and the second was blocked with 409 Conflict. Property status verified as `SOLD`.

---

### DEFECT-02: Unvalidated File Extensions & Path Traversal in Photo Uploads
- **Severity:** High (System Security & Asset Integrity)
- **Affected Requirement:** REQ-L04-04, REQ-L05-14
- **Root Cause:** In Phase 5.0, `addPhoto` accepted raw uploaded file extensions and allowed arbitrary `filePath` strings without checking for path traversal characters (`..`, `\0`). Furthermore, omitting both file and `filePath` defaulted to an unsplash image rather than returning `400 Bad Request` as required by Lab 05 Card 14.
- **Remediation Implemented:**
  - Added strict extension whitelist: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`. Blocked dangerous executable extensions (`.php`, `.exe`, `.js`, etc.) with `400 Bad Request`.
  - Enforced 5MB file size limit.
  - Used `crypto.randomBytes(8)` to generate safe, unguessable filenames.
  - Added path traversal sanitization on `photoDto.filePath`: throws `400 Bad Request` if `..` or `\0` is present.
  - Throws `400 Bad Request` when neither a file nor `filePath` is provided.
- **Verification Evidence:** `test_phase5_1_stabilization.js` (Tests `PHOTO-PATH-TRAVERSAL`, `PHOTO-MISSING-BODY`, `PHOTO-VALID-ATTACH`): all passed with exact status codes.

---

### DEFECT-03: Missing Login Rate Limiting & Account Lockout
- **Severity:** Medium (Authentication & Brute-Force Defense)
- **Affected Requirement:** REQ-L06-04 (Lab 06 Security Measure 6, Page 21)
- **Root Cause:** Lab 06 Page 21 specifically requires: "5 failed attempts in 10 minutes gives 429 Too Many Requests". The login endpoint previously returned 401 without rate tracking.
- **Remediation Implemented:**
  - Implemented an in-memory sliding-window tracker (`loginAttempts`) in `AuthService`.
  - Records failed login attempts per email address.
  - When 5 failed attempts occur within 10 minutes, blocks subsequent attempts with `429 Too Many Requests` (`HttpException`, `HttpStatus.TOO_MANY_REQUESTS`).
  - Automatically resets failed count upon successful authentication.
- **Verification Evidence:** `test_phase5_1_stabilization.js` (Test `RATE-LIMIT-LOGIN`): 5 consecutive bad passwords triggered HTTP 429 lockout.

---

### DEFECT-04: Missing `agentId` Claim in Agent JWT Token
- **Severity:** Low (Academic Specification Compliance)
- **Affected Requirement:** REQ-L06-05 (Lab 06 Page 22)
- **Root Cause:** Lab 06 Page 22 specifies that Agent tokens must include `agentId` in claims (`{"sub": "7", "role": "Agent", "agentId": 3, ...}`). Phase 5.0 only included `sub`, `email`, and `role`.
- **Remediation Implemented:**
  - Injected `Agent` repository into `AuthService`.
  - In `login`, when `user.role === UserRole.AGENT`, looks up the user's agent profile and adds `agentId: agentProfile.id` to the JWT payload.
- **Verification Evidence:** `test_phase5_1_stabilization.js` (Test `JWT-AGENT-CLAIM`): Maria's decoded JWT payload confirmed `agentId === 1`.

---

## 3. Remediation Verification Summary

| Defect ID | Component | Status | Regression Suite Impact |
|---|---|---|---|
| **DEFECT-01** | `TransactionsService` | **RESOLVED & VERIFIED** | Zero regressions (Phase 3: 60/60, Phase 5: 34/34) |
| **DEFECT-02** | `PropertiesService` (Photos) | **RESOLVED & VERIFIED** | Zero regressions (Phase 5: 34/34, Playwright: 27/27) |
| **DEFECT-03** | `AuthService` (Rate Limit) | **RESOLVED & VERIFIED** | Zero regressions (Phase 3: 60/60, Phase 5: 34/34) |
| **DEFECT-04** | `AuthService` (JWT Claims) | **RESOLVED & VERIFIED** | Zero regressions (Phase 3: 60/60, Phase 5: 34/34) |
