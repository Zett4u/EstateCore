# ESTATECORE — PHASE 5.0 SECURITY, RBAC & AUTHORIZATION REPORT
**Academic Source of Truth:** `estatecire.pdf` (Cabico, Cristina O. | BSIT 4-C — Lab Activity 06)  
**Security Standard:** 8-Layer Defense Architecture, Resource-Level Ownership, Zero SMS, Strict BOLA Mitigation  
**Milestone:** Phase 5.0 — Academic Requirements Implementation  

---

## 1. Executive Summary

This report documents the security architecture, authorization enforcement, and access control matrix implemented in EstateCore Phase 5.0 in accordance with **Lab Activity 06** of `estatecire.pdf`. The system enforces an 8-layer security framework, eliminating ID collisions between users and agents, preventing Broken Object Level Authorization (BOLA), disallowing horizontal role escalation, revoking server-side JWT tokens on logout, and strictly restricting all outgoing notifications to **Email Only (Zero SMS)**.

Security regression suites verify **100% compliance across all 60 RBAC tests and 34 academic API assertions**.

---

## 2. 8 Security Defense Layers (Lab 06 Compliance)

1. **Layer 1: Network & Global Middleware Protection**
   - Global CORS policy restricted to authorized origins.
   - Transparent `/api/v1` URL normalization protecting legacy clients.
   - Global HTTP exception filtering masking sensitive stack traces in production.
2. **Layer 2: Canonical Role-Based Access Control (RBAC)**
   - Strict enforcement of the three canonical roles: `ADMIN`, `AGENT`, and `CLIENT`.
   - Rejection of synthetic or undocumented roles (e.g. global SELLER).
3. **Layer 3: Authentication & 1-Hour Token Expiration**
   - JWT tokens signed with SHA-256 HMAC and configured with an exact 1-hour expiration lifespan (`expiresIn: '1h'`).
4. **Layer 4: Server-Side Logout Revocation**
   - Active JWT tokens are blacklisted in server memory upon logout (`POST /api/v1/auth/logout`), preventing replay attacks.
5. **Layer 5: Resource-Level Property Ownership & Agent Isolation**
   - Property management is partitioned by `ownerId` (Client owner) and `agentId` (assigned Agent profile).
   - Agent A cannot view, modify, or delete listings assigned to Agent B (`403 Forbidden`).
6. **Layer 6: Horizontal Authorization & BOLA Elimination**
   - Users cannot read or modify account profiles belonging to other users (`users/:id` returns `403 Forbidden` to non-admin cross-access).
   - Inquiries and appointments are isolated to the submitting client, the assigned agent, and administrators.
   - Financial transactions can only be viewed by the involved buyer, the listing agent, or administrators.
7. **Layer 7: Relational Cascade Deletion Protection**
   - Foreign-key constraints use `ON DELETE RESTRICT` on inquiries and property transactions to prevent accidental erasure of financial history.
   - Property deletion is blocked with `409 Conflict` if active transaction records reference the property.
8. **Layer 8: Email-Only Notification Security (Zero SMS)**
   - The application uses `MailerService` exclusively for transaction alerts and inquiry confirmations.
   - Zero SMS gateways (Twilio, Vonage), SMS libraries, or SMS API keys are present in the codebase.

---

## 3. Academic Access Control Matrix (Lab 06 Section 4)

| Endpoint | Guest (Unauth) | Client | Agent (Assigned) | Agent (Cross) | Admin |
|---|---|---|---|---|---|
| `POST /users` (Registration) | `201` | `201` | `201` | `201` | `201` |
| `GET /users/:id` | `401` | Self: `200` / Other: `403` | Self: `200` / Other: `403` | `403` | `200` |
| `PATCH /users/:id` | `401` | Self: `200` / Other: `403` | Self: `200` / Other: `403` | `403` | `200` |
| `DELETE /users/:id` | `401` | `403` | `403` | `403` | `204` |
| `GET /agents` | `200` | `200` | `200` | `200` | `200` |
| `POST /agents` | `401` | `403` | Self: `201` / Dup: `409` | `409` | `201` |
| `GET /properties` | `200` | `200` | `200` | `200` | `200` |
| `GET /properties/:id` | `200` | `200` | `200` | `200` | `200` |
| `POST /properties` | `401` | `403` (or owner) | `201` | `201` | `201` |
| `PUT /properties/:id` | `401` | `403` (or owner) | `200` | `403` | `200` |
| `PATCH /properties/:id` | `401` | `403` (or owner) | `200` | `403` | `200` |
| `DELETE /properties/:id` | `401` | `403` (or owner) | `200` / `409` (Tx) | `403` | `200` / `409` (Tx) |
| `GET /properties/:id/photos` | `200` | `200` | `200` | `200` | `200` |
| `POST /properties/:id/photos` | `401` | `403` (or owner) | `201` | `403` | `201` |
| `POST /properties/:id/inquiries`| `401` | `201` | `201` | `201` | `201` |
| `GET /properties/:id/inquiries` | `401` | `403` | `200` | `403` | `200` |
| `PATCH /properties/:id/inquiries/:inqId`| `401` | `403` | `200` | `403` | `200` |
| `POST /transactions` | `401` | `403` | `201` / `409` (Sold) | `403` | `201` / `409` (Sold) |
| `GET /transactions/:id` | `401` | Buyer: `200` / Other: `403` | Broker: `200` / Other: `403` | `403` | `200` |

---

## 4. Verification Evidence

- **Phase 3 RBAC & Security Test Suite:** 60/60 tests passed (100.0%).
- **Phase 5 Academic Endpoints Suite:** 34/34 assertions passed (100.0%).
- **Playwright Negative Authorization E2E:** 27/27 tests passed (100.0%).
- **Evidence Files:**
  - `documentation/evidence/phase3_security_test_results.json`
  - `documentation/evidence/phase5_test_results.json`
  - `documentation/evidence/playwright_remediation_report.json`
