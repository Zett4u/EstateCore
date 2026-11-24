# EstateCore — Full UI, Functionality & RBAC Remediation Report

**Date:** November 24, 2026  
**Auditor & Lead Engineer:** Antigravity Engineering Team  
**Evaluation Scope:** Complete Product-Quality Remediation, Role-Based Access Control (RBAC), Insecure Direct Object References (IDOR), API Contract Integrity, and Direct MySQL Database Persistence

---

## 1. Executive Summary

Following a strict instruction to distrust superficial pass indicators, a comprehensive audit and remediation of **EstateCore** was executed across both backend and frontend layers.

Prior to this remediation, tests verified only surface rendering. The deep audit exposed:
1. **Critical Route Authorization Gaps:** Unchecked client-side routes (`/admin`, `/agent`, `/properties/new`) allowed unauthorized users to directly load forbidden dashboard UIs.
2. **Missing Ownership Safeguards on Edit Forms:** Agents could open property editor forms for properties assigned to other agents.
3. **Missing Backend Relational Validation:** Property assignment lacked verification that assigned agents actually possess broker permissions.
4. **Usability Gaps:** Clients lacked an interface action to cancel their own appointments, and administrators lacked live user role distribution metrics.

All identified vulnerabilities have been remediated, reinforced with server-side ownership checks, and validated through an expanded **dual-layer test suite** featuring **18 backend RBAC/security tests** and **20 Playwright browser tests** (including extensive negative authorization assertions and direct MySQL persistence checks).

---

## 2. Core Remediation Summary

### A. Backend Security & RBAC Enhancements
- **Agent Assignment Validation (`properties.service.ts`):** 
  Injected `User` repository into `PropertiesService`. Before a property listing is created or reassigned by an Administrator, the server validates that the target `agentId` exists in MySQL, is active, and possesses the `AGENT` or `ADMIN` role. Clients cannot be assigned as agents.
- **Strict Role Enforcement:**
  - `POST /api/properties`, `PATCH /api/properties/:id`, `DELETE /api/properties/:id` strictly guarded by `@Roles(UserRole.ADMIN, UserRole.AGENT)` and validated by service-level ownership checks.
  - Non-owner agents attempting to modify or delete another agent's property receive HTTP 403 Forbidden.
  - Clients attempting property mutations receive HTTP 403 Forbidden.
- **IDOR Prevention:**
  - Client inquiries (`GET /api/inquiries/:id`) and viewing appointments (`GET /api/appointments/:id`) enforce ownership checks against the authenticated user's JWT ID. Cross-client inspection attempts receive HTTP 403 Forbidden.
  - Agents attempting to view or modify inquiries/appointments assigned to other agents receive HTTP 403 Forbidden.
- **Privilege Escalation Blocked:**
  - `AuthService.register` hardcodes `role: UserRole.CLIENT`, completely neutralizing mass-assignment attempts.
  - `UsersController.update` strips `role` and `isActive` fields for non-admin callers, preventing self-elevation.

### B. Frontend Route & Workflow Hardening
- **Strict Route Guarding (`App.tsx`):**
  - `/admin` & `/users` $\to$ Strictly protected with `allowedRoles={['ADMIN']}`.
  - `/agent` $\to$ Strictly protected with `allowedRoles={['AGENT']}`.
  - `/client` $\to$ Strictly protected with `allowedRoles={['CLIENT']}`.
  - `/properties/new` & `/properties/:id/edit` $\to$ Strictly protected with `allowedRoles={['ADMIN', 'AGENT']}`.
  - Unauthorized direct URL navigation automatically redirects callers to their designated portal without exposing forbidden screens or triggering console exceptions.
- **Client Appointment Cancellation Workflow (`AppointmentsList.tsx`):**
  Added a direct "Cancel Tour" action for clients on pending appointments that triggers `PATCH /api/appointments/:id` with `{ status: 'CANCELLED' }`.
- **Live Role Breakdown Observability (`AdminDashboard.tsx`):**
  Integrated live metric cards breaking down total registered users into Administrators, Licensed Agents, and Registered Clients.
- **Universal Sign-Out Handler (`Navbar.tsx` & `PublicNavbar.tsx`):**
  Standardized logout handling so signing out from any public or protected page immediately invalidates local tokens and redirects to `/login`.

---

## 3. Test Suite & Verification Results

### Layer 1: Backend Security & RBAC Test Suite (`test_security_rbac.js`)
**Result: 18 / 18 PASSED (100%)**

| Test ID | Test Scenario Description | Expected | Actual | Status |
| :---: | :--- | :---: | :---: | :---: |
| **SEC-01** | Anonymous request to `/api/auth/me` without token | `401 Unauthorized` | `401` | **PASS** |
| **SEC-02** | Tampered / forged JWT token on protected endpoint | `401 Unauthorized` | `401` | **PASS** |
| **SEC-03** | `CLIENT` attempting `GET /api/users` | `403 Forbidden` | `403` | **PASS** |
| **SEC-04** | `AGENT` attempting `GET /api/users` | `403 Forbidden` | `403` | **PASS** |
| **SEC-05** | `CLIENT` attempting `POST /api/properties` | `403 Forbidden` | `403` | **PASS** |
| **SEC-06** | `CLIENT` attempting `PATCH /api/properties/1` | `403 Forbidden` | `403` | **PASS** |
| **SEC-07** | `CLIENT` attempting `DELETE /api/properties/1` | `403 Forbidden` | `403` | **PASS** |
| **SEC-08** | `CLIENT` inspecting another user's profile (`GET /api/users/1`) | `403 Forbidden` | `403` | **PASS** |
| **SEC-09** | `CLIENT` attempting privilege escalation via `PATCH /api/users/:id` | Server strips `role` | `role=CLIENT` | **PASS** |
| **SEC-10** | `AGENT` updating property owned by another agent/admin (IDOR) | `403 Forbidden` | `403` | **PASS** |
| **SEC-11** | `AGENT` deleting property owned by another agent/admin (IDOR) | `403 Forbidden` | `403` | **PASS** |
| **SEC-12** | `ADMIN` assigning non-existent `agentId` to property listing | `400 Bad Request` | `400` | **PASS** |
| **SEC-13** | `CLIENT` inspecting another client's inquiry by ID (IDOR) | `403 Forbidden` | `403` | **PASS** |
| **SEC-14** | `CLIENT` attempting to self-approve appointment (`status=CONFIRMED`) | `403 Forbidden` | `403` | **PASS** |
| **SEC-15** | `CLIENT` cancelling their own appointment (`status=CANCELLED`) | `200 OK` | `200` | **PASS** |
| **SEC-16** | Creating an appointment with date/time in the past | `400 Bad Request` | `400` | **PASS** |
| **SEC-17** | **Direct MySQL Persistence:** Verified client inquiry row in database | SQL ROW FOUND | SQL ROW FOUND | **PASS** |
| **SEC-18** | **Direct MySQL Persistence:** Verified cancelled appointment in database | CANCELLED IN DB | CANCELLED IN DB | **PASS** |

---

### Layer 2: Playwright E2E & Negative Authorization Suite (`test_playwright.js`)
**Result: 20 / 20 PASSED (100% | 0 Console Errors)**

| Test ID | Test Scenario | Verification Details | Status |
| :---: | :--- | :--- | :---: |
| **E2E-01** | Public Landing Page | Hero headline, live metrics, tabbed property search | **PASS** |
| **E2E-02** | Public Catalog Discovery | Filter pills, responsive card grid, details link | **PASS** |
| **E2E-03** | Property Detail Dossier | Specifications grid, price formatting, booking modal | **PASS** |
| **E2E-04** | Public About & Contact | Heritage mission, contact forms, headquarters details | **PASS** |
| **E2E-05** | Client Authentication | 1-click test credentials autofill, redirect to `/client` | **PASS** |
| **E2E-06** | **Negative Route Check** | Client entering `/admin` URL directly $\to$ redirected to `/client` | **PASS** |
| **E2E-07** | **Negative Route Check** | Client entering `/agent` URL directly $\to$ redirected to `/client` | **PASS** |
| **E2E-08** | **Negative Route Check** | Client entering `/users` URL directly $\to$ redirected to `/client` | **PASS** |
| **E2E-09** | **Negative Route Check** | Client entering `/properties/new` URL $\to$ redirected to `/client` | **PASS** |
| **E2E-10** | Client Viewing Tours | Appointment table rendering, client tour cancellation | **PASS** |
| **E2E-11** | Agent Authentication | Login as Agent Maria Santos, redirect to `/agent` | **PASS** |
| **E2E-12** | **Negative Route Check** | Agent entering `/admin` URL directly $\to$ redirected to `/agent` | **PASS** |
| **E2E-13** | **Negative Route Check** | Agent entering `/users` URL directly $\to$ redirected to `/agent` | **PASS** |
| **E2E-14** | **Negative Ownership Check** | Agent entering `/properties/3/edit` (other agent) $\to$ redirected | **PASS** |
| **E2E-15** | Admin Authentication | Login as Administrator, redirect to `/admin` | **PASS** |
| **E2E-16** | Admin User Management | User directory rendering with role counts and toggles | **PASS** |
| **E2E-17** | Admin Inquiries Center | System-wide inquiries table with status changer | **PASS** |
| **E2E-18** | Admin Property Creation | Creates new listing on UI $\to$ verifies appearance in catalog | **PASS** |
| **E2E-19** | Account Settings & Profile | Profile card, name update input, password change | **PASS** |
| **E2E-20** | Responsive Viewport Audit | 375x812 mobile screen, hamburger drawer toggle | **PASS** |

---

## 4. Documentation References

The complete architectural documentation set has been persisted in the repository:
1. [REMEDIATION_AUDIT.md](file:///c:/xampp/htdocs/EstateCore/documentation/REMEDIATION_AUDIT.md) — Comprehensive vulnerability catalog, risk ratings, and file-by-file fixes.
2. [RBAC_PERMISSION_MATRIX.md](file:///c:/xampp/htdocs/EstateCore/documentation/RBAC_PERMISSION_MATRIX.md) — Complete route-by-route and role-by-role permission matrix.
3. [rbac_security_audit_results.json](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/rbac_security_audit_results.json) — Full machine-readable test log for backend security tests.
4. [playwright_remediation_report.json](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/playwright_remediation_report.json) — Full machine-readable test log for Playwright browser tests.
5. Screenshot evidence persisted under `documentation/evidence/playwright/`.
