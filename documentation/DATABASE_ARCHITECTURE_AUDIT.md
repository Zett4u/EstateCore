# EstateCore — Database Architecture Audit
### Comparative Analysis: `estatecire.pdf` Requirements vs. Current EstateCore Implementation

**Date of Audit:** November 24, 2026  
**Auditor:** Senior Database Architect & Systems Integration Engineer  
**Reference Document:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03–06, Cristina O. Cabico)  
**Database Evaluated:** `estatecore_db` (MySQL 8.4 LTS on Docker port 3307)

---

## 1. Executive Summary

This audit compares the approved academic laboratory specifications in `estatecire.pdf` against the current running prototype of **EstateCore**.

The reference document requires **six core relational entities** in strict PascalCase:
1. `User` (Account & identity)
2. `Agent` (Licensed real estate professional profile, 1:1 with User)
3. `Property` (Real estate asset, owned by `OwnerID` [User] and managed by `AgentID` [Agent])
4. `PropertyPhoto` (1:M gallery of architectural photographs)
5. `Inquiry` (M:N junction between User and Property, supporting questions and price offers)
6. `PropertyTransaction` (Formal deals linking Property, Buyer, and Agent with payment method)
*(Plus the retention of EstateCore's existing `Appointment` module for property tour scheduling).*

### Current Database Status
The current database contains 4 application tables: `users`, `properties`, `inquiries`, and `appointments`. It completely lacks the `Agent`, `PropertyPhoto`, and `PropertyTransaction` tables; conflates property ownership with agent assignment (`agentId` references `users.id`); uses snake_case/camelCase column names instead of PascalCase; and omits transaction logging, photo tracking, and price offers.

---

## 2. Comprehensive Entity-by-Entity Comparison Audit Table

| Entity / Dimension | PDF Requirement (`estatecire.pdf`) | Current Implementation (`estatecore_db`) | Identified Issue & Discrepancy | Proposed Architectural Remediation | Risk Level | Migration Requirement |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Entity** | Table `User`<br>Attributes: `UserID`, `FirstName`, `LastName`, `Email`, `ContactNumber`, `PasswordHash`, `Role`, `DateRegistered` | Table `users`<br>Attributes: `id`, `fullName`, `email`, `password`, `role` (`ADMIN`,`AGENT`,`CLIENT`), `isActive`, `createdAt`, `updatedAt` | 1. Table and columns are lowercase/camelCase.<br>2. Full name is combined in a single string; `FirstName` & `LastName` not separated.<br>3. `ContactNumber` is missing from user entity.<br>4. Password field is named `password` instead of `PasswordHash`. | Align entity to `User`. Split `fullName` into `FirstName` and `LastName` during migration. Add `ContactNumber` with default fallback. Provide virtual getter/setter or schema aliases to preserve existing auth/frontend API contracts. | Low | Safe alter/mapping migration with data transformation for split names. |
| **Agent Entity** | Table `Agent`<br>Attributes: `AgentID`, `UserID` (UNIQUE, FK &rarr; `User.UserID`), `LicenseNumber` (UNIQUE), `AgencyName` (NULL) | **Non-existent**.<br>Agents are merely `users` with `role = 'AGENT'`. | 1. Missing dedicated 1:1 professional identity table.<br>2. No license number tracking or validation.<br>3. No agency affiliation record.<br>4. Foreign keys in properties directly reference user IDs. | Create `Agent` table. For existing agent accounts (IDs 2 & 3: Maria Santos, Carlos Reyes), generate default unique license numbers (`PRC-REB-002491`, `PRC-REB-003810`) and agency names. | Medium | Create `Agent` table, seed existing agents, update foreign key references. |
| **Property Entity** | Table `Property`<br>Attributes: `PropertyID`, `OwnerID` (FK &rarr; `User.UserID`), `AgentID` (FK &rarr; `Agent.AgentID`), `Title`, `PropertyType`, `ListingType`, `Price`, `Address`, `City`, `Bedrooms`, `Bathrooms`, `Status`, `DateListed` | Table `properties`<br>Attributes: `id`, `title`, `description`, `propertyType`, `listingType`, `price`, `location`, `address`, `bedrooms`, `bathrooms`, `floorArea`, `lotArea`, `status`, `agentId` | 1. Missing `OwnerID` &mdash; assumes listing agent owns property.<br>2. `agentId` links directly to `users` rather than `Agent`.<br>3. `location` used instead of `City`.<br>4. Lacks `DateListed` date field (uses `createdAt`). | Refactor to `Property`. Introduce `OwnerID` (defaulting to system admin or designated property owner). Point `AgentID` to `Agent.AgentID`. Map `location` &rarr; `City`. Retain `description`, `floorArea`, `lotArea` as real-world architectural enhancements. | Medium | Add columns, backfill `OwnerID` and `AgentID`, re-point foreign key constraints. |
| **PropertyPhoto Entity** | Table `PropertyPhoto`<br>Attributes: `PhotoID`, `PropertyID` (FK &rarr; `Property.PropertyID`), `FilePath`, `DateUploaded` | **Non-existent**.<br>Photos are handled via dynamic fallback SVG/CDN URLs generated on client. | 1. No database records of uploaded or associated property images.<br>2. Cannot attach multiple real photos to a listing.<br>3. Cannot query photo gallery via API. | Create `PropertyPhoto` table with `PhotoID`, `PropertyID`, `FilePath`, and `DateUploaded`. Seed initial architectural images for all 6 active listings. | Low | Create table and populate initial image references for active listings. |
| **Inquiry Entity** | Table `Inquiry`<br>Attributes: `InquiryID`, `PropertyID`, `UserID`, `InquiryType` (`Inquiry`/`Offer`), `Message`, `OfferAmount` (Nullable, > 0), `Status` (`Pending`/`Accepted`/`Rejected`/`Replied`), `DateSent` | Table `inquiries`<br>Attributes: `id`, `clientId`, `propertyId`, `assignedAgentId`, `subject`, `message`, `contactNumber`, `status` (`PENDING`,`CONTACTED`,`QUALIFIED`,`CLOSED`) | 1. Lacks `InquiryType` (`Inquiry` vs `Offer`).<br>2. Missing `OfferAmount` for purchase proposals.<br>3. Status enum uses CRM terms (`QUALIFIED`,`CLOSED`) rather than PDF terms (`Pending`,`Accepted`,`Rejected`,`Replied`). | Refactor to `Inquiry`. Add `InquiryType` (default `'Inquiry'`), `OfferAmount` (nullable). Map existing statuses (`PENDING`&rarr;`Pending`, `CONTACTED`&rarr;`Replied`, `QUALIFIED`&rarr;`Accepted`, `CLOSED`&rarr;`Rejected`). | Medium | Alter table columns and migrate enum/status values. |
| **PropertyTransaction Entity** | Table `PropertyTransaction`<br>Attributes: `TransactionID`, `PropertyID`, `BuyerID` (FK &rarr; `User.UserID`), `AgentID` (FK &rarr; `Agent.AgentID`), `Amount`, `TransactionType`, `PaymentMethod`, `TransactionDate`, `Status` | **Non-existent**.<br>Transactions are not tracked or recorded anywhere in the database. | 1. Closed deals cannot be audited.<br>2. Historical sales/rentals are lost.<br>3. Payment method and deal settlement are unrecorded. | Create `PropertyTransaction` table. Implement service, controller, and DTOs with validation (`Amount > 0`, allowed `PaymentMethod`: `Cash`, `BankTransfer`, `GCash`, `Card`). Seed realistic closed and pending transactions. | High (New core module) | Create table, add constraints, create NestJS module & routes. |
| **Supporting: Appointment Entity** | Not in PDF core 6 entities (PDF focuses on listings, inquiries, and transactions). | Table `appointments`<br>Attributes: `id`, `propertyId`, `clientId`, `agentId`, `appointmentDate`, `appointmentTime`, `status`, `notes` | The Appointment module is an existing, working feature of EstateCore. Removing it would break tour scheduling. | **Retain as supporting module.** Update `agentId` to reference `Agent.AgentID` to maintain relational consistency across the modernized schema. | Low | Update foreign key constraint to link with `Agent.AgentID`. |

---

## 3. Relational Cardinality & Normalization Issues in Current System

1. **Denormalization of Agent Credentials:**
   Currently, agent license numbers and agency affiliations have no home. If an agent changes their agency or license, there is no normalized entity to record it. Creating `Agent` in 1:1 relationship with `User` resolves this to 3NF.

2. **False Conflation of Property Owner and Broker/Agent:**
   In real estate, an Agent almost never owns the properties they represent; they represent a Client/Seller/Developer. The current schema forced `properties.agentId` to represent both the listing broker and the owner. Introducing `OwnerID` (referencing `User.UserID`) and `AgentID` (referencing `Agent.AgentID`) cleanly separates property title ownership from broker representation.

3. **Inquiry Resolution of M:N Relationship:**
   The PDF correctly models `Inquiry` as the junction entity resolving the M:N relationship between `User` (prospective buyers/renters) and `Property` (listings). The current table used `clientId` and `assignedAgentId`. Removing `assignedAgentId` from `Inquiry` (since the responsible agent is already determined via `Property.AgentID`) eliminates transitive redundancy (2NF &rarr; 3NF).

4. **Absence of Deal Lifecycle Ledger:**
   Once a property is `SOLD` or `RENTED`, the current system has no record of who bought it, when, for how much, or through which agent. `PropertyTransaction` provides an auditable, immutable ledger.

---

## 4. API Compatibility & Naming Strategy

- **Database Layer:** All tables, columns, and constraints will follow strict **PascalCase** matching the PDF:
  - Tables: `User`, `Agent`, `Property`, `PropertyPhoto`, `Inquiry`, `PropertyTransaction`, `Appointment`.
  - Columns: `UserID`, `FirstName`, `LastName`, `Email`, `PropertyID`, `OwnerID`, `AgentID`, etc.
- **Application & TypeORM Layer:** TypeORM entities will map camelCase properties to PascalCase database columns using column name mappings:
  ```typescript
  @Column({ name: 'FirstName', type: 'varchar', length: 50 })
  firstName: string;
  ```
- **REST API Layer:** 
  - Standard JSON responses will expose camelCase fields (`userId`, `firstName`, `propertyId`) corresponding directly to Laboratory Activity 05 specifications.
  - Endpoints will support both `/api/...` (current frontend) and `/api/v1/...` (PDF specification) via NestJS global versioning or controller routing.

---

## 5. Summary of Recommended Actions

1. Approve the revised ERD in [documentation/ESTATECORE_ERD.md](ESTATECORE_ERD.md).
2. Review the data dictionary in [documentation/DATABASE_DATA_DICTIONARY.md](DATABASE_DATA_DICTIONARY.md).
3. Review the non-destructive migration plan in [documentation/DATABASE_MIGRATION_PLAN.md](DATABASE_MIGRATION_PLAN.md).
4. Review the updated permissions in [documentation/RBAC_PERMISSION_MATRIX.md](RBAC_PERMISSION_MATRIX.md).
5. Await user authorization before executing Phase 3 migrations.
