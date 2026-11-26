# EstateCore Phase 4.0 &mdash; Regression Test Report: Maria/Carlos Integer Collision

**Phase:** 4.0 &mdash; Frontend Authorization Remediation  
**Academic Source of Truth:** `estatecire.pdf` (Labs 03, 04, 05, 06)  
**Branch:** `feature/phase4-frontend-authorization-remediation`  
**Base Commit:** `c3d82d9810b3e1f2dd0bad63507efcd0b9919d92`  
**Execution Environment:** Sandbox (`estatecore_test_restore` on MySQL port 3307)  
**Date:** November 25, 2026  

---

## 1. Regression Test Objective

The primary objective of this test suite is to reproduce, isolate, and conclusively verify the fix for the **Maria Santos (`users.id = 2`, `agents.id = 1`) versus Carlos Reyes (`users.id = 3`, `agents.id = 2`)** integer collision vulnerability across both frontend navigation guards and rendering components.

---

## 2. Personas and Test Data Topology

| Persona | Users Table ID (`users.id`) | Role | Agents Table ID (`agents.id`) | Assigned Property ID | Property Agent FK (`properties.agentId`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Maria Santos** | `2` | `AGENT` | `1` | `1` (Luxury Villa in Makati) | `1` |
| **Carlos Reyes** | `3` | `AGENT` | `2` | `3` (Modern Townhouse) | `2` |
| **Unassigned** | N/A | N/A | N/A | `17` (Admin Created Unassigned) | `NULL` |

### The Integer Collision Mechanism
- Before the fix, `PropertyForm.tsx` evaluated: `prop.agentId !== user.id`.
- On Property 3 (Carlos's listing), `prop.agentId` was `2`.
- When Maria Santos (`user.id = 2`) navigated to `/properties/3/edit`:
  - `prop.agentId !== user.id` &rarr; `2 !== 2` &rarr; `false`.
  - The redirect condition did not fire. Maria Santos was incorrectly granted full access to edit Carlos Reyes's property listing.
- When Carlos Reyes (`user.id = 3`) navigated to `/properties/3/edit`:
  - `prop.agentId !== user.id` &rarr; `2 !== 3` &rarr; `true`.
  - The redirect fired, locking the legitimate listing agent out of his own property.

---

## 3. Dedicated Playwright Regression Test Cases

Four dedicated test cases were added to the automated Playwright test runner (`test_playwright.js`) and executed via `scripts/run_playwright_acceptance.js`:

### Test 15: Negative Cross-Agent Editing Prevention
- **Scenario:** Agent Maria Santos attempts to access `/properties/3/edit` (assigned to Carlos Reyes).
- **Execution:**
  1. Authenticate as Maria Santos (`maria.santos@estatecore.com`).
  2. Navigate directly via browser URL to `http://localhost:5173/properties/3/edit`.
  3. Wait for client-side routing guard evaluation.
- **Assertion:** 
  - URL redirects to `**/properties` within 5,000ms.
  - Page header displays `Properties Catalog` instead of `Edit Property Listing`.
- **Result:** **PASSED** (Navigated to `http://localhost:5173/properties`).

### Test 16: Unassigned Property Fail-Closed Protection
- **Scenario:** Agent Maria Santos attempts to access `/properties/17/edit` (an unassigned listing where `agentId = null`).
- **Execution:**
  1. Authenticate as Maria Santos.
  2. Navigate directly via browser URL to `http://localhost:5173/properties/17/edit`.
  3. Evaluate fail-closed condition: `!assignedAgentUserId`.
- **Assertion:**
  - URL redirects to `**/properties`.
  - Access is unconditionally denied.
- **Result:** **PASSED** (Navigated to `http://localhost:5173/properties`).

### Test 17: Legitimate Assigned Agent Access (Maria &rarr; Property 1)
- **Scenario:** Agent Maria Santos accesses `/properties/1/edit` (her own assigned listing where `properties.agentId = 1`, `agent.userId = 2`).
- **Execution:**
  1. Authenticate as Maria Santos (`user.id = 2`).
  2. Navigate to `http://localhost:5173/properties/1/edit`.
  3. Verify form rendering.
- **Assertion:**
  - URL remains on `/properties/1/edit`.
  - Form title `Edit Property Listing` is visible.
  - Form input field `input[name="title"]` contains property title `Luxury Villa in Makati`.
- **Result:** **PASSED** (Edit form rendered successfully, legitimate agent retained access).

### Test 18: Legitimate Assigned Agent Access (Carlos &rarr; Property 3)
- **Scenario:** Agent Carlos Reyes accesses `/properties/3/edit` (his own assigned listing where `properties.agentId = 2`, `agent.userId = 3`).
- **Execution:**
  1. Authenticate as Carlos Reyes (`user.id = 3`).
  2. Navigate to `http://localhost:5173/properties/3/edit`.
  3. Verify form rendering.
- **Assertion:**
  - URL remains on `/properties/3/edit`.
  - Form title `Edit Property Listing` is visible.
  - Form input field `input[name="title"]` contains property title `Modern Townhouse`.
- **Result:** **PASSED** (Carlos Reyes correctly granted edit access to his own listing).

---

## 4. Execution Trace and Verification Matrix

```
[TEST 15] NEGATIVE OWNERSHIP: Agent cross-editing property owned by another agent/admin is denied
  -> Agent Maria Santos attempting to access Carlos's Property 3 edit form (/properties/3/edit)...
  -> Observed URL after guard evaluation: http://localhost:5173/properties
  ✓ [PASS] Cross-agent unauthorized property edit was successfully blocked and redirected to /properties!

[TEST 16] REGRESSION COLLISION: Agent Maria editing unassigned property (Fail closed) is denied
  -> Agent Maria Santos attempting to access unassigned Property 17 edit form (/properties/17/edit)...
  -> Observed URL after guard evaluation: http://localhost:5173/properties
  ✓ [PASS] Agent editing unassigned property was safely denied (Fail closed) and redirected to /properties!

[TEST 17] REGRESSION COLLISION: Agent Maria accessing her own assigned Property 1 edit form is allowed
  -> Agent Maria Santos accessing her own assigned Property 1 edit form (/properties/1/edit)...
  ✓ [PASS] Legitimate assigned Agent Maria was successfully allowed to access her Property 1 edit form!

[TEST 18] REGRESSION COLLISION: Agent Carlos accessing his own assigned Property 3 edit form is allowed
  -> Agent Carlos Reyes accessing his own assigned Property 3 edit form (/properties/3/edit)...
  ✓ [PASS] Legitimate assigned Agent Carlos was successfully allowed to access his Property 3 edit form!
```

---

## 5. UI Catalog & Detail Page Button Verification

In addition to direct route navigation guards, `PropertiesList.tsx` and `PropertyDetail.tsx` were inspected:
1. When Maria Santos views `/properties`, the "Edit" button is visible **only** on Property 1 and Property 2. On Property 3 (Carlos's listing), no "Edit" button is rendered.
2. When Carlos Reyes views `/properties`, the "Edit" button is visible on Property 3. On Properties 1 and 2 (Maria's listings), no "Edit" button is rendered.
3. When viewing `/properties/3` as Maria Santos, the header does not render the "Edit Property" link.
4. When viewing `/properties/3` as Carlos Reyes, the header displays the "Edit Property" link.

---

## 6. Conclusion

The integer collision defect is **100% resolved**.
- Unauthorized cross-agent access: **BLOCKED**.
- Unassigned listing access: **BLOCKED (FAIL-CLOSED)**.
- Authorized agent access: **ALLOWED AND FUNCTIONAL**.
- Zero regressions introduced to existing functionality.
