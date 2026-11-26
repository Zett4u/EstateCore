# ESTATECORE &mdash; FRONTEND REGRESSION & AUTHENTICATION ACCEPTANCE REPORT

**Project:** EstateCore &mdash; Real Estate Management Information System (ITEC 116 Systems Integration Prototype)  
**Milestone:** Frontend Routing & Adaptive Catalog Layout Acceptance  
**Evaluation Date:** November 24, 2026  
**Test Suite:** Playwright Automated Acceptance Runner (`test_frontend_acceptance.js`)  
**Target Environment:** Node.js v22.14.0 / Chromium Headless (1440x900 Viewport) / Vite 6.4.6 / React Router v6  
**Backend Environment:** NestJS 10.3 / Docker MySQL 8.4 (Port 3307 &rarr; 3306)

---

## 1. Executive Summary

This report documents the rigorous, independent verification of the **`AdaptiveCatalogLayout`** and authentication loading guard implemented in `frontend/src/App.tsx`. 

### Key Findings:
- **10 / 10 Test Scenarios Passed (100% Pass Rate)**.
- **Production Build (`npm run build`) Verified**: 1,613 modules transformed, 0 TypeScript errors, 0 Vite bundling warnings.
- **Console Health**: 0 unhandled JavaScript exceptions, 0 render errors, 0 runtime crashes. (The only logged HTTP 401 statuses were intentional assertions verifying the session-expiry security fallback in Scenario 7).
- **Network Request Integrity**: 0 unexpected failed network requests (0 HTTP 4xx / 5xx outside the deliberate Scenario 7 security probe).
- **Separation of Concerns**: This acceptance evaluation was conducted strictly within the frontend layer. **No live database modifications, schema changes, or migrations were executed.**

---

## 2. Test Execution Matrix

| # | Scenario Description | Target Persona | Expected Layout | Actual Layout | Assertions & Selectors | Status | Evidence Artifact |
|---|----------------------|----------------|-----------------|---------------|------------------------|:------:|-------------------|
| **1** | Guest opens `/properties` directly | Guest / Visitor | `PublicLayout` (Header + Footer, no sidebar) | `PublicLayout` | `aside`: 0, `header a[href="/login"]`: 1, `header a[href="/register"]`: 1, `h1`: visible | **PASS** | `01_guest_catalog.png` |
| **2** | CLIENT opens `/properties` directly | `CLIENT` | `DashboardLayout` (Dark sidebar + Workspace topbar) | `DashboardLayout` | `aside`: 1 (`text=Navigation Menu`), `header >> text=CLIENT`: 1, Public `Get Started`: 0 | **PASS** | `02_client_catalog_direct.png` |
| **3** | CLIENT navigates from sidebar | `CLIENT` | `DashboardLayout` (Continuous, persistent) | `DashboardLayout` | URL: `/properties`, Sidebar active class: `bg-forest-700`, No page re-render glitch | **PASS** | `03_client_catalog_from_sidebar.png` |
| **4** | AGENT opens `/properties` | `AGENT` | `DashboardLayout` with Agent permissions | `DashboardLayout` | `header >> text=AGENT`: 1, `Publish New Listing`: 1, `aside >> text=User Management`: 0 | **PASS** | `04_agent_catalog.png` |
| **5** | ADMIN opens `/properties` | `ADMIN` | `DashboardLayout` with Admin permissions | `DashboardLayout` | `header >> text=ADMIN`: 1, `aside >> text=User Management`: 1, `Publish New Listing`: 1 | **PASS** | `05_admin_catalog.png` |
| **6** | Authenticated user hard-refreshes `/properties` | `ADMIN` / `CLIENT` | Handled loading state &rarr; `DashboardLayout` | `DashboardLayout` | No guest navbar flash, No redirect loop, URL stable at `/properties`, `aside`: 1 | **PASS** | `06_client_catalog_after_reload.png` |
| **7** | Session expires while browsing | Stale / Inval. JWT | Safe fallback to login & guest layout | `PublicLayout` | Protected `/admin` &rarr; `/login`, `/properties` gracefully renders `PublicLayout`, no crash | **PASS** | `07_session_expired_safe_fallback.png` |
| **8** | User signs out | Logged-out Client | Sign Out &rarr; `/login`, Catalog &rarr; Public | `PublicLayout` | `localStorage.estatecore_token`: `null`, `/client` &rarr; `/login`, Catalog shows Public Navbar | **PASS** | `08_signed_out_public_catalog.png` |
| **9a** | Guest opens `/properties/1` | Guest | `PublicLayout` Detail View | `PublicLayout` | `aside`: 0, Back button: present, Edit/Delete: 0 | **PASS** | `09a_guest_property_detail.png` |
| **9b** | CLIENT opens `/properties/1` | `CLIENT` | `DashboardLayout` Detail View | `DashboardLayout` | `aside`: 1, Back button: present, Edit/Delete: 0 | **PASS** | `09b_client_property_detail.png` |
| **9c** | AGENT opens `/properties/1` | `AGENT` | `DashboardLayout` Detail View | `DashboardLayout` | `aside`: 1, Agent workspace context active | **PASS** | `09c_agent_property_detail.png` |
| **9d** | ADMIN opens `/properties/1` | `ADMIN` | `DashboardLayout` Detail View | `DashboardLayout` | `aside`: 1, `button:has-text("Edit Listing")`: 1 | **PASS** | `09d_admin_property_detail.png` |
| **10** | Browser History Navigation (Back / Forward) | `CLIENT` | Persistent `DashboardLayout` across history | `DashboardLayout` | `/client` &rarr; `/properties` &rarr; `/properties/1` &rarr; back &rarr; back &rarr; forward &rarr; forward | **PASS** | `10_browser_history_navigation.png` |

---

## 3. Detailed Scenario Analysis & Evidence

### Scenario 1: Guest Direct Access to `/properties`
- **Expected Behavior:** An unauthenticated visitor navigating directly to `/properties` should receive the institutional public layout with top navigation links (`Home`, `Properties`, `About`, `Contact`, `Sign In`, `Get Started`) and the public footer. The admin/client dashboard sidebar must **not** be rendered.
- **Actual Behavior:** `AdaptiveCatalogLayout` evaluates `user` as `null` and `loading` as `false`, cleanly mounting `<PublicLayout />`. The public navigation bar renders with brand logo and authentication action buttons. The DOM query `page.locator('aside')` returned exactly `0` elements.
- **Evidence:** Captured in [`01_guest_catalog.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/01_guest_catalog.png).

---

### Scenario 2: CLIENT Direct Access to `/properties`
- **Expected Behavior:** A logged-in Client hitting `/properties` directly (e.g. via direct URL entry, bookmark, or external link) should immediately render inside the authenticated `DashboardLayout`. The dark workspace sidebar must be present; the public navbar must not appear.
- **Actual Behavior:** `AdaptiveCatalogLayout` renders `<DashboardLayout />`. The sidebar is rendered with client items (`Executive Overview`, `Property Catalog`, `Inquiry Center`, `Viewing Tours`, `Account Settings`). The dashboard top bar displays the client's name and `CLIENT` badge. The public "Get Started" and "Sign In" buttons are completely absent.
- **Evidence:** Captured in [`02_client_catalog_direct.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/02_client_catalog_direct.png).

---

### Scenario 3: CLIENT Sidebar Navigation to `/properties`
- **Expected Behavior:** Clicking "Property Catalog" inside the client portal sidebar should transition the internal content area to the property catalog without triggering a full page reload or tearing down the sidebar navigation shell.
- **Actual Behavior:** Seamless SPA route transition within `<DashboardLayout />`. The sidebar remains mounted and persistent. The "Property Catalog" NavLink receives active styling (`bg-forest-700 text-white`). The catalog header "Curated Real Estate Portfolio" displays without layout jitter.
- **Evidence:** Captured in [`03_client_catalog_from_sidebar.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/03_client_catalog_from_sidebar.png).

---

### Scenario 4: AGENT Access to `/properties`
- **Expected Behavior:** A licensed agent viewing `/properties` should see their workspace shell with the `AGENT` role badge, have the capability to initiate listings via "+ Publish New Listing", and be restricted from seeing system-level administrative navigation like "User Management".
- **Actual Behavior:** The `DashboardLayout` renders with the `AGENT` badge in the header. The header action button `Publish New Listing` (`/properties/new`) is visible and interactive. In the sidebar, the "User Management" link count is strictly `0`.
- **Evidence:** Captured in [`04_agent_catalog.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/04_agent_catalog.png).

---

### Scenario 5: ADMIN Access to `/properties`
- **Expected Behavior:** The System Administrator viewing `/properties` should see full management capabilities, including the `ADMIN` role badge, the "+ Publish New Listing" button, and administrative sidebar navigation (`User Management`).
- **Actual Behavior:** Rendered `<DashboardLayout />` with `ADMIN` badge. `Publish New Listing` button is present. In the sidebar, `User Management` (`/users`) is rendered and accessible.
- **Evidence:** Captured in [`05_admin_catalog.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/05_admin_catalog.png).

---

### Scenario 6: Hard Browser Refresh (`F5`) on `/properties`
- **Expected Behavior:** When an authenticated user refreshes the page, the application must not flash the public guest layout or enter a redirect loop while the session token is being verified against `/api/auth/me`.
- **Actual Behavior:** The loading guard in `AdaptiveCatalogLayout`:
  ```tsx
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-700"></div>
      </div>
    );
  }
  ```
  holds layout evaluation until `api.me()` completes. Once loaded, `<DashboardLayout />` mounts cleanly. The public navbar never flashes, and the browser URL remains stable at `/properties` with zero redirect bouncing.
- **Evidence:** Captured in [`06_client_catalog_after_reload.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/06_client_catalog_after_reload.png).

---

### Scenario 7: Session Expiration & Stale Token Handling
- **Expected Behavior:** If the user's JWT expires or is corrupted in `localStorage`, the client must handle the failure gracefully. Protected pages must redirect to `/login`, and `/properties` must revert to the public catalog without crashing.
- **Actual Behavior:** When an invalid token was injected, navigating to `/admin` immediately triggered `ProtectedRoute` rejection and redirected to `/login`. Navigating to `/properties` gracefully resolved `user` as `null` and rendered `PublicLayout` without unhandled errors.
- **Evidence:** Captured in [`07_session_expired_safe_fallback.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/07_session_expired_safe_fallback.png).

---

### Scenario 8: Explicit User Sign Out
- **Expected Behavior:** Clicking "Sign Out" from the dashboard top bar must purge the JWT token from `localStorage`, invalidate the React auth state, redirect to `/login`, and lock down protected routes.
- **Actual Behavior:** `localStorage.getItem('estatecore_token')` evaluated to `null`. Attempting to visit `/client` resulted in immediate redirect to `/login`. Visiting `/properties` rendered `PublicLayout` with "Sign In" and "Get Started" buttons.
- **Evidence:** Captured in [`08_signed_out_public_catalog.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/08_signed_out_public_catalog.png).

---

### Scenario 9: Property Detail Route (`/properties/:id`) Across Roles
- **Expected Behavior:** The property dossier page must respect the same adaptive rules as the catalog:
  - Guest: Institutional header, no sidebar, back button to portfolio.
  - Client: Dashboard sidebar, no edit/delete controls.
  - Agent: Dashboard sidebar, edit listing controls enabled for owned listings.
  - Admin: Dashboard sidebar, full edit and delete controls.
- **Actual Behavior:** 
  - Guest view (`/properties/1`) rendered inside `PublicLayout` (`aside` count: 0).
  - Client view (`/properties/1`) rendered inside `DashboardLayout` (`aside` present, edit button count: 0).
  - Agent view (`/properties/1`) rendered inside `DashboardLayout` (`aside` present).
  - Admin view (`/properties/1`) rendered inside `DashboardLayout` with visible "Edit Listing" and "Delete" buttons.
- **Evidence:**
  - Guest: [`09a_guest_property_detail.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/09a_guest_property_detail.png)
  - Client: [`09b_client_property_detail.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/09b_client_property_detail.png)
  - Agent: [`09c_agent_property_detail.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/09c_agent_property_detail.png)
  - Admin: [`09d_admin_property_detail.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/09d_admin_property_detail.png)

---

### Scenario 10: Browser Back & Forward History Traversal
- **Expected Behavior:** Using the browser's Back and Forward navigation buttons must traverse between dashboard views and catalog views without state desynchronization, layout flashing, or losing authentication context.
- **Actual Behavior:** Traversal path tested:
  1. `/client` &rarr; Click catalog &rarr; `/properties`
  2. `/properties` &rarr; Click card &rarr; `/properties/1`
  3. Browser Back &rarr; `/properties` (Layout: `DashboardLayout`, sidebar intact)
  4. Browser Back &rarr; `/client` (Layout: `DashboardLayout`, overview cards intact)
  5. Browser Forward &rarr; `/properties` (Layout: `DashboardLayout`, sidebar intact)
  6. Browser Forward &rarr; `/properties/1` (Layout: `DashboardLayout`, sidebar intact)
  All transitions completed with zero DOM layout corruption.
- **Evidence:** Captured in [`10_browser_history_navigation.png`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/acceptance/10_browser_history_navigation.png).

---

## 4. Production Build Verification

```
> estatecore-frontend@1.0.0 build
> tsc && vite build

vite v6.4.6 building for production...
transforming...
✓ 1613 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.46 kB │ gzip:  0.80 kB
dist/assets/index-C0y9qRNO.css   39.38 kB │ gzip:  7.02 kB
dist/assets/index-BlVVETVW.js   357.17 kB │ gzip: 93.40 kB
✓ built in 27.63s
```
- **TypeScript Compiler (`tsc`) Diagnostics:** 0 errors.
- **Vite Bundler Warnings:** 0 warnings.
- **Bundle Output:** Fully optimized single-page application assets generated in `dist/`.

---

## 5. Scope Boundary & Database Status Reminder

> [!IMPORTANT]
> **Strict Separation of Milestones:**  
> This report certifies only the **Frontend Routing & Authentication Acceptance** milestone.  
> 
> In accordance with user instructions, the **Live Database Architecture Migration (Phase A–D)** remains **PENDING INDEPENDENT HUMAN APPROVAL**. The MySQL database `estatecore_db` has **NOT** been modified.
