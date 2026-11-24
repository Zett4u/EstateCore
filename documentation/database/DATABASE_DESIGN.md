# EstateCore — Database Design Document
### ITEC 116 — Systems Integration Backend Prototype

## 1. Entity Specifications
The database consists of 4 principal relational tables:
1. **`users`:** Stores system accounts with roles (`ADMIN`, `AGENT`, `CLIENT`), salted password hashes, and active status toggles.
2. **`properties`:** Stores real estate listings across types (`HOUSE`, `APARTMENT`, `CONDOMINIUM`, `COMMERCIAL`, `LAND`, `TOWNHOUSE`) and modes (`SALE`, `RENT`).
3. **`inquiries`:** Stores structured client communication regarding properties with pipeline statuses (`PENDING`, `CONTACTED`, `QUALIFIED`, `CLOSED`).
4. **`appointments`:** Stores scheduled on-site viewing appointments with validation ensuring dates are not in the past and preventing agent double-booking.

## 2. Normalization Analysis
- **1NF:** All fields contain atomic scalar values with unique surrogate primary keys.
- **2NF:** No partial dependencies; all attributes depend on the complete primary key (`id`).
- **3NF:** No transitive dependencies. Foreign keys reference related entities rather than duplicating client, agent, or property metadata.

## 3. Migration & Seeding Runbook
- Migration file: `src/database/migrations/1700000000000-InitialMigration.ts`
- Run Migration: `npm run migration:run`
- Run Seed: `npm run seed`
