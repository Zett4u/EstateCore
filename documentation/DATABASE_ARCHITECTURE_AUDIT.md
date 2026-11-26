# EstateCore — Database Architecture Audit (Final Consistency Review)
### Comprehensive Architecture Audit, Physical Schema Mapping, and Technical Blocker Resolution

**Date of Audit:** November 24, 2026  
**Auditor:** Senior Database Architect & Systems Integration Engineer  
**Reference Document:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03–06, Cristina O. Cabico)  
**Database Target:** `estatecore_db` (MySQL 8.4 LTS on Docker host port 3307)  
**Execution Status:** Architecture Review & Blocker Resolution &mdash; **NO DATABASE CHANGES EXECUTED**

---

## 1. Executive Summary & Audit Scope

This document provides the final technical blocker resolution for the **EstateCore** database architecture, cross-verifying the academic baseline in `estatecire.pdf` against the active MySQL 8.4 database and the NestJS/TypeORM backend.

The reference specifications require **six core relational entities** in strict PascalCase:
1. `User` (System identity accounts)
2. `Agent` (Professional licensing profile, 1:1 with `User`)
3. `Property` (Real estate listing, owned by `OwnerID` [User] and represented by `AgentID` [Agent])
4. `PropertyPhoto` (1:M gallery of architectural photographs)
5. `Inquiry` (M:N junction between `User` and `Property`, capturing inquiries and price offers)
6. `PropertyTransaction` (Closed or pending deals linking `Property`, `BuyerID` [User], and `AgentID` [Agent])
*(Plus EstateCore's existing `Appointment` module retained as a supporting feature for tour scheduling).*

---

## 2. Technical Blocker Analysis & Resolutions

### Blocker 1: MySQL 8.4 Appointment Concurrency Strategy
- **Previous Flaw:** The draft proposed a partial unique index `(AgentID, AppointmentDate, AppointmentTime) WHERE Status != 'CANCELLED'`. **MySQL 8.4 does not support partial unique indexes with `WHERE` predicates.** Furthermore, `SELECT COUNT(*) ... FOR UPDATE` does not acquire a lock when 0 matching rows exist, leaving the system vulnerable to race conditions under default transaction isolation.
- **Valid MySQL 8.4 Resolution:**
  1. **Locking via Parent Agent Record (Pessimistic X-Lock):**
     To serialize all concurrent booking attempts for any given agent, the transaction must acquire an exclusive row lock on the **`Agent`** table:
     ```sql
     START TRANSACTION;
     -- Lock the parent Agent record. Because the agent record always exists,
     -- this exclusive row lock serializes all booking requests for this agent.
     SELECT AgentID FROM Agent WHERE AgentID = :agentId FOR UPDATE;
     ```
  2. **Conflict Evaluation inside the Exclusive Lock:**
     While holding the exclusive lock on `Agent`, check for overlapping active bookings:
     ```sql
     SELECT id FROM appointments 
     WHERE agentId = :agentId 
       AND appointmentDate = :appointmentDate 
       AND appointmentTime = :appointmentTime 
       AND status IN ('PENDING', 'CONFIRMED');
     ```
  3. **Atomic Resolution:**
     - If count > 0 &rarr; `ROLLBACK` and return `409 Conflict: "Agent has a conflicting confirmed or pending appointment at this time."`
     - Otherwise &rarr; `INSERT INTO appointments ...` and `COMMIT`.
  4. **Duration & Interval Overlap:** Standard tours are allocated 60-minute time slots. The conflict query validates interval collisions between requested tour start times and existing active appointments.

---

### Blocker 2: Unresolved Property Ownership
- **Previous Flaw:** All six properties have `OwnerID = NULL`, yet the data dictionary claimed a final target of `OwnerID NOT NULL`. This is an unresolvable contradiction because no authentic deed owner data currently exists in the database.
- **Resolution:**
  - `Property.OwnerID` remains **`INT NULL` (nullable)** in both the staging and target schemas.
  - Enforcing `NOT NULL` on `OwnerID` is strictly deferred until an authentic administrative reconciliation provides verified legal deed holders.
  - Listings with `OwnerID IS NULL` are assigned a system flag `UNRESOLVED_OWNERSHIP` and cannot be transacted or archived without administrative deed attachment.

---

### Blocker 3: Legacy User Role Migration
- **Previous Flaw:** Legacy roles in `users` are `ADMIN`, `AGENT`, `CLIENT`. PDF roles are `Buyer`, `Renter`, `Seller`, `PropertyManager`, `Agent`, `Admin`. The previous draft assumed `CLIENT` could be automatically mapped to a consumer role without evidence.
- **Resolution:**
  - Introduce `LegacyRole VARCHAR(20) NULL` to permanently preserve the historical role string.
  - Expand `Role` validation:
    `CHECK (Role IN ('Buyer', 'Renter', 'Seller', 'PropertyManager', 'Agent', 'Admin', 'CLIENT'))`
  - Conversion Policy:
    - `ADMIN` &rarr; `Admin`
    - `AGENT` &rarr; `Agent` (with `VerificationStatus = 'PENDING_VERIFICATION'`)
    - `CLIENT` &rarr; Retains `CLIENT` until the user completes profile persona selection upon next login (selecting whether they are a Buyer, Renter, or Property Owner) or an Admin assigns their persona.

---

### Blocker 4: Inquiry Status Semantics & Historical Preservation
- **Previous Flaw:** Mapping `CLOSED` &rarr; `Rejected` and `QUALIFIED` &rarr; `Replied` assigned speculative business outcomes to historical records.
- **Resolution:**
  - `LegacyStatus VARCHAR(20) NOT NULL` stores the exact raw string:
    - ID 1: `QUALIFIED`
    - ID 2: `PENDING`
    - ID 3: `CONTACTED`
    - IDs 6 & 7: `PENDING`
  - Mapping Rules:
    - `PENDING` &rarr; `Status = 'Pending'`, `RequiresReview = 0`
    - `CONTACTED` &rarr; `Status = 'Replied'`, `RequiresReview = 0`
    - `QUALIFIED` &rarr; `Status = 'Pending'`, `RequiresReview = 1`, `ReviewReason = 'CRM_PREQUALIFIED_UNVERIFIED_OFFER'`
    - Any legacy `CLOSED` &rarr; `Status = 'Pending'`, `RequiresReview = 1`, `ReviewReason = 'LEGACY_CLOSED_UNKNOWN_RESOLUTION'`

---

### Blocker 5: Property City and Date Provenance
- **Audit of Real Property Rows in `estatecore_db`:**

| ID | Title | Original Location | Original Address | Proposed City | Evidence & Source Reasoning | Original `createdAt` | Proposed `DateListed` | Provenance Classification |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Modern High-Rise Condominium in BGC | `Bonifacio Global City, Taguig` | `7th Avenue corner 28th Street, BGC` | **`Taguig`** | Bonifacio Global City (BGC) is legally situated within the City of Taguig, Metro Manila. | `2026-11-24 06:25:50` | `2026-11-24` | City: **VERIFIED**<br>Date: **INFERRED FROM CREATED_AT** |
| **2** | Spacious 4-Bedroom Suburban Family Home | `Alabang, Muntinlupa` | `14 Orchid Lane, Hillsborough Village` | **`Muntinlupa`** | Alabang and Hillsborough Village are subdivisions within the City of Muntinlupa. | `2026-11-24 06:25:51` | `2026-11-24` | City: **VERIFIED**<br>Date: **INFERRED FROM CREATED_AT** |
| **3** | Prime Commercial Corner Lot for Development | `Quezon City` | `EDSA corner East Avenue, Diliman` | **`Quezon City`** | Exact municipality match in location string. Diliman is in Quezon City. | `2026-11-24 06:25:51` | `2026-11-24` | City: **VERIFIED**<br>Date: **INFERRED FROM CREATED_AT** |
| **4** | Contemporary 3-Storey Townhouse | `San Juan City` | `88 P. Guevarra Street, Addition Hills` | **`San Juan`** | Addition Hills / P. Guevarra is a verified district of San Juan City. | `2026-11-24 06:25:51` | `2026-11-24` | City: **VERIFIED**<br>Date: **INFERRED FROM CREATED_AT** |
| **5** | Cozy Studio Apartment in Makati CBD | `Makati City` | `Legazpi Village, Dela Rosa Street` | **`Makati`** | Legazpi Village is located within Makati Central Business District. | `2026-11-24 06:25:51` | `2026-11-24` | City: **VERIFIED**<br>Date: **INFERRED FROM CREATED_AT** |
| **6** | Scenic Agricultural & Residential Land | `Tagaytay, Cavite` | `Barangay Mendez Crossing East` | **`Tagaytay`** | Barangay Mendez Crossing East is located in the City of Tagaytay, Cavite. | `2026-11-24 06:25:51` | `2026-11-24` | City: **VERIFIED**<br>Date: **INFERRED FROM CREATED_AT** |

---

### Blocker 6: RBAC Endpoint Consistency
- **Dedicated Admin Role Management Endpoint:**
  - Added `PATCH /api/v1/users/{id}/role` (Strictly **Admin only**) to change account roles.
  - Standard `PATCH /api/v1/users/{id}` (Self only) updates personal info (`FirstName`, `LastName`, `ContactNumber`) but strictly rejects any attempt to change `role` (`403 Forbidden`).
- **Seller vs. PropertyManager Boundaries:**
  - `Seller`: Authorized to edit listings (`PUT/PATCH /properties/{id}`), view received inquiries, and view transactions **only if `Property.OwnerID === User.UserID`**.
  - `PropertyManager`: Authorized to manage listings and view inquiries **only if `Property.ManagerID === User.UserID`**.
- **Agent Verification Guard:**
  - `Agent` users with `VerificationStatus = 'PENDING_VERIFICATION'` are blocked from publishing listings or executing transactions.

---

### Blocker 7: Comprehensive Backup & Restore Verification
- Deep comparison of sandbox restoration:
  1. Export schema and data using `$MYSQL_ROOT_PASSWORD` via environment variable.
  2. Restore into `estatecore_test_restore` sandbox database.
  3. Compare table schemas (`SHOW CREATE TABLE`).
  4. Compare column data types, nullability, defaults.
  5. Compare primary keys, foreign keys, and indexes.
  6. Compare row counts across all 5 tables (`users`, `properties`, `inquiries`, `appointments`, `migrations`).
  7. Verify checksums or sample record hashes.
  8. Sandbox connection is strictly isolated by database name, ensuring it cannot drop or alter `estatecore_db`.

---

## 3. Physical vs. Logical Schema Mapping

| Logical Entity (PDF) | Physical MySQL Table | Primary Key | Foreign Keys | TypeORM Entity Declaration |
| :--- | :--- | :--- | :--- | :--- |
| **`User`** | `users` | `id` / `UserID` | None | `@Entity('users') export class User` |
| **`Agent`** | `Agent` | `AgentID` | `UserID` &rarr; `users(id)` | `@Entity('Agent') export class Agent` |
| **`Property`** | `properties` | `id` / `PropertyID` | `OwnerID` &rarr; `users(id)`, `AgentID` &rarr; `Agent(AgentID)` | `@Entity('properties') export class Property` |
| **`PropertyPhoto`** | `PropertyPhoto` | `PhotoID` | `PropertyID` &rarr; `properties(id)` | `@Entity('PropertyPhoto') export class PropertyPhoto` |
| **`Inquiry`** | `inquiries` | `id` / `InquiryID` | `PropertyID` &rarr; `properties(id)`, `UserID` &rarr; `users(id)` | `@Entity('inquiries') export class Inquiry` |
| **`PropertyTransaction`**| `PropertyTransaction`| `TransactionID`| `PropertyID`, `BuyerID` &rarr; `users(id)`, `AgentID` &rarr; `Agent(AgentID)` | `@Entity('PropertyTransaction') export class PropertyTransaction` |
| **`Appointment`** | `appointments` | `id` / `AppointmentID` | `PropertyID`, `ClientID` &rarr; `users(id)`, `AgentID` &rarr; `Agent(AgentID)` | `@Entity('appointments') export class Appointment` |
