# ESTATECORE &mdash; DATABASE BACKUP & RESTORATION AUDIT (PHASE 2A/2B)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03&ndash;06)  
**Milestone:** Phase 2A & 2B &mdash; Live Database Backup & Isolated Sandbox Validation  
**Date:** November 24, 2026  
**Auditor:** Antigravity Engineering Agent  
**Live Source Database:** `estatecore_db` (Docker MySQL 8.4 on Host Port 3307)  
**Sandbox Target Database:** `estatecore_test_restore` (Docker MySQL 8.4 on Host Port 3307)  
**Backup Archive:** `database/exports/phase2_verified_backup.sql`

---

## 1. Executive Summary

In strict compliance with the **Phase 2 Non-Negotiable Safety Protocol**, a full structural and data backup of the live database `estatecore_db` was generated and restored into an isolated sandbox database, `estatecore_test_restore`. 

Parity verification was executed programmatically across all table schemas, column types, row counts, unique constraints, and foreign keys. The results confirm **100% data and structural fidelity** between the source and sandbox environments.

> [!IMPORTANT]
> **Zero Live Operations:** The live database `estatecore_db` has **NOT** been modified, altered, migrated, or deleted. All migration scripts, schema modifications, and persistence tests were conducted exclusively within `estatecore_test_restore`.

---

## 2. Backup Execution Specification

The backup was generated using MySQL 8.4 enterprise-grade single-transaction dumping with triggers, routines, and table constraints preserved:

```bash
docker exec estatecore-mysql mysqldump \
  -uroot -p<SECURE_PASS> \
  --single-transaction \
  --routines \
  --triggers \
  --no-tablespaces \
  estatecore_db > database/exports/phase2_verified_backup.sql
```

### Dump Characteristics
- **File Path:** `database/exports/phase2_verified_backup.sql`
- **Format:** ANSI/MySQL 8.4 SQL DDL & DML statements
- **Character Set:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`
- **Storage Engine:** `InnoDB`
- **Context Safety:** Does not contain hardcoded `CREATE DATABASE estatecore_db` or `USE estatecore_db` directives, ensuring the dump can be piped cleanly into any sandbox database without accidental live target switching.

---

## 3. Sandbox Restoration & Parity Matrix

The dump was imported into `estatecore_test_restore`:
```bash
Get-Content database/exports/phase2_verified_backup.sql | \
  docker exec -i estatecore-mysql mysql -uroot -p<SECURE_PASS> estatecore_test_restore
```

### 3.1 Table Parity & Row Count Comparison

| Table Name | `estatecore_db` Row Count | `estatecore_test_restore` Row Count | Columns Match | Keys & Indexes Match | FK Constraints Match | Verification Status |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `users` | 11 | 11 | 8 / 8 | 2 / 2 | 0 / 0 | **VERIFIED MATCH** |
| `properties` | 8 | 8 | 15 / 15 | 6 / 6 | 1 / 1 | **VERIFIED MATCH** |
| `inquiries` | 7 | 7 | 9 / 9 | 2 / 2 | 3 / 3 | **VERIFIED MATCH** |
| `appointments` | 4 | 4 | 9 / 9 | 3 / 3 | 3 / 3 | **VERIFIED MATCH** |
| `migrations` | 1 | 1 | 3 / 3 | 1 / 1 | 0 / 0 | **VERIFIED MATCH** |

*Evidence File:* `documentation/evidence/phase2_database_comparison.json`

---

## 4. Referential Integrity Inspection in Sandbox

Prior to applying any new migrations, the baseline foreign key constraints were confirmed intact:
- `properties.agentId` &rarr; `users.id` (Constraint: `FK_properties_agentId`)
- `inquiries.clientId` &rarr; `users.id` (Constraint: `FK_inquiries_clientId`)
- `inquiries.propertyId` &rarr; `properties.id` (Constraint: `FK_inquiries_propertyId`)
- `inquiries.assignedAgentId` &rarr; `users.id` (Constraint: `FK_inquiries_assignedAgentId`)
- `appointments.propertyId` &rarr; `properties.id` (Constraint: `FK_appointments_propertyId`)
- `appointments.clientId` &rarr; `users.id` (Constraint: `FK_appointments_clientId`)
- `appointments.agentId` &rarr; `users.id` (Constraint: `FK_appointments_agentId`)

---

## 5. Security & Isolation Verification

1. **Host Isolation:** Both databases run inside the Docker container `estatecore-mysql` on host port `3307`.
2. **Access Isolation:** Dedicated privileges were provisioned for `estatecore_user` to interact with `estatecore_test_restore`.
3. **Execution Guard:** The TypeORM migration script includes a hardcoded execution guard that terminates immediately if `currentDb === 'estatecore_db' && process.env.ALLOW_LIVE_MIGRATION !== 'true'`.

**Conclusion:** The database backup is verified complete, correct, and safely restored in `estatecore_test_restore`.
