# ESTATECORE PHASE 3: COMPREHENSIVE PERMISSION MATRIX
**Academic Source of Truth:** `estatecire.pdf` &mdash; Lab 05 (REST API Contract) & Lab 06 (Access Control)  
**Verification Status:** 100% Verified in Sandbox (`estatecore_test_restore`)

---

## 1. Master HTTP Route & Resource Access Matrix

| Endpoint | HTTP Method | Public / Guest | Client (Standard) | Client (Property Owner) | Agent (Assigned) | Agent (Unassigned) | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/api/v1/properties` | `GET` | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/v1/properties/:id` | `GET` | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/v1/properties` | `POST` | 401 | 201 (Owns listing) | 201 (Owns listing) | 201 (Assigned) | 201 (Assigned) | 201 (Full) |
| `/api/v1/properties/:id` | `PATCH`/`PUT` | 401 | 403 Forbidden | 200 (Own listing) | 200 (Assigned) | 403 Forbidden | 200 OK |
| `/api/v1/properties/:id` | `DELETE` | 401 | 403 Forbidden | 200 (Own listing) | 200 (Assigned) | 403 Forbidden | 200 OK |
| `/api/v1/properties/:id/photos` | `POST` | 401 | 403 Forbidden | 201 (Own listing) | 201 (Assigned) | 403 Forbidden | 201 OK |
| `/api/v1/properties/:id/reassign-agent`| `PATCH` | 401 | 403 Forbidden | 403 Forbidden | 403 Forbidden | 403 Forbidden | 200 OK |
| `/api/v1/properties/:id/reassign-owner`| `PATCH` | 401 | 403 Forbidden | 403 Forbidden | 403 Forbidden | 403 Forbidden | 200 OK |
| `/api/v1/agents` | `GET` | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/v1/agents/:id` | `GET` | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK | 200 OK |
| `/api/v1/agents` | `POST` | 401 | 403 Forbidden | 403 Forbidden | 403 Forbidden | 403 Forbidden | 201 OK |
| `/api/v1/agents/:id` | `PATCH`/`PUT` | 401 | 403 Forbidden | 403 Forbidden | 200 (Own profile) | 403 Forbidden | 200 OK |
| `/api/v1/inquiries` | `GET` | 401 | 200 (Own inqs) | 200 (Own inqs + listing inqs) | 200 (Assigned inqs) | 200 (Empty) | 200 (All) |
| `/api/v1/inquiries/:id` | `GET` | 401 | 200 (Own only) | 200 (Own or listing inq) | 200 (Assigned only) | 403 Forbidden | 200 OK |
| `/api/v1/inquiries` | `POST` | 401 | 201 OK | 201 OK | 403/Forbidden | 403/Forbidden | 201 OK |
| `/api/v1/inquiries/:id` | `PATCH` | 401 | 200 (If PENDING) | 200 (If PENDING) | 200 (Status only) | 403 Forbidden | 200 OK |
| `/api/v1/inquiries/:id` | `DELETE` | 401 | 200 (Own only) | 200 (Own only) | 403 Forbidden | 403 Forbidden | 200 OK |
| `/api/v1/appointments` | `GET` | 401 | 200 (Own appts) | 200 (Own appts) | 200 (Assigned appts)| 200 (Empty) | 200 (All) |
| `/api/v1/appointments/:id` | `GET` | 401 | 200 (Own only) | 200 (Own only) | 200 (Assigned only) | 403 Forbidden | 200 OK |
| `/api/v1/appointments` | `POST` | 401 | 201 OK | 201 OK | 403/Forbidden | 403/Forbidden | 201 OK |
| `/api/v1/appointments/:id` | `PATCH` | 401 | 200 (Cancel only)| 200 (Cancel only) | 200 (Reschedule/Status)| 403 Forbidden | 200 OK |
| `/api/v1/appointments/:id` | `DELETE` | 401 | 200 (Own only) | 200 (Own only) | 403 Forbidden | 403 Forbidden | 200 OK |
| `/api/v1/transactions` | `GET` | 401 | 200 (Own purchases)| 200 (Own purchases)| 200 (Assigned sales)| 200 (Empty) | 200 (All) |
| `/api/v1/transactions/:id` | `GET` | 401 | 200 (Own only) | 200 (Own only) | 200 (Assigned only) | 403 Forbidden | 200 OK |
| `/api/v1/users` | `GET` | 401 | 403 Forbidden | 403 Forbidden | 403 Forbidden | 403 Forbidden | 200 OK |
| `/api/v1/users/:id` | `GET` | 401 | 200 (Self only) | 200 (Self only) | 200 (Self only) | 200 (Self only) | 200 OK |
| `/api/v1/users/:id` | `PATCH` | 401 | 200 (Self profile)| 200 (Self profile)| 200 (Self profile) | 200 (Self profile) | 200 OK |
| `/api/v1/users/:id` | `DELETE` | 401 | 403 Forbidden | 403 Forbidden | 403 Forbidden | 403 Forbidden | 200 OK |

---

## 2. Key Observations & Security Invariants

1. **Horizontal Escalation Protection:**
   - Any attempt by Client $A$ to read, edit, or delete Client $B$'s records results in `403 Forbidden`.
   - Any attempt by Agent $A$ to read, edit, or delete Agent $B$'s records results in `403 Forbidden`.
2. **Vertical Escalation Protection:**
   - Standard clients and agents attempting administrative actions (user enumeration, agent provisioning, role modification, agent reassignment) receive `403 Forbidden`.
3. **Graceful Backward Compatibility:**
   - Legacy routes (`/api/properties`, `/api/inquiries`, `/api/appointments`) follow identical authorization constraints via the canonical `/api/v1` redirection middleware.
