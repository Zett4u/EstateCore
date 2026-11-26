# ESTATECORE — PHASE 5.1 DATABASE INTEGRITY & LIVE ISOLATION REPORT
**Academic Source of Truth:** `estatecire.pdf` (Cabico, Cristina O. | BSIT 4-C — Lab Activity 04)  
**Database Audit Target:** `estatecore_test_restore` (Sandbox on MySQL Port 3307)  
**Live Database Target:** `estatecore_db` (Production on MySQL Port 3307)  
**Verification Date:** November 26, 2026  

---

## 1. Executive Summary

This report documents the independent database schema integrity audit, foreign-key relational constraint verification, and cryptographic isolation audit conducted for Phase 5.1. The database architecture models all six core entities from Lab Activity 04 in the isolated sandbox database (`estatecore_test_restore`).

The live database (`estatecore_db`) was independently audited via read-only queries. Zero schema modifications, zero DDL migrations, and zero data writes occurred on `estatecore_db`.

---

## 2. Sandbox Schema & Relational Integrity Verification

### 2.1. Foreign Key Mappings & Cardinalities
```
users (id) <=== 1:1 (ON DELETE CASCADE) ===> agents (userId)
users (id) <=== 1:M (ON DELETE SET NULL) ===> properties (ownerId)
agents (id) <=== 1:M (ON DELETE SET NULL) ===> properties (agentId)
properties (id) <=== 1:M (ON DELETE CASCADE) ===> property_photos (propertyId)
users (id) <=== 1:M (ON DELETE RESTRICT) ===> inquiries (clientId)
properties (id) <=== 1:M (ON DELETE RESTRICT) ===> inquiries (propertyId)
properties (id) <=== 1:M (ON DELETE RESTRICT) ===> property_transactions (propertyId)
users (id) <=== 1:M (ON DELETE RESTRICT) ===> property_transactions (buyerId)
agents (id) <=== 1:M (ON DELETE SET NULL) ===> property_transactions (agentId)
```

### 2.2. Delete & Cascade Safety Constraints
- **Inquiry Protection (`ON DELETE RESTRICT`):** Prevents accidental deletion of users or listings if formal inquiries or offers exist.
- **Transaction Protection (`ON DELETE RESTRICT`):** Prevents deletion of properties or buyer records involved in completed financial transactions. Verified with `EP-12-CONFLICT` (returns `409 Conflict`).
- **Photo Cascade (`ON DELETE CASCADE`):** Automatically cleans up gallery image references when a draft listing is deleted.

---

## 3. Live Database Isolation & Cryptographic Audit

The live database (`estatecore_db`) was fingerprinted and audited using `scripts/audit_live_database_isolation.js`:

| Parameter | Baseline Value | Post-Execution Audit | Compliance Status |
|---|---|---|---|
| **Database Name** | `estatecore_db` | `estatecore_db` | **VERIFIED** |
| **MySQL Version** | `8.4.11` | `8.4.11` | **VERIFIED** |
| **Tables Count** | Exactly 5 | Exactly 5 | **VERIFIED** |
| **Table List** | `appointments`, `inquiries`, `migrations`, `properties`, `users` | `appointments`, `inquiries`, `migrations`, `properties`, `users` | **VERIFIED (0 Added)** |
| **Migrations Applied** | 1 (`InitialMigration1700000000000`) | 1 (`InitialMigration1700000000000`) | **VERIFIED (0 Applied)** |
| **Users Record Count** | 11 | 11 | **VERIFIED (Identical)** |
| **Properties Record Count** | 8 | 8 | **VERIFIED (Identical)** |
| **Inquiries Record Count** | 7 | 7 | **VERIFIED (Identical)** |
| **Appointments Record Count**| 4 | 4 | **VERIFIED (Identical)** |
| **Backup File SHA-256** | `32ce36ec92d4d330bb07b542411b62923dc7671b1908daae577090b0ece12d36` | `32ce36ec92d4d330bb07b542411b62923dc7671b1908daae577090b0ece12d36` | **VERIFIED (Match)** |
| **Phase 2/5 Tables in Live DB** | FALSE | FALSE | **VERIFIED (Isolated)** |
| **Phase 2/5 Columns in Live DB**| FALSE | FALSE | **VERIFIED (Isolated)** |

### Cryptographic Fingerprint Hashes (Live DB Data Rows)
- **Users Data Fingerprint:** Matches pre-test SHA-256 hash
- **Properties Data Fingerprint:** Matches pre-test SHA-256 hash
- **Inquiries Data Fingerprint:** Matches pre-test SHA-256 hash
- **Machine Audit Evidence:** [`documentation/evidence/phase5_1_database_audit.json`](file:///c:/xampp/htdocs/EstateCore/documentation/evidence/phase5_1_database_audit.json)
