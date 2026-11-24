# EstateCore — Database Architecture Audit (Revised)
### Critical Comparative Audit: `estatecire.pdf` Requirements vs. Current EstateCore Implementation

**Date of Audit:** November 24, 2026  
**Auditor:** Senior Database Architect & Systems Integration Engineer  
**Reference Document:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03, 04, 05, and 06 by Cristina O. Cabico)  
**Database Evaluated:** `estatecore_db` (MySQL 8.4 LTS on Docker host port 3307)  
**Status:** Audit & Architecture Review &mdash; **NO DATABASE CHANGES EXECUTED**

---

## 1. Executive Summary & Purpose

This audit re-evaluates the running prototype of **EstateCore** against the academic specifications in `estatecire.pdf`.

The original laboratory requirements establish a **six-entity relational model** using **PascalCase** naming:
1. `User` (System identity accounts)
2. `Agent` (Professional real estate licensing profile, 1:1 with `User`)
3. `Property` (Real estate listing, owned by `OwnerID` [User] and represented by `AgentID` [Agent])
4. `PropertyPhoto` (1:M gallery of architectural photographs)
5. `Inquiry` (M:N junction between `User` and `Property`, capturing inquiries and price offers)
6. `PropertyTransaction` (Closed or pending deals linking `Property`, `BuyerID` [User], and `AgentID` [Agent])
*(Plus EstateCore's existing `Appointment` module retained as a supporting feature for tour scheduling).*

### Current Database State in `estatecore_db`
An inspection of the active MySQL database revealed:
- **Existing Tables:** `users` (9 rows), `properties` (6 rows), `inquiries` (5 rows), `appointments` (4 rows), `migrations` (1 row).
- **Missing Tables:** `Agent`, `PropertyPhoto`, and `PropertyTransaction` do not exist.
- **Relational Conflation:** Property ownership is conflated with agent assignment (`properties.agentId` directly references `users.id`).
- **Naming Discrepancies:** Existing tables and fields use lowercase and camelCase (`fullName`, `propertyType`, `agentId`) rather than the PDF's PascalCase standard.
- **Data Gaps:** Existing agent accounts lack professional license numbers; property listings lack deed owner attribution; user records lack separate first/last names and contact numbers.

---

## 2. Distinction of Specifications: Academic PDF vs. Real-World Engineering

To ensure academic fidelity while maintaining enterprise software standards, the architectural elements are categorized into three distinct classes:

| Class | Definition | Examples in EstateCore |
| :--- | :--- | :--- |
| **PDF Core Requirements** | Explicitly defined in `estatecire.pdf` Labs 03–06. Must be preserved without alteration. | Six core entities (`User`, `Agent`, `Property`, `PropertyPhoto`, `Inquiry`, `PropertyTransaction`), PascalCase naming, 1:1 User-Agent relationship, Owner vs Agent separation, 1:M photos, InquiryType/OfferAmount, Transaction payment methods and roles. |
| **Supporting Modules** | Existing functionality in EstateCore not in the PDF core, but required by the project. | `Appointment` (Tour booking engine with status tracking). Retained and adapted to link to `Agent.AgentID`. |
| **Engineering Enhancements** | Technical improvements for production stability, security, and data integrity. | Soft deletion (`IsActive`), audit timestamps (`CreatedAt`, `UpdatedAt`), property floor/lot area, transaction-safe scheduling conflict guards, TypeORM column mappings preserving REST API backward compatibility. |

---

## 3. Entity-by-Entity Comparative Audit

### A. User Entity
- **PDF Requirement (Lab 04, p. 1 & 3):**  
  Table `User`, PK `UserID` (`INT`, auto-increment), `FirstName` (`VARCHAR(50)`), `LastName` (`VARCHAR(50)`), `Email` (`VARCHAR(100)`, unique), `ContactNumber` (`VARCHAR(15)`), `PasswordHash` (`VARCHAR(255)`), `Role` (`VARCHAR(20)`, check constraint for `Buyer`, `Renter`, `Seller`, `PropertyManager`, `Agent`, `Admin`), `DateRegistered` (`DATE`).
- **Current Database Implementation:**  
  Table `users`, PK `id`, `fullName` (`VARCHAR(150)`), `email` (`VARCHAR(150)`, unique), `password` (`VARCHAR(255)`), `role` (`ENUM('ADMIN','AGENT','CLIENT')`), `isActive` (`TINYINT`), `createdAt` (`TIMESTAMP`), `updatedAt` (`TIMESTAMP`).
- **Identified Issues & Real Data Inspection:**  
  1. Names are stored as single composite strings (`fullName`). Inspection of actual rows:
     - User 1: `System Administrator` &rarr; Compound title.
     - User 2: `Maria Santos` &rarr; Standard 2-word name.
     - User 3: `Carlos Reyes` &rarr; Standard 2-word name.
     - User 4: `Juan Dela Cruz` &rarr; **Compound surname** (`Dela Cruz`). A naive `SUBSTRING_INDEX` at first space would corrupt this into FirstName: `Juan`, LastName: `Dela`!
     - User 5: `Elena Roxas` &rarr; Standard 2-word name.
  2. `ContactNumber` is missing completely from the database.
  3. `PasswordHash` is currently named `password`.
  4. Roles in `users` are restricted to `ADMIN`, `AGENT`, `CLIENT`.
- **Required Architectural Remediation:**  
  - Create PascalCase mapping for `User`.
  - Migrate names using an explicit record-aware mapping (preserving `Dela Cruz` as surname).
  - Add `ContactNumber` as **`NULL` allowed initially** during migration staging. Never inject a fake default phone number (e.g. `09171234567`). Real phone numbers must be collected or verified before applying `NOT NULL`.
  - Preserve existing bcrypt password hashes exactly as-is without rehashing.

---

### B. Agent Entity
- **PDF Requirement (Lab 04, p. 1 & 3):**  
  Table `Agent`, PK `AgentID` (`INT`, auto-increment), `UserID` (`INT`, unique foreign key referencing `User.UserID`), `LicenseNumber` (`VARCHAR(30)`, unique), `AgencyName` (`VARCHAR(100)`, nullable).
- **Current Database Implementation:**  
  **Table does not exist.** The system identifies agents solely by checking `users.role = 'AGENT'`.
- **Identified Issues & Unresolved Data:**  
  1. Existing agents (User ID 2: Maria Santos; User ID 3: Carlos Reyes) have **no professional license numbers** stored in the database.
  2. In the previous draft, fabricated license numbers (`PRC-REB-002491`, `PRC-REB-003810`) were proposed. **This has been completely eliminated.** Inventing professional credentials violates engineering ethics and academic integrity.
  3. Existing properties and appointments store `agentId` as `users.id` (2 and 3). When `Agent` is created with auto-increment `AgentID`, the generated IDs will be 1 and 2. **`UserID` does NOT equal `AgentID`.**
- **Required Architectural Remediation:**  
  - Create table `Agent` with `LicenseNumber` declared as `VARCHAR(30) NULL` during migration staging, or marked as `PENDING_VERIFICATION` in staging.
  - Foreign key updates on dependent tables (`Property`, `Appointment`, `PropertyTransaction`) must resolve the new `AgentID` by joining `Agent.UserID = old_agent_user_id`:
    $$\text{Target AgentID} = \text{Agent}(\text{UserID} = \text{Legacy agentId}).\text{AgentID}$$
  - Never execute an unverified numerical assignment.

---

### C. Property Entity
- **PDF Requirement (Lab 04, p. 1 & 4):**  
  Table `Property`, PK `PropertyID`, `OwnerID` (`INT`, FK &rarr; `User.UserID`), `AgentID` (`INT`, FK &rarr; `Agent.AgentID`), `Title` (`VARCHAR(150)`), `PropertyType` (`VARCHAR(30)`), `ListingType` (`VARCHAR(10)`, check `Sale`/`Rent`), `Price` (`DECIMAL(12,2)`, check `Price > 0`), `Address` (`VARCHAR(200)`), `City` (`VARCHAR(50)`), `Bedrooms` (`INT >= 0`), `Bathrooms` (`INT >= 0`), `Status` (`VARCHAR(15)`, check `Available`/`Reserved`/`Sold`/`Rented`), `DateListed` (`DATE`).
- **Current Database Implementation:**  
  Table `properties`, PK `id`, `title`, `description`, `propertyType`, `listingType`, `price`, `location` (`VARCHAR(150)`), `address` (`VARCHAR(255)`), `bedrooms`, `bathrooms`, `floorArea`, `lotArea`, `status`, `agentId` (references `users.id`).
- **Identified Issues & Unresolved Data:**  
  1. **Missing `OwnerID`:** The current database does not store who owns the 6 properties. In the previous draft, assigning `OwnerID = 1` (Admin) was proposed. **This was rejected.** Admin is the system administrator, not the deed holder of suburban homes or condominiums.
  2. **City vs Location Inspection:** Actual inspection of `properties.location`:
     - ID 1: `Bonifacio Global City, Taguig` &rarr; City is `Taguig`.
     - ID 2: `Alabang, Muntinlupa` &rarr; City is `Muntinlupa`.
     - ID 3: `Quezon City` &rarr; City is `Quezon City`.
     - ID 4: `San Juan City` &rarr; City is `San Juan City`.
     - ID 5: `Makati City` &rarr; City is `Makati City`.
     - ID 6: `Tagaytay, Cavite` &rarr; City is `Tagaytay`.
     `location` contains neighborhood/district qualifiers. Simply copying `location` directly into `City` violates domain accuracy.
  3. **Agent Reference:** `properties.agentId` references `users.id` (User 2 or 3), not `Agent.AgentID`.
- **Required Architectural Remediation:**  
  - Add `OwnerID` as `INT NULL` during staging. Flag existing 6 listings as `UNRESOLVED_OWNERSHIP` for administrator reconciliation. Do not make `OwnerID` `NOT NULL` until real seller identities are attached.
  - Parse `City` accurately from `location` (e.g. `Taguig`, `Muntinlupa`, `Quezon City`, `San Juan City`, `Makati City`, `Tagaytay`).
  - Map `AgentID` using verified joins through `Agent.UserID`.
  - Retain `Description`, `FloorArea`, and `LotArea` as valuable architectural features.

---

### D. PropertyPhoto Entity
- **PDF Requirement (Lab 04, p. 1 & 4):**  
  Table `PropertyPhoto`, PK `PhotoID`, `PropertyID` (`INT`, FK &rarr; `Property.PropertyID`), `FilePath` (`VARCHAR(255)`), `DateUploaded` (`DATE`).
- **Current Database Implementation:**  
  **Table does not exist.** The frontend generates dynamic CDN placeholders.
- **Identified Issues:**  
  - The previous migration draft inserted random Unsplash URLs as "database records". This fabricated historical records.
- **Required Architectural Remediation:**  
  - Create `PropertyPhoto` table with `ON DELETE CASCADE`.
  - Start with an empty, authentic table. Do not insert fake photos into the database. Provide authentic photo upload via `POST /api/v1/properties/{id}/photos`.
  - Document physical storage cleanup hooks to delete files when database photo records are removed.

---

### E. Inquiry Entity
- **PDF Requirement (Lab 04, p. 1 & 4):**  
  Table `Inquiry`, PK `InquiryID`, `PropertyID` (`INT`, FK &rarr; `Property`), `UserID` (`INT`, FK &rarr; `User`), `InquiryType` (`VARCHAR(10)`, check `Inquiry`/`Offer`), `Message` (`TEXT`), `OfferAmount` (`DECIMAL(12,2)` nullable, check `OfferAmount > 0`), `Status` (`VARCHAR(15)`, check `Pending`/`Accepted`/`Rejected`/`Replied`), `DateSent` (`DATETIME`).
- **Current Database Implementation:**  
  Table `inquiries`, PK `id`, `clientId`, `propertyId`, `assignedAgentId`, `subject`, `message`, `contactNumber`, `status` (`ENUM('PENDING','CONTACTED','QUALIFIED','CLOSED')`).
- **Identified Issues & Status Inspection:**  
  Inspection of current 5 inquiry rows:
  - Row 1: Status `QUALIFIED`, Subject `"Request for BGC Condo Viewing & Payment Terms"`.
  - Row 2: Status `PENDING`, Subject `"Lease Terms and Parking Allocation"`.
  - Row 3: Status `CONTACTED`, Subject `"Alabang House Title Status Verification"`.
  - Rows 6 & 7: Status `PENDING`, Subject `"Client Juan Private Inquiry"`.
  In the previous draft, `QUALIFIED` was mapped to `Accepted` and `CLOSED` to `Rejected`. In real estate CRM, "Qualified" means the client has financing approval, not that a price offer was legally accepted!
- **Required Architectural Remediation:**  
  - Add `InquiryType` (`Inquiry` default).
  - Add `OfferAmount` (nullable, strictly validated `OfferAmount > 0` when `InquiryType = 'Offer'`).
  - Preserve original status in a migration audit column (`LegacyStatus`). For standard records: `PENDING` maps to `Pending`, `CONTACTED` maps to `Replied`. `QUALIFIED` records must be reviewed or mapped to `Replied` with qualification notes, rather than assuming contract acceptance.

---

### F. PropertyTransaction Entity
- **PDF Requirement (Lab 04, p. 1 & 4; Lab 05, p. 2 & 9):**  
  Table `PropertyTransaction`, PK `TransactionID`, `PropertyID` (`INT`, FK &rarr; `Property`), `BuyerID` (`INT`, FK &rarr; `User`), `AgentID` (`INT`, FK &rarr; `Agent`), `Amount` (`DECIMAL(12,2)`, check `Amount > 0`), `TransactionType` (`VARCHAR(10)`, check `Sale`/`Rent`), `PaymentMethod` (`VARCHAR(20)`, check `Cash`/`BankTransfer`/`GCash`/`Card`), `TransactionDate` (`DATE`), `Status` (`VARCHAR(15)`, check `Pending`/`Completed`/`Cancelled`).
- **Current Database Implementation:**  
  **Table does not exist.** No sales or leases are tracked in MySQL.
- **Identified Issues & Business Rules:**  
  1. The previous draft inserted a fake transaction (Client 4 buying Property 1). **This has been eliminated.** No fake transactions will be seeded.
  2. **Rental Deal Recurrence:** A property can be rented repeatedly over time. The schema must **not** restrict a property to only 1 lifetime transaction.
  3. **Immutability vs Status Transition:** In a real-world financial system, completed transactions must be immutable, but a deal begins as `Pending` and transitions to `Completed` or `Cancelled`. Once `Completed`, the deal amount, buyer, agent, and property cannot be edited.
- **Required Architectural Remediation:**  
  - Create table `PropertyTransaction` matching PDF specifications.
  - Leave table empty until authentic transactions are executed via `POST /api/v1/transactions`.
  - Implement business logic: when a `Sale` reaches `Completed`, set `Property.Status = 'Sold'`. When a `Rent` reaches `Completed`, set `Property.Status = 'Rented'`. Support repeated rentals by allowing new transactions when status returns to `Available`.

---

### G. Supporting Module: Appointment Entity
- **Status:** Retained as a supporting module in EstateCore.
- **Identified Issues:**  
  1. Currently references `users.id` as `agentId`. Must be re-pointed to `Agent.AgentID` via verified `Agent.UserID` join.
  2. **Scheduling Conflict Prevention:** A standard MySQL composite index on `(AppointmentDate, AppointmentTime)` does not prevent an agent from being double-booked across two different properties.
- **Required Architectural Remediation:**  
  - Implement transactional conflict checks:
    $$\text{SELECT COUNT(*)} \text{ WHERE AgentID} = :agentId \text{ AND AppointmentDate} = :date \text{ AND AppointmentTime} = :time \text{ AND Status} \neq \text{'CANCELLED'}$$
  - Reject booking with `409 Conflict` if count > 0.
