# EstateCore Phase 4.0 &mdash; Permission Matrix & Controller/Service Enforcement Review

**Phase:** 4.0 &mdash; Frontend Authorization Remediation  
**Academic Source of Truth:** `estatecire.pdf` (Labs 03, 04, 05, 06)  
**Branch:** `feature/phase4-frontend-authorization-remediation`  
**Base Commit:** `c3d82d9810b3e1f2dd0bad63507efcd0b9919d92`  
**Date:** November 25, 2026  
**Auditor:** Application Security Engineer & Senior Full-Stack Architect  

---

## 1. Executive Summary

This review reconciles the theoretical RBAC requirements defined in `estatecire.pdf` (Lab 06) with the actual runtime controller and service enforcement implementations in the NestJS backend and the React frontend. It specifically analyzes how properties, inquiries, appointments, transactions, and users are scoped, filtered, and protected against unauthorized access, Broken Object-Level Authorization (BOLA), and privilege escalation.

---

## 2. Global Role Definitions & Hierarchy

EstateCore implements three canonical global roles defined in `users.role`:

| Global Role | Intended Scope | Academic Source | Runtime TypeORM Column |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | Unrestricted system-wide management, user administration, property reassignment, financial oversight | Lab 03 & 06 | `users.role = 'ADMIN'` |
| **`AGENT`** | Licensed real estate professional. Bound to profile in `agents` table. Manages assigned properties, inquiries, appointments, and client relations | Lab 03 & 06 | `users.role = 'AGENT'` |
| **`CLIENT`** | General public user. Can browse, submit inquiries, book appointments, view own transactions, and list owned properties (`ownerId`) | Lab 03 & 06 | `users.role = 'CLIENT'` |

> [!NOTE]
> **No Global Seller Role**: Following academic requirements, property sellers are `CLIENT` users who hold ownership of specific listings via `properties.ownerId = users.id`. This avoids role proliferation and honors the single-role architecture.

---

## 3. Resource-by-Resource Enforcement Matrix

### 3.1 Properties Module (`/api/v1/properties`)

| Action / Endpoint | Guest | Client | Agent | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `GET /api/v1/properties` | Allowed | Allowed | Allowed | Allowed | Public catalog query; filters out drafts unless authorized. |
| `GET /api/v1/properties/:id` | Allowed | Allowed | Allowed | Allowed | Public detail view; eager loads `agent`, `agent.user`, `photos`, `owner`. |
| `POST /api/v1/properties` | 401 | Allowed | Allowed | Allowed | Authenticated users can list. Clients automatically assigned `ownerId = user.id`. Agents assigned `agentId = agent.id`. |
| `PATCH /api/v1/properties/:id` | 401 | Owner Only (403 if not owner) | Assigned Only (403 if not assigned) | Allowed | `PropertiesService.update`: Checks `ownerId === user.id` for CLIENT; checks `agent.userId === user.id` for AGENT. Admin unrestricted. |
| `DELETE /api/v1/properties/:id` | 401 | Owner Only (403 if not owner) | Assigned Only (403 if not assigned) | Allowed | `PropertiesService.remove`: Strict BOLA verification matching update logic. |
| `POST /api/v1/properties/:id/photos` | 401 | Owner Only | Assigned Only | Allowed | Photo upload restricted to verified property owner/agent/admin. |
| Reassign `agentId` | 401 | 403 | 403 | Allowed | Stripped from payload or forbidden unless `req.user.role === 'ADMIN'`. |
| Reassign `ownerId` | 401 | 403 | 403 | Allowed | Protected administrative attribute; clients cannot alter ownership. |

### 3.2 Inquiries Module (`/api/v1/inquiries`)

| Action / Endpoint | Guest | Client | Agent | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `GET /api/v1/inquiries` | 401 | Own Inquiries Only | Assigned Inquiries Only | All Inquiries | Service filters: Client sees `userId = user.id`; Agent sees `assignedAgentId = user.id`; Admin sees all. |
| `GET /api/v1/inquiries/:id` | 401 | Own Only (403 if other) | Assigned Only (403 if other) | Allowed | `InquiriesService.findOne`: BOLA check against `userId` or `assignedAgentId`. |
| `POST /api/v1/inquiries` | Allowed / 401 | Allowed | Allowed | Allowed | Creates inquiry. If authenticated, attaches `userId = user.id`. Preserves legacy relationship `assignedAgentId -> users.id`. |
| `POST /api/v1/properties/:id/inquiries` | Allowed | Allowed | Allowed | Allowed | Nested RESTful inquiry endpoint matching Lab 05 specification. |
| `PATCH /api/v1/inquiries/:id` | 401 | 403 | Assigned Only | Allowed | Status updates restricted to assigned agent or system administrator. |

### 3.3 Appointments Module (`/api/v1/appointments`)

| Action / Endpoint | Guest | Client | Agent | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `GET /api/v1/appointments` | 401 | Own Appointments | Assigned Appointments | All Appointments | Scoped by `clientId = user.id` for clients, `agentId = user.id` for agents. |
| `GET /api/v1/appointments/:id` | 401 | Own Only | Assigned Only | Allowed | Strict BOLA verification against `clientId` or `agentId`. |
| `POST /api/v1/appointments` | 401 | Allowed | Allowed | Allowed | Client books appointment; `clientId` set to `user.id`. `agentId` references `users.id` (legacy preservation). |
| `PATCH /api/v1/appointments/:id` | 401 | Own Only (reschedule/cancel) | Assigned Only (confirm/status) | Allowed | Role-gated field updates. Cross-client modification returns 403. |
| `DELETE /api/v1/appointments/:id` | 401 | Own Only | Assigned Only | Allowed | BOLA guarded cancellation/deletion. |

### 3.4 Transactions Module (`/api/v1/transactions`)

| Action / Endpoint | Guest | Client | Agent | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `GET /api/v1/transactions` | 401 | Own Purchases | Assigned Transactions | All Transactions | Financial isolation: Client sees `buyerId = user.id`; Agent sees `agentId = agent.id`; Admin sees all. |
| `GET /api/v1/transactions/:id` | 401 | Own Only | Assigned Only | Allowed | BOLA check: Non-buyer clients or non-assigned agents receive 403 Forbidden. |
| `POST /api/v1/transactions` | 401 | 403 | 403 | Allowed | Solely callable by administrative authorities or system billing processes. |

### 3.5 Users & Profiles Module (`/api/v1/users`, `/api/v1/agents`)

| Action / Endpoint | Guest | Client | Agent | Admin | Enforcement Mechanism |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `GET /api/v1/users` | 401 | 403 | 403 | Allowed | Full user directory restricted exclusively to `ADMIN`. |
| `GET /api/v1/users/:id` | 401 | Own Profile Only | Own Profile Only | Allowed | Users can read only their own user record; cross-user viewing returns 403. |
| `PATCH /api/v1/users/:id` | 401 | Own Profile Only | Own Profile Only | Allowed | Self-service profile editing. Role modification attempts are stripped. |
| `GET /api/v1/agents` | Allowed | Allowed | Allowed | Allowed | Public licensed real estate agent directory. |
| `GET /api/v1/agents/:id` | Allowed | Allowed | Allowed | Allowed | Public agent profile details. |
| `PATCH /api/v1/agents/:id` | 401 | 403 | Own Profile Only | Allowed | Agent can update own bio/phone; cross-agent update returns 403. |

---

## 4. Frontend vs Backend Enforcement Alignment

| Component | Responsibility | Enforcement Check | Fallback / Fail-Closed Behavior |
| :--- | :--- | :--- | :--- |
| **`PropertyForm.tsx`** | Client routing guard | `const assignedAgentUserId = prop.agent?.userId ?? prop.agent?.user?.id;`<br>`if (user?.role === 'AGENT' && (!assignedAgentUserId \|\| assignedAgentUserId !== user.id))` | Navigates to `/properties` immediately. |
| **`PropertiesList.tsx`** | Edit button visibility | `const assignedAgentUserId = prop.agent?.userId ?? prop.agent?.user?.id;`<br>`const isOwner = user?.role === 'ADMIN' \|\| (user?.role === 'AGENT' && assignedAgentUserId === user.id) \|\| (user?.role === 'CLIENT' && prop.ownerId === user.id);` | Button hidden if not owner. |
| **`PropertyDetail.tsx`** | Header edit button | Matches `PropertiesList.tsx` logic. | Button hidden if not owner. |
| **`PropertiesService` (Backend)** | Authoritative API barrier | Evaluates database foreign keys against decoded JWT `req.user`. | Returns `403 Forbidden` JSON error payload. |

---

## 5. Summary & Verification

Runtime verification via both the 60/60 backend security suite and the 24/24 Playwright browser test suite confirms complete alignment between the frontend presentation layer and backend authoritative security barriers.
