# ESTATECORE PHASE 3.1: FRONTEND ACCEPTANCE & REGRESSION REPORT

**Auditor:** Independent Frontend Quality & Browser Automation Inspector  
**Audit Target:** EstateCore React Frontend (`frontend/`) & Adaptive Navigation System  
**Test Framework:** Playwright (Chromium Headless with real browser automation)  
**Execution Script:** `test_playwright.js` via `scripts/run_playwright_acceptance.js`  
**Execution Environment:** `http://localhost:5173` (Vite) + `http://localhost:3000` (NestJS on `estatecore_test_restore`)  
**Audit Date:** November 25, 2026  
**Status:** **20 PASSED / 1 FAILED (DOCUMENTED DEFECT)**

---

## 1. Executive Summary

The EstateCore frontend application was subjected to an independent, automated browser regression audit using Playwright. The audit evaluated public catalog browsing, authenticated multi-persona navigation, role-based route guards, adaptive catalog layout preservation, responsive mobile drawers, and client-side authorization boundaries.

The frontend passed **20 out of 21 test scenarios**. One specific client-side authorization defect was identified, analyzed, and reproduced.

---

## 2. Playwright Test Step Breakdown & Results

| Test # | Test Step Name | Persona / Context | Target URL | Result | Verification Evidence |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **1** | Public Landing Page renders with hero, search, and live metrics | Guest | `/` | **PASS** | Hero, search bar, metrics rendered |
| **2** | Public Property Catalog renders filtered cards and details links | Guest | `/properties` | **PASS** | Filtered cards, pagination, detail buttons |
| **3** | Property Detail Page renders architectural specifications & agent card | Guest | `/properties/1` | **PASS** | Specs, price, agent Maria Santos card |
| **4** | Public About & Contact pages render institutional content | Guest | `/about`, `/contact` | **PASS** | Institutional text, contact form |
| **5** | Sign In as Client via 1-click test credentials | Client | `/login` &rarr; `/client` | **PASS** | JWT stored, Client Portal rendered |
| **6** | Client opening Property Catalog retains sidebar navigation and workspace layout | Client | `/properties` | **PASS** | `AdaptiveCatalogLayout` preserved |
| **7** | NEGATIVE RBAC: Client navigating to `/admin` redirected to `/client` | Client | `/admin` &rarr; `/client` | **PASS** | Unauthorized route redirect |
| **8** | NEGATIVE RBAC: Client navigating to `/agent` redirected to `/client` | Client | `/agent` &rarr; `/client` | **PASS** | Unauthorized route redirect |
| **9** | NEGATIVE RBAC: Client navigating to `/users` redirected to `/client` | Client | `/users` &rarr; `/client` | **PASS** | Unauthorized route redirect |
| **10** | NEGATIVE RBAC: Client navigating to `/properties/new` redirected to `/client` | Client | `/properties/new` | **PASS** | Unauthorized route redirect |
| **11** | Client viewing tours page can see appointments and cancel their tour | Client | `/appointments` | **PASS** | Appointments table, cancel action |
| **12** | Sign Out and Login as Licensed Agent (Maria Santos) | Agent | `/login` &rarr; `/agent` | **PASS** | Agent Dashboard rendered |
| **13** | NEGATIVE RBAC: Agent navigating to `/admin` redirected to `/agent` | Agent | `/admin` &rarr; `/agent` | **PASS** | Unauthorized route redirect |
| **14** | NEGATIVE RBAC: Agent navigating to `/users` redirected to `/agent` | Agent | `/users` &rarr; `/agent` | **PASS** | Unauthorized route redirect |
| **15** | NEGATIVE OWNERSHIP: Agent cross-editing property owned by another agent | Agent | `/properties/3/edit` | **FAIL** | *Documented Defect (See Section 3)* |
| **16** | Sign Out and Login as Administrator | Admin | `/login` &rarr; `/admin` | **PASS** | Operations Dashboard rendered |
| **17** | Admin User Management renders role distribution and controls | Admin | `/users` | **PASS** | User table, role filters, moderation |
| **18** | Admin Inquiries Center renders system-wide client inquiries | Admin | `/inquiries` | **PASS** | Inquiries pipeline, status tags |
| **19** | Admin creates new property listing and verifies catalog appearance | Admin | `/properties/new` | **PASS** | Published test listing; cleaned up |
| **20** | Account Profile updates and credentials display | Admin | `/profile` | **PASS** | Profile form, credentials display |
| **21** | Mobile viewport audit: responsive navigation and mobile drawer | Mobile (375x812) | `/` | **PASS** | Hamburger toggle, mobile drawer |

---

## 3. Deep Dive: Documented Defect in Test 15

### 3.1 Symptom
During Test 15, Agent Maria Santos logged into the system and navigated to `http://localhost:5173/properties/3/edit`. Property 3 is assigned to Agent Carlos Reyes (`agentId = 2`). The test expected the frontend to deny access, display an alert, and redirect Maria back to `/properties`. Instead, `page.waitForURL` timed out after 8,000ms because the page did **not** redirect.

### 3.2 Root-Cause Analysis
In `frontend/src/pages/PropertyForm.tsx` (lines 46–52):
```typescript
// Strict ownership check: AGENT cannot edit listings assigned to another agent
if (user?.role === 'AGENT' && prop.agentId !== user.id) {
  setAuthError('You are not authorized to edit properties assigned to other agents.');
  alert('Access Denied: You are not authorized to edit properties assigned to other agents.');
  navigate('/properties', { replace: true });
  return;
}
```

The bug is a classic **integer collision across decoupled entity tables**:
1. In the database, Property 3 has `properties.agentId = 2` (referencing `agents.id = 2`, which belongs to Agent Carlos Reyes).
2. Agent Maria Santos has `users.id = 2` (referencing `users.id`, because Admin is User 1 and Maria is User 2).
3. The frontend check evaluated:
   `prop.agentId (2) !== user.id (2)` &rarr; `2 !== 2` &rarr; **FALSE**!
4. The client-side logic concluded that Maria Santos was the assigned agent and rendered the edit form!

### 3.3 Security Impact Assessment
- **Client-Side (UX):** A flaw exists where Agent Maria is able to view the edit form fields for Carlos's listing.
- **Backend (API):** **SECURE.** If Maria attempts to submit the form, the backend REST API (`PATCH /api/v1/properties/3`) executes:
  `const agentProfile = await this.agentRepository.findOne({ where: { userId: user.id } });` (Maria's profile ID is 1).
  `if (property.agentId !== agentProfile.id) throw new ForbiddenException(...)` (Property 3 has `agentId = 2`, so `2 !== 1` throws `403 Forbidden`).
  This was verified in automated test `AGENT-01` (`status: 403`).
- **Required Remediation (Phase 4):**
  Update `PropertyForm.tsx` to check `prop.agent?.userId !== user.id` rather than comparing `prop.agentId` to `user.id`.

---

## 4. Viewport Responsiveness Verification

Playwright captured high-resolution screenshots across all key breakpoints:

1. **Desktop Viewport (1440 &times; 900):**
   - Verified dual layout behavior:
     - Guests browsing `/properties` see the public brand navbar and hero banner.
     - Authenticated users browsing `/properties` see the dashboard sidebar, user status badge, and role navigation.
2. **Tablet Viewport (768 &times; 1024):**
   - Sidebar collapses to compact navigation; property grid transitions gracefully from 3 columns to 2 columns.
3. **Mobile Viewport (375 &times; 812):**
   - Verified hamburger button toggle (`button[aria-label="Toggle menu"]`).
   - Mobile navigation drawer opens cleanly; catalog cards stack vertically with legible typography and full touch targets.
   - Evidence saved: `documentation/evidence/playwright/13_mobile_responsive.png`.

---

## 5. Summary Conclusion

The frontend layout, component architecture, routing protections, and responsive viewports are fundamentally sound and visually intact. The single defect identified in Test 15 is documented with its exact root cause and remediation plan.
