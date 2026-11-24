# EstateCore — Database Architecture Audit (Final Consistency Review)
### Comprehensive Architecture Audit, Physical Schema Mapping, and Security Review

**Date of Audit:** November 24, 2026  
**Auditor:** Senior Database Architect & Systems Integration Engineer  
**Reference Document:** `estatecire.pdf` (BSIT 4-C Laboratory Activities 03–06, Cristina O. Cabico)  
**Database Evaluated:** `estatecore_db` (MySQL 8.4 LTS on Docker host port 3307)  
**Status:** Architecture Document Review &mdash; **NO DATABASE CHANGES EXECUTED**

---

## 1. Executive Summary & Purpose

This document provides the final consistency and safety audit of the **EstateCore** database architecture against the academic baseline in `estatecire.pdf`.

The original laboratory requirements establish a **six-entity relational model**:
1. `User` (System identity accounts)
2. `Agent` (Professional licensing profile, 1:1 with `User`)
3. `Property` (Real estate listing, owned by `OwnerID` [User] and represented by `AgentID` [Agent])
4. `PropertyPhoto` (1:M gallery of architectural photographs)
5. `Inquiry` (M:N junction between `User` and `Property`, capturing inquiries and price offers)
6. `PropertyTransaction` (Closed or pending deals linking `Property`, `BuyerID` [User], and `AgentID` [Agent])
*(Plus EstateCore's existing `Appointment` module retained as a supporting feature for tour scheduling).*

---

## 2. Physical Schema Naming vs. Logical Entity Naming

To eliminate any ambiguity between documentation and implementation:

| Layer | Naming Convention | Implementation Standard | Justification |
| :--- | :--- | :--- | :--- |
| **Logical Domain Model (PDF Standard)** | **PascalCase** | `User`, `Agent`, `Property`, `PropertyPhoto`, `Inquiry`, `PropertyTransaction`, `Appointment` | Required by `estatecire.pdf` Lab Activity 04. Used in ERD diagrams, entity domain classes, and academic reports. |
| **Physical MySQL Database Layer** | **Hybrid / Compatibility Mapping** | Existing tables retain lowercase plural (`users`, `properties`, `inquiries`, `appointments`). New tables use PascalCase (`Agent`, `PropertyPhoto`, `PropertyTransaction`). Columns map to PascalCase or explicit DB names. | Avoids destructive table drops or table-renaming locks on live databases while supporting TypeORM entity mapping. |
| **TypeORM ORM Mapping Layer** | **Explicit `@Entity` & `@Column` Mapping** | `@Entity('users') export class User { @Column({ name: 'FirstName' }) firstName: string; }` | Provides 100% adherence to PascalCase domain logic while seamlessly mapping to underlying physical storage. |
| **REST API JSON Contract** | **camelCase** | `userId`, `firstName`, `propertyId`, `inquiryType`, `offerAmount` | Explicitly required by `estatecire.pdf` Lab Activity 05 (Page 1: *"JSON fields are the Lab 04 field names in camelCase"*). |

---

## 3. Critical Architectural Corrections

### A. Agent Onboarding & Authorization (Resolving Contradictions)
- **Problem in Previous Draft:** The endpoint matrix permitted `Agent` role users to call `POST /agents`, creating their own professional credentials. This contradicted the administrative requirement that agents cannot self-certify.
- **Corrected Rule:**
  1. Only **`Admin`** can create, approve, or deactivate `Agent` profiles (`POST /api/v1/agents` is restricted to `Admin` only).
  2. Public registration (`POST /api/v1/users`) cannot create `Agent` or `Admin` accounts.
  3. **Verification Lifecycle:** Every `Agent` record possesses an explicit lifecycle state:
     - `PENDING_VERIFICATION`: Assigned to newly enrolled agent users whose PRC license has not yet been audited.
     - `VERIFIED`: The agent has submitted an authentic PRC license and been approved by an Admin.
     - `REJECTED`: Invalid or unverified credentials.
     - `SUSPENDED`: Temporarily deactivated by an Admin.
  4. **Enforcement:** A user with role `Agent` whose `Agent.VerificationStatus` is `PENDING_VERIFICATION` **cannot** publish listings (`POST /properties`) or record transactions (`POST /transactions`). They remain restricted until an Admin completes license verification.

---

### B. Separation of Seller vs. PropertyManager Roles
- **Problem in Previous Draft:** `Seller` and `PropertyManager` were grouped together under `CLIENT` or `ADMIN` without distinct authorization boundaries.
- **Corrected Rule:**
  1. **`Seller`**: Represents the legal property owner (private individual or company).
     - Authorization: May view or update listing details **only for properties where `Property.OwnerID === User.UserID`**. Cannot modify or access another seller's listings.
  2. **`PropertyManager`**: Represents an appointed institutional manager or management firm.
     - Authorization: May manage listings **only where explicit managerial delegation exists** (via `Property.ManagerID === User.UserID` or verified management contract). They do not automatically possess access to all properties on the platform.
  3. Both roles are distinct from **`Buyer` / `Renter`** (who can only submit inquiries, make offers, and book tours) and **`Admin`** (who holds system-wide administrative oversight).

---

### C. Reconciling Agent License Staging with Final Constraints
- **Problem in Previous Draft:** The data dictionary marked `LicenseNumber` as `NOT NULL`, while the migration plan created records with `NULL` licenses.
- **Corrected Rule:**
  - `LicenseNumber` is defined as **`VARCHAR(30) NULL`** with a conditional unique index:
    - During migration staging, existing agents (User 2: Maria Santos, User 3: Carlos Reyes) are enrolled with `LicenseNumber = NULL` and `VerificationStatus = 'PENDING_VERIFICATION'`.
    - Once the authentic PRC license is verified by an Admin, `LicenseNumber` is updated and `VerificationStatus` transitions to `VERIFIED`.
    - No fake license numbers (e.g. `PRC-REB-002491`) are ever fabricated to satisfy a premature `NOT NULL` constraint.

---

### D. Concurrency-Safe Appointment Scheduling
- **Problem in Previous Draft:** A simple `SELECT COUNT(*)` check inside an application transaction is susceptible to race conditions under default read-committed isolation, allowing simultaneous requests to double-book an agent.
- **Corrected Rule:**
  1. **Pessimistic Row-Locking / Serializable Check:**
     ```sql
     SELECT COUNT(*) FROM appointments 
     WHERE agentId = :agentId 
       AND appointmentDate = :date 
       AND appointmentTime = :time 
       AND status != 'CANCELLED' 
     FOR UPDATE;
     ```
  2. **Database Constraint Enforcement:**
     - Enforce uniqueness on active reservations through a database-backed partial unique constraint or active reservation ledger:
       `UNIQUE INDEX UQ_Agent_Schedule_Active (AgentID, AppointmentDate, AppointmentTime)` (for records where `Status != 'CANCELLED'`).
     - Any concurrent attempt to insert an overlapping booking triggers a MySQL `ER_DUP_ENTRY` error, which the backend safely catches and converts into a `409 Conflict: "The selected agent is already booked for this date and time slot."`

---

### E. Security & Removal of Hardcoded Credentials
- **Problem in Previous Draft:** Shell examples and rollback commands exposed root passwords (`estatecore_root_secure_pass_2026`).
- **Corrected Rule:**
  - All backup, migration, and rollback procedures must source credentials exclusively from environment variables:
    ```bash
    docker exec -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" estatecore-mysql mysqldump ...
    ```
  - Zero plaintext secrets are stored in documentation, scripts, or version control.

---

### F. Inquiry Status & Ambiguous History Preservation
- **Problem in Previous Draft:** Mapping legacy status `QUALIFIED` to `Accepted` assumed contract acceptance for what was only loan pre-qualification.
- **Corrected Rule:**
  1. The legacy status is permanently preserved in `LegacyStatus`.
  2. For unambiguous records:
     - `PENDING` &rarr; `Status = 'Pending'`, `RequiresReview = FALSE`.
     - `CONTACTED` &rarr; `Status = 'Replied'`, `RequiresReview = FALSE`.
  3. For ambiguous records (`QUALIFIED`, `CLOSED`):
     - `QUALIFIED` &rarr; `Status = 'Pending'`, `RequiresReview = TRUE` (flagged for review, with a note: *"Client pre-qualified under legacy CRM"*).
     - `CLOSED` &rarr; `Status = 'Rejected'`, `RequiresReview = TRUE` (flagged for review).
  4. No historical outcome is fabricated or assumed without explicit administrative confirmation.

---

## 4. Summary of Real Data Inspected in `estatecore_db`

- **Users (9 rows):**
  - User 1: `System Administrator` (`admin@estatecore.local`, `ADMIN`)
  - User 2: `Maria Santos` (`maria.santos@estatecore.local`, `AGENT`) &mdash; *Pending License Verification*
  - User 3: `Carlos Reyes` (`carlos.reyes@estatecore.local`, `AGENT`) &mdash; *Pending License Verification*
  - User 4: `Juan Dela Cruz` (`juan.delacruz@client.local`, `CLIENT`) &mdash; *Compound Surname Preserved*
  - User 5: `Elena Roxas` (`elena.roxas@client.local`, `CLIENT`)
  - Users 6–9: Automated test client accounts.
- **Properties (6 rows):**
  - All 6 properties currently have unverified deed ownership (`OwnerID = NULL`, flagged as `UNRESOLVED_OWNERSHIP`).
  - Represented by User 2 (Maria) and User 3 (Carlos). Must be mapped to `Agent.AgentID` by joining `Agent.UserID`.
- **Inquiries (5 rows):**
  - Inquiry 1: `QUALIFIED` &rarr; Preserved with `RequiresReview = TRUE`.
  - Inquiries 2, 6, 7: `PENDING` &rarr; `Pending`.
  - Inquiry 3: `CONTACTED` &rarr; `Replied`.
- **Appointments (4 rows):**
  - 2 active appointments (Dec 5 and Dec 7), 2 cancelled appointments.
  - Retained and mapped to `Agent.AgentID`.
