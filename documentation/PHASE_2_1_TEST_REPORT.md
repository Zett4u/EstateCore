# ESTATECORE &mdash; TEST & PERSISTENCE VERIFICATION REPORT (PHASE 2.1)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf`  
**Milestone:** Phase 2.1 &mdash; Automated Regression, Authentication & Persistence Validation  
**Date:** November 25, 2026  
**Auditor:** Antigravity Engineering Agent  
**Execution Target:** Isolated Sandbox Database `estatecore_test_restore`

---

## 1. Test Suite Summary

Phase 2.1 executed three specialized integration test suites:
1. `scripts/test_phase2_1_validation.js` &mdash; Schema UP-DOWN-UP, Admin mapping rectification, and inquiry RESTRICT deletion protection.
2. `scripts/test_auth_and_persistence.js` &mdash; Bcrypt hash verification, referential constraint rejection, and schema comparison capture.
3. Production compilation suites for both NestJS backend and React frontend.

---

## 2. Test Execution Results

| Test Scenario | Target | Verification Method | Result | Evidence |
|---|---|---|:---:|---|
| **Deterministic Name Deconstruction** | `users` | Split `fullName` &rarr; `firstName`, `lastName` | **PASSED** | 11/11 accounts correctly populated; contact numbers `NULL` |
| **Admin Mapping Rectification** | `properties` | Properties 17 & 18 `agentId === NULL` | **PASSED** | Admin User 1 properties not assigned to Maria Santos |
| **Standard Agent Assignment** | `properties` | Props 1, 2, 5 &rarr; Agent 1; Props 3, 4, 6 &rarr; Agent 2 | **PASSED** | Maria Santos & Carlos Reyes properly mapped |
| **Inquiry History RESTRICT** | `inquiries` | Attempt `DELETE FROM properties WHERE id = 1` | **PASSED** | MySQL blocked deletion with `ER_ROW_IS_REFERENCED_2` |
| **DOWN Rollback Reversibility** | TypeORM | `dataSource.undoLastMigration()` | **PASSED** | All added tables and columns safely dropped |
| **UP Idempotent Re-application** | TypeORM | `dataSource.runMigrations()` | **PASSED** | Schema cleanly re-created without duplicate errors |
| **Bcrypt Hash Verification (ADMIN)** | `users` | `bcrypt.compare('Password123!', admin.password)` | **PASSED** | Hash intact; authenticates successfully |
| **Bcrypt Hash Verification (AGENT)** | `users` | `bcrypt.compare('Password123!', agent.password)` | **PASSED** | Hash intact; authenticates successfully |
| **Bcrypt Hash Verification (CLIENT)** | `users` | `bcrypt.compare('Password123!', client.password)` | **PASSED** | Hash intact; authenticates successfully |
| **Invalid Agent FK Rejection** | `properties` | Insert property with `agentId = 99999` | **PASSED** | MySQL rejected insertion (`ER_NO_REFERENCED_ROW_2`) |
| **Invalid Owner FK Rejection** | `properties` | Insert property with `ownerId = 99999` | **PASSED** | MySQL rejected insertion (`ER_NO_REFERENCED_ROW_2`) |
| **Photo Persistence** | `property_photos` | Insert and query photo record in sandbox | **PASSED** | Photo ID 1 persisted with valid `filePath` |
| **Transaction Persistence** | `property_transactions` | Insert and query transaction record in sandbox | **PASSED** | Transaction ID 1 persisted with amount ₱18.5M |
| **Live Database Protection** | `estatecore_db` | Direct SQL query of live tables and migrations | **PASSED** | Exactly 5 tables, 1 migration, 0 schema changes |
| **Backend NestJS Build** | TypeScript compiler | `nest build` in `backend/` | **PASSED** | 0 TypeScript diagnostics |
| **Frontend React Build** | Vite compiler | `vite build` in `frontend/` | **PASSED** | 1,613 modules transformed; 0 errors |

---

## 3. Raw Evidence Artifacts

1. [`documentation/evidence/phase2_1_correction_results.json`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/phase2_1_correction_results.json) &mdash; Automated execution log of schema UP, DOWN, re-apply, and inquiry RESTRICT validation.
2. [`documentation/evidence/phase2_1_schema_comparison.json`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/phase2_1_schema_comparison.json) &mdash; Full column-by-column inspection of all sandbox database tables post-migration.
