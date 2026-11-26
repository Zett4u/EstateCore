# EstateCore — Database Data Dictionary (Final Consistency Version)
### Complete Technical Schema Specifications (Laboratory Activity 04 & Enterprise Implementation)

**Database Management System:** MySQL 8.4 LTS  
**Storage Engine:** InnoDB  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Naming Standard:** Strict PascalCase for logical entity definitions; physical mappings clearly documented.

---

## Physical vs. Logical Mapping Overview

| Logical Entity (PDF) | Physical MySQL Table | Primary Key | Foreign Keys | TypeORM Entity Declaration |
| :--- | :--- | :--- | :--- | :--- |
| **`User`** | `users` | `id` / `UserID` | None | `@Entity('users') export class User` |
| **`Agent`** | `Agent` | `AgentID` | `UserID` &rarr; `users(id)` | `@Entity('Agent') export class Agent` |
| **`Property`** | `properties` | `id` / `PropertyID` | `OwnerID` &rarr; `users(id)`, `AgentID` &rarr; `Agent(AgentID)` | `@Entity('properties') export class Property` |
| **`PropertyPhoto`** | `PropertyPhoto` | `PhotoID` | `PropertyID` &rarr; `properties(id)` | `@Entity('PropertyPhoto') export class PropertyPhoto` |
| **`Inquiry`** | `inquiries` | `id` / `InquiryID` | `PropertyID` &rarr; `properties(id)`, `UserID` &rarr; `users(id)` | `@Entity('inquiries') export class Inquiry` |
| **`PropertyTransaction`**| `PropertyTransaction`| `TransactionID`| `PropertyID`, `BuyerID` &rarr; `users(id)`, `AgentID` &rarr; `Agent(AgentID)` | `@Entity('PropertyTransaction') export class PropertyTransaction` |
| **`Appointment`** | `appointments` | `id` / `AppointmentID` | `PropertyID`, `ClientID` &rarr; `users(id)`, `AgentID` &rarr; `Agent(AgentID)` | `@Entity('appointments') export class Appointment` |

---

## 1. Table: `User` (Physical Table: `users`)
Stores system accounts for all participants: buyers, renters, sellers, property managers, licensed agents, and administrators.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `UserID` (`id`) | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique identity identifier across the entire platform |
| `FirstName` | `VARCHAR` | 50 | **NO** | **NO** | Length: 1–50 | First / given name of the account holder |
| `LastName` | `VARCHAR` | 50 | **NO** | **NO** | Length: 1–50 | Last / family surname (supports compound surnames e.g. "Dela Cruz") |
| `Email` | `VARCHAR` | 100 | **NO** | **NO** | `UNIQUE`, Email format | Login identifier and notification email address |
| `ContactNumber`| `VARCHAR` | 15 | **YES** | **YES** | Length: 7–15 | Phone number. **Nullable** until collected from users; no fake phone numbers are injected. |
| `PasswordHash` | `VARCHAR` | 255 | **NO** | **NO** | bcrypt 10-round salted | Secure one-way hashed password; never exposed in API responses |
| `Role` | `VARCHAR` | 20 | **NO** | **NO** | `CHECK (Role IN ('Buyer','Renter','Seller','PropertyManager','Agent','Admin','CLIENT'))` | Application authorization role (retains legacy `CLIENT` during transition) |
| `LegacyRole` | `VARCHAR` | 20 | **YES** | **YES** | Historical role audit | Preserves original role string (`ADMIN`, `AGENT`, `CLIENT`) |
| `DateRegistered`| `DATE` | - | **NO** | **NO** | Default current date | Calendar date of account registration |
| `IsActive` | `TINYINT` | 1 | **NO** | **NO** | Default `1` | Soft-state account flag (`1` = Active, `0` = Deactivated) |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Audit modification timestamp |

---

## 2. Table: `Agent` (Physical Table: `Agent`)
Stores professional credentials and licensing records for real estate agents in 1:1 relationship with `User`.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `AgentID` | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique agent record identifier |
| `UserID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `users(id)`, `UNIQUE` | 1:1 link to User. User must hold `Agent` role |
| `LicenseNumber`| `VARCHAR` | 30 | **YES** | **YES** | `UNIQUE` when non-null | PRC license number. **Nullable** while in `PENDING_VERIFICATION`. Mandatory only when status is `VERIFIED`. |
| `AgencyName` | `VARCHAR` | 100 | **YES** | **YES** | Length: 1–100 | Brokerage, realty firm, or agency affiliation |
| `VerificationStatus`| `ENUM` | - | **NO** | **NO** | `'PENDING_VERIFICATION'`, `'VERIFIED'`, `'REJECTED'`, `'SUSPENDED'` | Administrative license verification state. Default: `'PENDING_VERIFICATION'`. |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Audit modification timestamp |

---

## 3. Table: `Property` (Physical Table: `properties`)
Represents real estate inventory cataloged for sale or lease.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `PropertyID` (`id`) | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique property listing identifier |
| `OwnerID` | `INT` | 11 | **YES** | **YES** | `FOREIGN KEY` &rarr; `users(id)` | Seller who legally owns the asset. **Nullable** until verified deed holders are reconciled. Will NOT become `NOT NULL` without explicit verification. |
| `ManagerID` | `INT` | 11 | **YES** | **YES** | `FOREIGN KEY` &rarr; `users(id)` | Delegated property manager (optional). Allowed only for users holding `PropertyManager` role. |
| `AgentID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Licensed agent representing the listing. Resolved via `Agent.UserID` join. |
| `Title` | `VARCHAR` | 150 | **NO** | **NO** | Length: 5–150 | Headline title of listing |
| `PropertyType` | `VARCHAR` | 30 | **NO** | **NO** | `House`, `Condo`, `Townhouse`, `Apartment`, `Commercial`, `Land` | Architectural property classification |
| `ListingType` | `VARCHAR` | 10 | **NO** | **NO** | `CHECK (ListingType IN ('Sale', 'Rent'))` | Commercial offering type |
| `Price` | `DECIMAL` | 12,2 | **NO** | **NO** | `CHECK (Price > 0)` | Selling price or monthly rental rate in PHP |
| `Address` | `VARCHAR` | 200 | **NO** | **NO** | Length: 5–200 | Street address and unit/building details |
| `City` | `VARCHAR` | 50 | **NO** | **NO** | Length: 2–50 | Validated municipality/city (parsed from verified location data) |
| `Bedrooms` | `INT` | 11 | **NO** | **NO** | `CHECK (Bedrooms >= 0)` | Number of bedrooms (`0` for studio or commercial) |
| `Bathrooms` | `INT` | 11 | **NO** | **NO** | `CHECK (Bathrooms >= 0)` | Number of bathrooms (`0` for vacant land) |
| `Status` | `VARCHAR` | 15 | **NO** | **NO** | `CHECK (Status IN ('Available', 'Reserved', 'Sold', 'Rented'))` | Current lifecycle state |
| `DateListed` | `DATE` | - | **NO** | **NO** | Default current date | Calendar date listing was published |
| `Description` | `TEXT` | - | **NO** | **NO** | Detailed architectural copy | Rich property overview, finishes, and amenities |
| `FloorArea` | `DECIMAL` | 10,2 | **NO** | **NO** | In square meters | Usable interior floor area |
| `LotArea` | `DECIMAL` | 10,2 | **NO** | **NO** | In square meters | Total land/lot area |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Record modification timestamp |

---

## 4. Table: `PropertyPhoto` (Physical Table: `PropertyPhoto`)

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `PhotoID` | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique photograph identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `properties(id)` | Property shown in the photo |
| `FilePath` | `VARCHAR` | 255 | **NO** | Length: 5–255 | Relative file storage path or CDN URI |
| `DateUploaded`| `DATE` | - | **NO** | Default current date | Calendar date photo was uploaded |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |

---

## 5. Table: `Inquiry` (Physical Table: `inquiries`)

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `InquiryID` (`id`) | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique inquiry identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `properties(id)` | Property inquired about |
| `UserID` (`clientId`) | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `users(id)` | Prospective buyer or renter sender |
| `InquiryType` | `VARCHAR` | 10 | **NO** | `CHECK (InquiryType IN ('Inquiry', 'Offer'))` | Message classification. Default: `'Inquiry'`. |
| `Message` | `TEXT` | - | **NO** | Length: 5–2000 | Inquirer's message or proposal details |
| `OfferAmount` | `DECIMAL` | 12,2 | **YES** | `CHECK (OfferAmount IS NULL OR OfferAmount > 0)` | Proposed financial offer; required only when `InquiryType = 'Offer'` |
| `Status` | `VARCHAR` | 15 | **NO** | `CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Replied'))` | Current lifecycle state of inquiry |
| `LegacyStatus` | `VARCHAR` | 20 | **YES** | Permanent audit string | Preserves raw legacy status (`QUALIFIED`, `CONTACTED`, etc.) |
| `RequiresReview`| `TINYINT` | 1 | **NO** | Default `0` | Flag for ambiguous historical records needing agent review |
| `ReviewReason` | `VARCHAR` | 100 | **YES** | Explanation of review requirement | e.g. `'CRM_PREQUALIFIED_UNVERIFIED_OFFER'` |
| `DateSent` | `DATETIME` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Date and time inquiry was submitted |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

---

## 6. Table: `PropertyTransaction` (Physical Table: `PropertyTransaction`)

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `TransactionID`| `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique transaction deal identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `properties(id)` | Property involved in deal |
| `BuyerID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `users(id)` | Buyer or tenant party entering deal |
| `AgentID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Closing broker handling transaction |
| `Amount` | `DECIMAL` | 12,2 | **NO** | `CHECK (Amount > 0)` | Final transacted monetary amount in PHP |
| `TransactionType`| `VARCHAR`| 10 | **NO** | `CHECK (TransactionType IN ('Sale', 'Rent'))` | Deal classification |
| `PaymentMethod`| `VARCHAR` | 20 | **NO** | `CHECK (PaymentMethod IN ('Cash', 'BankTransfer', 'GCash', 'Card'))` | Payment settlement instrument |
| `TransactionDate`| `DATE` | - | **NO** | Default current date | Calendar date deal occurred |
| `Status` | `VARCHAR` | 15 | **NO** | `CHECK (Status IN ('Pending', 'Completed', 'Cancelled'))` | Transaction settlement state |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Immutable creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

---

## 7. Supporting Table: `Appointment` (Physical Table: `appointments`)

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `AppointmentID` (`id`) | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique viewing tour identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `properties(id)` | Property scheduled for viewing |
| `ClientID` (`clientId`) | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `users(id)` | Prospective client attending tour |
| `AgentID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Conducting agent (resolved via `Agent.UserID`) |
| `AppointmentDate`| `DATE` | - | **NO** | Valid calendar date | Date of physical visit |
| `AppointmentTime`| `VARCHAR`| 20 | **NO** | Valid time format (e.g. `10:00`, `14:30`) | Scheduled time of tour |
| `Status` | `VARCHAR` | 20 | **NO** | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | Tour workflow state |
| `Notes` | `TEXT` | - | **YES** | Special instructions | Gate pass or client remarks |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

**Concurrency Locking Specification:**
To ensure zero double-booking in MySQL 8.4:
1. `START TRANSACTION;`
2. `SELECT AgentID FROM Agent WHERE AgentID = :agentId FOR UPDATE;` (Locks Agent record exclusively)
3. Conflict check for interval overlap: `SELECT id FROM appointments WHERE agentId = :agentId AND appointmentDate = :date AND appointmentTime = :time AND status IN ('PENDING', 'CONFIRMED');`
4. If exists &rarr; `ROLLBACK` and throw `409 Conflict`. Otherwise &rarr; `INSERT` and `COMMIT`.
