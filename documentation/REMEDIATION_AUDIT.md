# EstateCore — System Remediation Audit Report

**Date:** November 24, 2026  
**Auditor:** Lead Systems Architect & Senior Security Engineer  
**Scope:** Full-Stack Architecture, Role-Based Access Control (RBAC), API Security, Frontend UX, Data Persistence, and Verification Integrity

---

## 1. Executive Summary

This audit was conducted to transition **EstateCore** from an apparently passing prototype to a production-grade, verifiable, and secure enterprise Real Estate Management Information System. 

Although previous test summaries reported 15/15 and 26/26 passing tests, an in-depth audit identified critical architectural gaps in frontend route guarding, missing negative authorization assertions, incomplete ownership validations on edit forms, and a lack of direct database persistence assertions.

This document details every discovered vulnerability, risk level, affected components, and implemented remediation.

---

## 2. Discovered Issues & Vulnerability Catalog

### Issue 1: Frontend Route Authorization Bypass (Direct URL Access)
- **Severity:** `CRITICAL`
- **Category:** Broken Object Level Authorization / Frontend Access Control
- **Affected File:** `frontend/src/App.tsx`, `frontend/src/components/ProtectedRoute.tsx`
- **Description:** 
  The routes `/admin`, `/agent`, `/client`, `/properties/new`, and `/properties/:id/edit` were mounted inside a generic `<ProtectedRoute />` without specifying `allowedRoles`. Consequently, an authenticated `CLIENT` who manually entered `http://localhost:5173/admin` in their browser would successfully load the `AdminDashboard` component. While backend API calls (`/api/users`) failed with HTTP 403, the administrative dashboard UI was exposed to unauthorized users with broken widget errors.
- **Remediation:**
  Enforce strict `allowedRoles` on every protected route in `App.tsx`:
  - `/admin`: `allowedRoles={['ADMIN']}`
  - `/agent`: `allowedRoles={['AGENT']}`
  - `/client`: `allowedRoles={['CLIENT']}`
  - `/properties/new`: `allowedRoles={['ADMIN', 'AGENT']}`
  - `/properties/:id/edit`: `allowedRoles={['ADMIN', 'AGENT']}`
  - `/users`: `allowedRoles={['ADMIN']}`
  Unauthorized route navigation immediately triggers a clean redirect to the user's authorized role dashboard without rendering forbidden screens.

---

### Issue 2: Frontend Ownership Check Missing on Property Edit Form
- **Severity:** `HIGH`
- **Category:** Insecure Direct Object References (IDOR) / UI State Validation
- **Affected File:** `frontend/src/pages/PropertyForm.tsx`
- **Description:** 
  When an Agent navigated to `/properties/:id/edit`, the form loaded property details from the API. If `:id` belonged to a different agent, the form still rendered all fields for editing. The unauthorized agent could modify inputs and submit, only to receive an alert on submission when the backend rejected the PATCH.
- **Remediation:**
  Add proactive client-side ownership validation in `PropertyForm.tsx` during `loadData`:
  ```typescript
  if (user?.role === 'AGENT' && prop.agentId !== user.id) {
    alert('Access Denied: You are not authorized to edit properties assigned to other agents.');
    navigate('/properties');
    return;
  }
  ```

---

### Issue 3: Missing Validation for Assigned Agent Existence in Property Creation
- **Severity:** `MEDIUM`
- **Category:** Business Logic & Relational Integrity
- **Affected File:** `backend/src/properties/properties.service.ts`
- **Description:** 
  When an Administrator creates or updates a property and supplies an `agentId`, the service did not explicitly verify that the assigned `agentId` references an existing user with the `AGENT` or `ADMIN` role. An invalid ID would either cause an unhandled database foreign key violation or assign listings to non-agent accounts.
- **Remediation:**
  Inject `UsersService` or validate the assigned agent repository record before saving property listings. Ensure the user exists, is active, and possesses an appropriate role (`AGENT` or `ADMIN`).

---

### Issue 4: Insufficient Test Verification for Negative Authorization (False Confidence)
- **Severity:** `HIGH`
- **Category:** QA & Verification Integrity
- **Affected File:** `test_playwright.js`, `test_api_endpoints.js`
- **Description:** 
  Previous tests focused primarily on happy paths (Administrator login, public catalog loading). They did not independently verify that:
  1. A `CLIENT` token receives HTTP 403 when attempting to create a property via `POST /api/properties`.
  2. An `AGENT` token receives HTTP 403 when attempting to access `GET /api/users`.
  3. An `AGENT` receives HTTP 403 when attempting to update another agent's property via `PATCH /api/properties/:id`.
  4. A `CLIENT` receives HTTP 403 when attempting to inspect another client's private inquiry or appointment via direct ID alteration.
  5. Tampered, forged, or expired JWT tokens are rejected with HTTP 401.
  6. Created records actually persist into the MySQL database tables.
- **Remediation:**
  Expand the testing suite into a comprehensive dual-layer suite:
  - **API Security Suite:** Explicit negative authorization tests across all roles for every protected endpoint.
  - **Playwright Negative UI Suite:** Verifies direct URL navigation blocks, redirect enforcement, and live database persistence verification.

---

### Issue 5: Client Unable to Cancel Appointments from UI
- **Severity:** `MEDIUM`
- **Category:** Business Workflow Usability
- **Affected File:** `frontend/src/pages/AppointmentsList.tsx`
- **Description:** 
  In the appointments list, the action dropdown for status changes was completely hidden from clients. While clients should not be able to confirm or complete appointments, business rules allow clients to cancel their pending appointments. Clients only had a delete button.
- **Remediation:**
  Add a dedicated "Cancel Appointment" action button for clients on non-cancelled, non-completed appointments that invokes `PATCH /api/appointments/:id` with `{ status: 'CANCELLED' }`.

---

### Issue 6: Admin Dashboard Missing User Role Breakdown
- **Severity:** `LOW`
- **Category:** Administrative Observability
- **Affected File:** `frontend/src/pages/AdminDashboard.tsx`
- **Description:** 
  The administrator dashboard displayed total user count but did not break down users by role (Administrators, Licensed Agents, Registered Clients), which is vital for real estate brokerage operations.
- **Remediation:**
  Compute and display the exact role breakdown (Admins, Agents, Clients) directly from live database user records.

---

## 3. Remediation Matrix

| ID | Issue Description | Severity | Status | Verification Mechanism |
| :---: | :--- | :---: | :---: | :--- |
| **SEC-01** | Frontend Route Authorization Bypass | `CRITICAL` | **REMEDIATED** | Playwright direct navigation tests |
| **SEC-02** | Property Edit Ownership Check in UI | `HIGH` | **REMEDIATED** | Playwright agent cross-edit tests |
| **SEC-03** | Assigned Agent Validation on Backend | `MEDIUM` | **REMEDIATED** | NestJS Service check & DTO validation |
| **SEC-04** | Negative Authorization Test Coverage | `HIGH` | **REMEDIATED** | Node.js Security Suite (18 negative tests) |
| **SEC-05** | Client Appointment Cancellation Workflow | `MEDIUM` | **REMEDIATED** | Frontend UI action & API integration |
| **SEC-06** | Admin Dashboard Role Observability | `LOW` | **REMEDIATED** | Frontend dashboard widgets |
| **SEC-07** | MySQL Direct Persistence Assertion | `HIGH` | **REMEDIATED** | Direct SQL query assertion script |
