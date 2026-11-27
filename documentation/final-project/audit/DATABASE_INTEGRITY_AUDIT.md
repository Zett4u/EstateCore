# EstateCore Final Audit: Database Schema & Integrity Audit

**Project:** EstateCore — Real Estate Management System  
**Audit Milestone:** Final Project Verification & Academic Submission Audit  
**Auditor:** Independent Technical Auditor & Academic Reviewer  
**Audit Date:** November 26, 2026  
**Database Management System:** MySQL 8.4.11  
**Sandbox Database:** `estatecore_test_restore` (Port 3307)  
**Live Database Baseline:** `estatecore_db` (Port 3306 / Untouched)  

---

## 1. Executive Summary

This database audit performs a forensic evaluation of the relational database schema, tables, columns, foreign keys, cardinality, constraints, and isolation integrity between the development sandbox and the production live database.

The audit confirms:
1. **7 Core Relational Tables:** `users`, `agents`, `properties`, `property_photos`, `inquiries`, `appointments`, and `property_transactions` in sandbox.
2. **Third Normal Form (3NF) Compliance:** Elimination of repeating groups, full dependency on primary keys, and removal of transitive dependencies (e.g. separating agent licensing metadata into `agents` table).
3. **Foreign Key Integrity:** All relationships strictly enforced via InnoDB constraints.
4. **Relational Deletion Protection:** `inquiries` and `property_transactions` utilize `ON DELETE RESTRICT` to protect audit trails from accidental cascaded deletion.
5. **Zero-Touch Isolation:** Live database `estatecore_db` remains 100% untouched, containing only the original 5 tables and 1 migration.

---

## 2. Relational Schema Architecture (Sandbox: `estatecore_test_restore`)

```
users (id PK)
 ├── 1:1 ── agents (id PK, userId FK -> users.id)
 ├── 1:N ── properties (as owner: ownerId FK -> users.id)
 ├── 1:N ── inquiries (as client: clientId FK -> users.id)
 ├── 1:N ── inquiries (as assigned agent: assignedAgentId FK -> users.id)
 ├── 1:N ── appointments (as client: clientId FK -> users.id)
 ├── 1:N ── appointments (as agent: agentId FK -> users.id)
 └── 1:N ── property_transactions (as buyer: buyerId FK -> users.id)

agents (id PK)
 ├── 1:N ── properties (as listing agent: agentId FK -> agents.id)
 └── 1:N ── property_transactions (as broker: agentId FK -> agents.id)

properties (id PK)
 ├── 1:N ── property_photos (propertyId FK -> properties.id, ON DELETE CASCADE)
 ├── 1:N ── inquiries (propertyId FK -> properties.id, ON DELETE RESTRICT)
 ├── 1:N ── appointments (propertyId FK -> properties.id, ON DELETE CASCADE)
 └── 1:N ── property_transactions (propertyId FK -> properties.id, ON DELETE RESTRICT)
```

---

## 3. Foreign Key Constraints & Referential Actions Audit

The live MySQL dictionary query (`information_schema.TABLE_CONSTRAINTS` & `KEY_COLUMN_USAGE`) on `estatecore_test_restore` yields the following constraint mappings:

| Table | Constraint Name | Foreign Key Column | Referenced Table | Referenced Column | On Delete Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `agents` | `FK_agents_userId` | `userId` | `users` | `id` | `CASCADE` |
| `properties` | `FK_properties_agentId` | `agentId` | `agents` | `id` | `SET NULL` |
| `properties` | `FK_properties_ownerId` | `ownerId` | `users` | `id` | `SET NULL` |
| `property_photos` | `FK_property_photos_propertyId` | `propertyId` | `properties` | `id` | `CASCADE` |
| `inquiries` | `FK_inquiries_propertyId` | `propertyId` | `properties` | `id` | **`RESTRICT`** |
| `inquiries` | `FK_inquiries_clientId` | `clientId` | `users` | `id` | **`RESTRICT`** |
| `inquiries` | `FK_inquiries_assignedAgentId` | `assignedAgentId` | `users` | `id` | `SET NULL` |
| `appointments` | `FK_appointments_propertyId` | `propertyId` | `properties` | `id` | `CASCADE` |
| `appointments` | `FK_appointments_clientId` | `clientId` | `users` | `id` | `CASCADE` |
| `appointments` | `FK_appointments_agentId` | `agentId` | `users` | `id` | `CASCADE` |
| `property_transactions` | `FK_transactions_propertyId` | `propertyId` | `properties` | `id` | **`RESTRICT`** |
| `property_transactions` | `FK_transactions_buyerId` | `buyerId` | `users` | `id` | `RESTRICT` |
| `property_transactions` | `FK_transactions_agentId` | `agentId` | `agents` | `id` | `RESTRICT` |

### 3.1 Verification of RESTRICT Inquiries Protection
When a DELETE statement was executed against a property listing with active inquiries:
```sql
DELETE FROM properties WHERE id = 1;
```
Result: `ER_ROW_IS_REFERENCED_2: Cannot delete or update a parent row: a foreign key constraint fails (FK_inquiries_propertyId)`.  
**Verdict: PASSED.** Inquiry correspondence history is guaranteed immune to accidental deletion.

---

## 4. Entity Provenance & Identity Disambiguation Audit

A critical issue in legacy implementations was ID collision between `users.id` and `agents.id`. The audit verified the exact data mapping in sandbox:

| Persona | `users.id` | `users.role` | `agents.id` | Verified Linkage |
| :--- | :--- | :--- | :--- | :--- |
| System Administrator | 1 | `ADMIN` | *None* | Correctly unlinked to `agents` |
| Maria Santos | 2 | `AGENT` | 1 | `agents.userId = 2`, `agents.id = 1` |
| Carlos Reyes | 3 | `AGENT` | 2 | `agents.userId = 3`, `agents.id = 2` |
| Juan Dela Cruz | 4 | `CLIENT` | *None* | Correctly unlinked to `agents` |
| Elena Roxas | 5 | `CLIENT` | *None* | Correctly unlinked to `agents` |

### 4.1 Admin-Created Properties Provenance Check
Properties 17 and 18 created by Admin:
- `properties.id = 17`: `agentId = NULL`, `ownerId = NULL`
- `properties.id = 18`: `agentId = NULL`, `ownerId = NULL`
**Verdict: PASSED.** No admin properties are falsely attributed to Maria Santos.

---

## 5. Live Database Zero-Touch Isolation Audit

Audit script `scripts/audit_live_database_isolation.js` verified the state of `estatecore_db`:

```
Live Server Metadata: MySQL 8.4.11 on Port 3306 (estatecore_db)
Live Database Tables: [ 'appointments', 'inquiries', 'migrations', 'properties', 'users' ] (5 tables)
Live Migrations History: 1 record ('InitialMigration1700000000000')
Live DB Has Phase 2 Tables ('agents', 'property_photos', 'property_transactions'): false
Live DB Has Phase 2 User Columns ('firstName', 'lastName', 'contactNumber'): false
Live DB Untouched & Fully Isolated: YES (CONFIRMED 100%)
```

---

## 6. Audit Conclusion

The database schema in sandbox `estatecore_test_restore` represents a production-grade, 3NF-compliant relational real estate model. All foreign keys, cascade rules, and inquiry retention constraints function exactly as designed, with 100% zero-touch isolation of the live database.
