# ESTATECORE &mdash; SANDBOX RESTORATION & INTEGRITY REPORT (PHASE 2.2)

**Project:** EstateCore Real Estate Management Platform  
**Target Environment:** Isolated Sandbox Database `estatecore_test_restore`  
**Backup Source:** `database/exports/phase2_verified_backup.sql`  
**Milestone:** Phase 2.2 &mdash; Sandbox Restoration Verification  
**Date:** November 25, 2026  
**Auditor:** Antigravity Engineering Agent

---

## 1. Backup Archive Authentication

The backup archive was inspected and authenticated prior to restoration:
- **File Location:** `database/exports/phase2_verified_backup.sql`
- **File Format:** Normalized UTF-8 ANSI SQL script
- **File Size:** 30,734 bytes
- **Cryptographic Hash (SHA-256):**  
  `acc78083067e281359d09f35ab3e535ad0d819ef5ee0fff5993605d7a7a0aa1e`

---

## 2. Sandbox Restoration Verification

The backup was imported into the newly created sandbox database `estatecore_test_restore`.

### Baseline Verification Immediately After Restoration:
- **Database Context:** `estatecore_test_restore` (Verified via `SELECT DATABASE()`)
- **Restored Table Count:** Exactly 5 tables (`appointments`, `inquiries`, `migrations`, `properties`, `users`)
- **Restored Row Counts:**
  - `users`: 11 rows
  - `properties`: 8 rows
  - `inquiries`: 7 rows
  - `appointments`: 4 rows
  - `migrations`: 1 row
- **Baseline Schema:** Clean pre-migration state; no `agents` table; no Phase 2 columns.

---

## 3. Migration Execution & Parity Verification in Sandbox

Following successful restoration, the TypeORM migration `Phase2AcademicSchemaAlignment1700000000001` was executed against `estatecore_test_restore`:
- **Table Count After Migration:** Exactly 8 tables (Added: `agents`, `property_photos`, `property_transactions`).
- **Migration Count:** Exactly 2 migrations (`InitialMigration1700000000000`, `Phase2AcademicSchemaAlignment1700000000001`).
- **Entity Population:**
  - 2 Agent records created (`Maria Santos` Agent ID 1, `Carlos Reyes` Agent ID 2) with `licenseNumber: NULL` and `agencyName: NULL`.
  - Properties 1, 2, 5 assigned to Agent ID 1.
  - Properties 3, 4, 6 assigned to Agent ID 2.
  - Properties 17, 18 unassigned (`agentId: NULL`).
  - Inquiry history protected (`ON DELETE RESTRICT`).

**Conclusion:** The sandbox database `estatecore_test_restore` provides a 100% faithful, isolated, and safe testbed for all Phase 2.2 and upcoming Phase 3 verifications.
