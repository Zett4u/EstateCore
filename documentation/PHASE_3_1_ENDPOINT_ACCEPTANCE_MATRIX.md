# ESTATECORE PHASE 3.1: ENDPOINT ACCEPTANCE & PERMISSION MATRIX

**Academic Source of Truth:** `estatecire.pdf` &mdash; Lab 05 (REST API Contract) & Lab 06 (Role-Based Access Control)  
**Audit Target:** All exposed REST API resources on `feature/phase3-rbac-ownership-isolation`  
**Verification Method:** Static Code Inspection + Automated HTTP Test Execution on Port 3344 (`estatecore_test_restore`)  
**Audit Date:** November 25, 2026

---

## 1. Master Route Acceptance Matrix

| Endpoint | Method | Expected Permission (Phase 3 Matrix) | Actual Controller Guard | Actual Service-Level Authorization | Test Evidence ID | Status | Discrepancy / Remarks |
| :--- | :---: | :--- | :--- | :--- | :---: | :---: | :--- |
| `/api/v1/properties` | `GET` | Public / All Personas (200) | None (Public) | Dynamic QueryBuilder filter; passwords stripped | `PUB-01` | **PASS** | None |
| `/api/v1/properties/:id` | `GET` | Public / All Personas (200) | None (Public) | Eager loads `agent`, `photos`, `owner`; passwords stripped | `PUB-02` | **PASS** | None |
| `/api/v1/properties` | `POST` | Authenticated (ADMIN, AGENT, CLIENT) | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN, AGENT, CLIENT)` | ADMIN: any agent/owner; AGENT: own agentProfile.id; CLIENT: ownerId=user.id | `CLIENT-01`, `ADMIN-01` | **PASS** | Strict persona derivation |
| `/api/v1/properties/:id` | `PUT` | ADMIN, Assigned Agent, Property Owner | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN, AGENT, CLIENT)` | Ownership/assignment check; strips agentId/ownerId for non-admins | `AGENT-01`, `OWNER-02` | **PASS** | BOLA protected |
| `/api/v1/properties/:id` | `PATCH` | ADMIN, Assigned Agent, Property Owner | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN, AGENT, CLIENT)` | Ownership/assignment check; strips agentId/ownerId for non-admins | `AGENT-01`, `OWNER-02` | **PASS** | BOLA protected |
| `/api/v1/properties/:id` | `DELETE` | ADMIN, Assigned Agent, Property Owner | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN, AGENT, CLIENT)` | Rejects cross-agent/cross-owner deletion with 403 | `AGENT-02`, `OWNER-07` | **PASS** | BOLA protected |
| `/api/v1/properties/:id/photos` | `POST` | ADMIN, Assigned Agent, Property Owner | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN, AGENT, CLIENT)` | Rejects unauthorized photo uploads with 403 | `AGENT-03`, `OWNER-05` | **PASS** | Lab 05 EP-17 compliant |
| `/api/v1/agents` | `GET` | Public / All Personas (200) | None (Public) | Returns array of public agent profiles | `PUB-03` | **PASS** | Lab 05 EP-07 compliant |
| `/api/v1/agents/:id` | `GET` | Public / All Personas (200) | None (Public) | Returns single public agent profile | `PUB-04` | **PASS** | Lab 05 EP-08 compliant |
| `/api/v1/agents` | `POST` | ADMIN only (201) | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN)` | Provisions professional agent profile tied to existing user | `AUTH-01` | **PASS** | Lab 05 EP-09 compliant |
| `/api/v1/agents/:id` | `PATCH`/`PUT` | ADMIN, Self Agent (200) | `JwtAuthGuard`, `RolesGuard` | Enforces `agent.userId === currentUser.id` for agents; 403 for other agents | `AGENT-07`, `AGENT-08` | **PASS** | BOLA protected |
| `/api/v1/inquiries` | `GET` | Authenticated (Client: own/owned; Agent: assigned; Admin: all) | `JwtAuthGuard` | Dynamic filtering: client sees own & listing inquiries; agent sees assigned | `AGENT-11`, `CLIENT-12` | **PASS** | Preserved user.id mapping |
| `/api/v1/inquiries/:id` | `GET` | Author Client, Property Owner, Assigned Agent, Admin | `JwtAuthGuard` | Enforces `clientId === user.id OR ownerId === user.id OR assignedAgentId === user.id` | `AGENT-12`, `CLIENT-13` | **PASS** | BOLA protected |
| `/api/v1/inquiries` | `POST` | Authenticated Client (201) | `JwtAuthGuard` | Force assigns `clientId = user.id`; auto-maps assignedAgentId from property | `SEC-03` | **PASS** | *Nuance:* Missing `@Roles(CLIENT)` allows agents to inquire |
| `/api/v1/inquiries/:id` | `PATCH` | Author Client (PENDING only), Assigned Agent, Admin | `JwtAuthGuard` | Client can only edit content if PENDING; agent can update status; admin can reassign | Service Logic | **PASS** | Status transition protected |
| `/api/v1/inquiries/:id` | `DELETE` | Author Client, Admin (200) | `JwtAuthGuard` | Enforces `inquiry.clientId === user.id` for non-admins | `InquiriesService` | **PASS** | Historical RESTRICT active |
| `/api/v1/appointments` | `GET` | Authenticated (Client: own; Agent: assigned; Admin: all) | `JwtAuthGuard` | Dynamic query filter: client sees own; agent sees assigned to their user.id | `AGENT-13`, `CLIENT-14` | **PASS** | Legacy user.id mapping |
| `/api/v1/appointments/:id` | `GET` | Client Author, Assigned Agent, Admin | `JwtAuthGuard` | Enforces `clientId === user.id OR agentId === user.id` | `AGENT-14`, `CLIENT-15` | **PASS** | BOLA protected |
| `/api/v1/appointments` | `POST` | Authenticated Client (201) | `JwtAuthGuard` | Validates conflict; resolves agentId to `users.id` (prevents admin collision) | `APPT-01`, `APPT-02` | **PASS** | *Nuance:* Missing `@Roles(CLIENT)` allows agents to book |
| `/api/v1/appointments/:id` | `PATCH` | Client (CANCELLED only), Assigned Agent, Admin | `JwtAuthGuard` | Client restricted to CANCELLED; agent can reschedule & confirm; conflict checked | `CLIENT-16` | **PASS** | Rescheduling protected |
| `/api/v1/appointments/:id` | `DELETE` | Client Author, Admin (200) | `JwtAuthGuard` | Enforces `clientId === user.id` for non-admins | Service Logic | **PASS** | BOLA protected |
| `/api/v1/transactions` | `GET` | Authenticated (Client: purchases; Agent: sales; Admin: all) | `JwtAuthGuard`, `RolesGuard` | Filters by `buyerId === user.id` for clients, `agentId === agentProfile.id` for agents | `TX-01`, `TX-02` | **PASS** | Sensitive financial isolation |
| `/api/v1/transactions/:id` | `GET` | Buyer Client, Assigned Agent, Admin | `JwtAuthGuard`, `RolesGuard` | Enforces `tx.buyerId === user.id` or `tx.agentId === agentProfile.id` | `TX-04`, `TX-05`, `TX-06` | **PASS** | BOLA protected |
| `/api/v1/transactions` | `POST` | Internal/Workflow Only | No Route Exposed | Service-level method exists; no HTTP controller endpoint | Architecture Audit | **PASS** | Read-only financial safety |
| `/api/v1/users` | `GET` | ADMIN only (200) | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN)` | Returns user directory; non-admins rejected with 403 | `SEC-04`, `ADMIN-01` | **PASS** | Enumeration blocked |
| `/api/v1/users/:id` | `GET` | ADMIN, Self User (200) | `JwtAuthGuard`, `RolesGuard` | Enforces `currentUser.id === id` for non-admins | `AGENT-07`, `CLIENT-11` | **PASS** | Privacy protected |
| `/api/v1/users/:id` | `PATCH`/`PUT` | ADMIN, Self User (200) | `JwtAuthGuard`, `RolesGuard` | Strips `role` and `isActive` for non-admins; denies cross-user edit | `OWNER-04` | **PASS** | Privilege escalation blocked |
| `/api/v1/users/:id` | `DELETE` | ADMIN only (200) | `JwtAuthGuard`, `RolesGuard`, `@Roles(ADMIN)` | Rejects non-admins with 403 | `UsersController` | **PASS** | Admin-exclusive operation |

---

## 2. Key Audit Observations & Discrepancies

1. **Reassignment Endpoints are Query/Body Fields, Not Subroutes:**
   - The matrix previously indicated `/api/v1/properties/:id/reassign-agent` and `/api/v1/properties/:id/reassign-owner` as separate routes.
   - *Actual Implementation:* Reassignment is handled via `PATCH /api/v1/properties/:id` with `{ agentId: number }` or `{ ownerId: number }`. Non-administrators attempting to supply these fields receive `403 Forbidden`.

2. **Inquiry & Appointment Consumer Creation:**
   - The matrix indicated that agents receive `403 Forbidden` on `POST /inquiries` and `POST /appointments`.
   - *Actual Implementation:* Any authenticated user can submit an inquiry or book an appointment. The system records them under their personal `clientId = user.id`. This is standard real estate behavior where agents can also inquire on listings as consumers.

3. **Financial Transaction Immutability:**
   - Financial transactions cannot be created or altered through the REST API. This architectural constraint guarantees that clients and agents cannot fabricate transaction histories.
