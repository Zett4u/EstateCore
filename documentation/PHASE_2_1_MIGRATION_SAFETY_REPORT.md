# ESTATECORE &mdash; MIGRATION SAFETY & INQUIRY PROTECTION REPORT (PHASE 2.1)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf`  
**Milestone:** Phase 2.1 &mdash; Reversibility, Idempotency & Inquiry History Protection  
**Date:** November 25, 2026  
**Auditor:** Antigravity Engineering Agent  
**Migration Name:** `Phase2AcademicSchemaAlignment1700000000001`  
**Execution Target:** Isolated Sandbox Database `estatecore_test_restore`

---

## 1. Inquiry History Protection (`ON DELETE RESTRICT`)

In legacy configurations, inquiries carried `ON DELETE CASCADE` referencing `users.id` and `properties.id`. This posed a critical vulnerability where deleting a user account or an unlisted property would silently delete legitimate commercial inquiry history.

### Implementation
In [`1700000000001-Phase2AcademicSchemaAlignment.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/database/migrations/1700000000001-Phase2AcademicSchemaAlignment.ts):
```sql
ALTER TABLE `inquiries` DROP FOREIGN KEY `FK_inquiries_clientId`;
ALTER TABLE `inquiries` DROP FOREIGN KEY `FK_inquiries_propertyId`;

ALTER TABLE `inquiries`
ADD CONSTRAINT `FK_inquiries_clientId` FOREIGN KEY (`clientId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT `FK_inquiries_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
```

### Empirical Verification
During validation execution, an explicit SQL statement attempting to delete Property ID 1 (which holds multiple active inquiries) was dispatched to MySQL:
```sql
DELETE FROM properties WHERE id = 1;
```
**MySQL Engine Response:**
```
ER_ROW_IS_REFERENCED_2: Cannot delete or update a parent row: a foreign key constraint fails (`estatecore_test_restore`.`inquiries`, CONSTRAINT `FK_inquiries_propertyId` FOREIGN KEY (`propertyId`) REFERENCES `properties` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE)
```
**Outcome:** **100% PROTECTED.** Historical inquiries cannot be deleted by deleting properties or clients.

---

## 2. Full Cyclic Migration Reversibility Audit (UP &rarr; DOWN &rarr; UP)

The entire migration lifecycle was executed against `estatecore_test_restore`:

```
=== PHASE 2.1 COMPREHENSIVE VALIDATION SUITE ===
Connected to DataSource. Active DB: estatecore_test_restore

--- Step 2: Executing Migration UP on Sandbox ---
Applied migrations: Phase2AcademicSchemaAlignment1700000000001
- Users: firstName, lastName added and deterministically populated (11/11).
- Properties: Admin properties 17 and 18 agentId set to NULL.
- Inquiries: Client and property FKs converted to RESTRICT.
- Deletion protection test: PASSED (ER_ROW_IS_REFERENCED_2).

--- Step 3: Testing Migration DOWN (Rollback) ---
Migration reverted.
- Tables dropped: agents, property_photos, property_transactions.
- Columns dropped: users.firstName, users.lastName, users.contactNumber.
- Properties: FK restored pointing to users(id).
- Inquiries: FK restored to CASCADE.
Rollback test check: PASSED.

--- Step 4: Re-applying Migration UP (Idempotency Check) ---
Re-applied migrations: Phase2AcademicSchemaAlignment1700000000001
Re-apply idempotency check: PASSED.

--- Step 5: Testing Sandbox Entity Persistence ---
Sandbox persistence check: PASSED.

--- Step 6: Verifying Live Database Untouched ---
Live database untouched: PASSED (100% UNTOUCHED).
```

---

## 3. Programmatic Live Database Safety Gatekeeper

To guarantee zero accidental migration of `estatecore_db`:
```typescript
const currentDb = (queryRunner.connection.options as any).database;
if (currentDb === 'estatecore_db' && process.env.ALLOW_LIVE_MIGRATION !== 'true') {
  throw new Error(
    'SECURITY REJECTION: Live database estatecore_db migration attempted without explicit human authorization! (ALLOW_LIVE_MIGRATION != true)'
  );
}
```
`ALLOW_LIVE_MIGRATION` remains unset, guaranteeing that the live database cannot be modified.
