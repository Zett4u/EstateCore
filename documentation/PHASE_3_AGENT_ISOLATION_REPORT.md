# ESTATECORE PHASE 3: AGENT ISOLATION & PRIVILEGE REPORT
**Academic Context:** `estatecire.pdf` &mdash; Lab 04 (Agent Entity), Lab 05 (REST API), Lab 06 (RBAC & Isolation)  
**Verification Date:** 2026-11-25  
**Target Environment:** Isolated Sandbox Database (`estatecore_test_restore`)

---

## 1. Executive Summary

This report validates the **complete horizontal isolation between professional agents** on the EstateCore platform.
In Phase 2, the `agents` table was introduced and existing properties were partitioned:
- Agent Maria Santos: `userId = 2`, `agentId = 1` (Properties 1, 2, 5).
- Agent Carlos Reyes: `userId = 3`, `agentId = 2` (Properties 3, 4, 6).
- Unassigned (Admin Created): Properties 17, 18 (`agentId = NULL`).

Phase 3 verifies that neither agent can access, modify, delete, or manage listings, inquiries, appointments, or transactions assigned to the other agent.

---

## 2. Test Verification Matrix

| Test Case | Actor | Target Resource | Action | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: |
| `AGENT-01` | Maria Santos (Agent 1) | Property 1 (Agent 1) | Update description | 200 OK | 200 OK | **PASS** |
| `AGENT-02` | Carlos Reyes (Agent 2) | Property 1 (Agent 1) | Update description | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-03` | Carlos Reyes (Agent 2) | Property 1 (Agent 1) | Delete listing | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-04` | Carlos Reyes (Agent 2) | Property 1 (Agent 1) | Upload photo | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-05` | Maria Santos (Agent 1) | Property 1 (Agent 1) | Reassign `agentId: 2` | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-06` | Maria Santos (Agent 1) | Users directory | `GET /api/v1/users` | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-07` | Maria Santos (Agent 1) | Carlos profile | `GET /api/v1/users/3` | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-08` | Maria Santos (Agent 1) | Own profile | `GET /api/v1/users/2` | 200 OK | 200 OK | **PASS** |
| `AGENT-09` | Maria Santos (Agent 1) | Own agent profile | `PATCH /api/v1/agents/1` | 200 OK | 200 OK | **PASS** |
| `AGENT-10` | Carlos Reyes (Agent 2) | Maria agent profile | `PATCH /api/v1/agents/1` | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-11` | Maria Santos (Agent 1) | Inquiries list | `GET /api/v1/inquiries` | 200 (Filtered) | 200 (Only Maria) | **PASS** |
| `AGENT-12` | Carlos Reyes (Agent 2) | Maria inquiry (ID 1) | `GET /api/v1/inquiries/1` | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-13` | Maria Santos (Agent 1) | Appointments list | `GET /api/v1/appointments` | 200 (Filtered) | 200 (Only Maria) | **PASS** |
| `AGENT-14` | Carlos Reyes (Agent 2) | Maria appt (ID 1) | `GET /api/v1/appointments/1` | 403 Forbidden | 403 Forbidden | **PASS** |
| `AGENT-15` | Maria Santos (Agent 1) | Transactions list | `GET /api/v1/transactions` | 200 (Filtered) | 200 (Only Maria) | **PASS** |
| `AGENT-16` | Carlos Reyes (Agent 2) | Maria tx (ID 1) | `GET /api/v1/transactions/1` | 403 Forbidden | 403 Forbidden | **PASS** |

---

## 3. Resolution of the Admin-to-Agent Integer Collision Bug

### Problem
In early iterations, comparing `property.agentId !== user.id` caused Agent Maria Santos (`user.id = 2`) to be denied access to her own listing (Property 1, `agentId = 1`) because `1 !== 2`. Furthermore, if `property.agentId` was `1`, a naive check would grant access to the Admin (`user.id = 1`) instead of Maria!

### Remediation Implemented in Phase 3
1. In `PropertiesService`:
   ```typescript
   if (user.role === UserRole.AGENT) {
     const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });
     if (!agentProfile || property.agentId !== agentProfile.id) {
       throw new ForbiddenException('You are not authorized to update properties assigned to other agents.');
     }
   }
   ```
2. In `AppointmentsService.create` and `InquiriesService.create`:
   When assigning an agent based on a property, the service resolves `property.agent.userId`, ensuring the appointment or inquiry references the agent's `users.id` (e.g., 2 for Maria Santos), fully preserving the legacy appointment table relationships without breaking the UI.

---

## 4. Conclusion

Agent horizontal isolation is verified at 100%. Professional agents cannot access or alter each other's listings, customer leads, tour bookings, or financial transactions.
