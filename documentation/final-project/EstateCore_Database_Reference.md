# ESTATECORE — DATABASE ARCHITECTURE REFERENCE

**Course:** ITEC 116 — Systems Integration and Architecture 2  
**Instructor:** John Vincent A. Dallego, MIT  
**Student:** Cabico, Cristina O. | BSIT 4-C  
**Database Engine:** MySQL 8.4 Enterprise (InnoDB Storage Engine)  
**Character Set:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  

---

## 1. Schema Topology & Table Structure

The EstateCore database integrates seven core relational tables designed in Third Normal Form (3NF).

```
 +---------------+          1:1          +---------------+
 |     users     | --------------------> |    agents     |
 +---------------+                       +---------------+
   |           |                           |           |
   | 1:N (owner) 1:N (client)              | 1:N       | 1:N
   v           v                           v           v
+------------------+     1:N (cascade)   +---------------+
|    properties    | ------------------> |property_photos|
+------------------+                     +---------------+
   |              |
   | 1:N (restrict)1:N
   v              v
+---------------+  +---------------+     +-----------------------+
|   inquiries   |  | appointments  |     | property_transactions |
+---------------+  +---------------+     +-----------------------+
```

---

## 2. Integrity Constraints & Referential Actions

1. **`users` -> `agents`**:
   - Foreign Key: `agents.userId` REFERENCES `users.id`
   - Cardinality: Exactly One-to-One (`UNIQUE` index on `userId`).
   - Action: `ON DELETE CASCADE`, `ON UPDATE CASCADE`.

2. **`agents` -> `properties`**:
   - Foreign Key: `properties.agentId` REFERENCES `agents.id`
   - Cardinality: One-to-Many.
   - Action: `ON DELETE SET NULL`, `ON UPDATE CASCADE`.

3. **`users` (Owner) -> `properties`**:
   - Foreign Key: `properties.ownerId` REFERENCES `users.id`
   - Cardinality: One-to-Many (Nullable).
   - Action: `ON DELETE SET NULL`, `ON UPDATE CASCADE`.

4. **`properties` -> `property_photos`**:
   - Foreign Key: `property_photos.propertyId` REFERENCES `properties.id`
   - Cardinality: One-to-Many.
   - Action: `ON DELETE CASCADE` (deleting a property automatically removes its media gallery).

5. **`properties` & `users` -> `inquiries`**:
   - Foreign Keys: `inquiries.propertyId` REFERENCES `properties.id`, `inquiries.clientId` REFERENCES `users.id`
   - Cardinality: One-to-Many.
   - Action: `ON DELETE RESTRICT` (protects communication audit trail from accidental deletion of referenced records).

6. **`properties`, `users`, `agents` -> `appointments`**:
   - Foreign Keys: `appointments.propertyId` REFERENCES `properties.id`, `appointments.clientId` REFERENCES `users.id`, `appointments.agentId` REFERENCES `users.id`.
   - Cardinality: One-to-Many.
   - Action: Referential constraint with future date validation.

7. **`properties`, `users`, `agents` -> `property_transactions`**:
   - Foreign Keys: `property_transactions.propertyId` REFERENCES `properties.id`, `property_transactions.buyerId` REFERENCES `users.id`, `property_transactions.agentId` REFERENCES `agents.id`.
   - Cardinality: One-to-Many.
   - Action: Atomic settlement record with write-lock protection.

---

## 3. Migration Baseline
Database migrations are strictly versioned using TypeORM migrations under `database/migrations/`. Live production databases remain untampered, and all local development targets the isolated sandbox `estatecore_test_restore`.
