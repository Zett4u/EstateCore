# EstateCore — Entity-Relationship Diagram (ERD) & Schema Architecture (Final Consistency Version)
### Verified Relational Schema Aligned with `estatecire.pdf` & Real-World Real Estate Domain

This document presents the revised Entity-Relationship Diagram (ERD) and relational architecture for **EstateCore**, strictly preserving the six core entities from Laboratory Activity 04 and maintaining EstateCore's supporting appointment module.

---

## 1. Visual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o| Agent : "UserID (1:1 profile, UserID UNIQUE in Agent)"
    User ||--o{ Property : "OwnerID (1:M, deed holder/seller owns listings, NULL until verified)"
    User ||--o{ Property : "ManagerID (1:M, optional delegated property manager)"
    Agent ||--o{ Property : "AgentID (1:M, licensed broker represents listings)"
    Property ||--o{ PropertyPhoto : "PropertyID (1:M, gallery of photos)"
    User ||--o{ Inquiry : "UserID (1:M, buyer/renter submits inquiries/offers)"
    Property ||--o{ Inquiry : "PropertyID (1:M, property receives inquiries/offers)"
    Property ||--o{ PropertyTransaction : "PropertyID (1:M, deals settled for property over time)"
    User ||--o{ PropertyTransaction : "BuyerID (1:M, buyer/tenant enters deals)"
    Agent ||--o{ PropertyTransaction : "AgentID (1:M, handling broker closes deals)"
    User ||--o{ Appointment : "ClientID (1:M, prospective client books tour)"
    Agent ||--o{ Appointment : "AgentID (1:M, assigned agent conducts tour)"
    Property ||--o{ Appointment : "PropertyID (1:M, property visited on tour)"

    User {
        int UserID PK "Auto Increment (Physical: id)"
        string FirstName "VARCHAR(50), NOT NULL"
        string LastName "VARCHAR(50), NOT NULL"
        string Email UK "VARCHAR(100), UNIQUE, NOT NULL"
        string ContactNumber "VARCHAR(15), NULL in staging"
        string PasswordHash "VARCHAR(255), bcrypt hash"
        string Role "VARCHAR(20), Buyer/Renter/Seller/PropertyManager/Agent/Admin/CLIENT"
        string LegacyRole "VARCHAR(20), Historical role audit"
        date DateRegistered "DATE, NOT NULL"
        boolean IsActive "TINYINT(1), Default 1"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Agent {
        int AgentID PK "Auto Increment"
        int UserID FK,UK "INT, UNIQUE, 1:1 with User"
        string LicenseNumber UK "VARCHAR(30), UNIQUE, NULL in staging"
        string AgencyName "VARCHAR(100), Nullable"
        string VerificationStatus "ENUM: PENDING_VERIFICATION, VERIFIED, REJECTED, SUSPENDED"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Property {
        int PropertyID PK "Auto Increment (Physical: id)"
        int OwnerID FK "INT -> User.UserID, Nullable until verified deed holder"
        int ManagerID FK "INT -> User.UserID, Nullable (Delegated Manager)"
        int AgentID FK "INT -> Agent.AgentID, NOT NULL"
        string Title "VARCHAR(150), NOT NULL"
        string PropertyType "VARCHAR(30), House/Condo/Townhouse/Commercial/Land"
        string ListingType "VARCHAR(10), Sale/Rent"
        decimal Price "DECIMAL(12,2), CHECK Price > 0"
        string Address "VARCHAR(200), NOT NULL"
        string City "VARCHAR(50), NOT NULL"
        int Bedrooms "INT, CHECK Bedrooms >= 0"
        int Bathrooms "INT, CHECK Bathrooms >= 0"
        string Status "VARCHAR(15), Available/Reserved/Sold/Rented"
        date DateListed "DATE, NOT NULL"
        text Description "TEXT, Architectural notes"
        decimal FloorArea "DECIMAL(10,2), SqM"
        decimal LotArea "DECIMAL(10,2), SqM"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    PropertyPhoto {
        int PhotoID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID, ON DELETE CASCADE"
        string FilePath "VARCHAR(255), Storage URI"
        date DateUploaded "DATE, NOT NULL"
        timestamp CreatedAt "TIMESTAMP"
    }

    Inquiry {
        int InquiryID PK "Auto Increment (Physical: id)"
        int PropertyID FK "INT -> Property.PropertyID, ON DELETE CASCADE"
        int UserID FK "INT -> User.UserID, ON DELETE RESTRICT (Physical: clientId)"
        string InquiryType "VARCHAR(10), Inquiry/Offer"
        text Message "TEXT, NOT NULL"
        decimal OfferAmount "DECIMAL(12,2), Nullable, CHECK OfferAmount > 0"
        string Status "VARCHAR(15), Pending/Accepted/Rejected/Replied"
        string LegacyStatus "VARCHAR(20), Historical CRM status"
        boolean RequiresReview "TINYINT(1), Default 0"
        string ReviewReason "VARCHAR(100), Nullable"
        datetime DateSent "DATETIME, NOT NULL"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    PropertyTransaction {
        int TransactionID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID, ON DELETE RESTRICT"
        int BuyerID FK "INT -> User.UserID, ON DELETE RESTRICT"
        int AgentID FK "INT -> Agent.AgentID, ON DELETE RESTRICT"
        decimal Amount "DECIMAL(12,2), CHECK Amount > 0"
        string TransactionType "VARCHAR(10), Sale/Rent"
        string PaymentMethod "VARCHAR(20), Cash/BankTransfer/GCash/Card"
        date TransactionDate "DATE, NOT NULL"
        string Status "VARCHAR(15), Pending/Completed/Cancelled"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Appointment {
        int AppointmentID PK "Auto Increment (Physical: id)"
        int PropertyID FK "INT -> Property.PropertyID, ON DELETE CASCADE"
        int ClientID FK "INT -> User.UserID, ON DELETE RESTRICT (Physical: clientId)"
        int AgentID FK "INT -> Agent.AgentID, ON DELETE RESTRICT"
        date AppointmentDate "DATE, NOT NULL"
        string AppointmentTime "VARCHAR(20), NOT NULL"
        string Status "VARCHAR(20), PENDING/CONFIRMED/COMPLETED/CANCELLED"
        text Notes "TEXT, Nullable"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }
```

---

## 2. Cardinality & Relational Logic

### 1. `User` &harr; `Agent` (Strict 1:1)
- **Cardinality:** Exactly zero or one `Agent` record per `User`.
- **Relational Anchor:** `Agent.UserID` is constrained as both `FOREIGN KEY` referencing `User.UserID` and `UNIQUE`.
- **Domain Meaning:** An agent is an authorized system user who has completed professional onboarding and holds licensing information. A user cannot have multiple agent profiles, and an agent profile cannot exist without a corresponding user account.
- **Verification Lifecycle:** `Agent.VerificationStatus` (`PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `SUSPENDED`).

### 2. `User` &rarr; `Property` (1:M as Legal Owner) and `ManagerID` (1:M as Delegated Manager)
- **Cardinality:** One `User` can own zero, one, or many properties (`OwnerID`).
- **Owner vs Manager Distinction:**
  - `OwnerID`: Legal asset owner (`Seller`). Only the seller matching `OwnerID === User.UserID` can view and manage their listing.
  - `ManagerID`: Delegated property manager (`PropertyManager`). May manage only properties explicitly assigned to them (`ManagerID === User.UserID`).
- **Ownership Staging Rule:** `OwnerID` is maintained as `INT NULL` (nullable) until verified seller accounts are attached. The schema will **not** enforce `NOT NULL` on `OwnerID` until 100% of properties have verified legal owners.

### 3. `Agent` &rarr; `Property` (1:M as Listing Representative)
- **Cardinality:** One `Agent` represents zero, one, or many properties (`AgentID`).
- **Relational Anchor:** `Property.AgentID` references `Agent.AgentID` (resolved via `Agent.UserID` join).

### 4. `Property` &rarr; `PropertyPhoto` (1:M Gallery)
- **Cardinality:** One `Property` has zero, one, or many photos (`PhotoID`).
- **Referential Integrity:** `ON DELETE CASCADE` removes photo metadata when a property record is removed. Storage cleanup service deletes physical file assets.

### 5. `User` & `Property` &rarr; `Inquiry` (M:N Resolved via Junction)
- **Cardinality:** A prospective buyer or renter can inquire about multiple properties; a property can receive inquiries from multiple users.
- **Audit Preservation:** `LegacyStatus` permanently retains original CRM state; `RequiresReview` flags ambiguous records for human qualification.

### 6. `PropertyTransaction` (Multi-Entity Deal Ledger & Recurrence)
- **Cardinality:** A property can have **multiple transactions over time** (`1:M`).
- **Domain Meaning:** Rentals recur over time as successive lease terms expire. Completed transactions become immutable financial records.

### 7. `Appointment` (Tour Coordination & Concurrency-Safe Locking)
- **Cardinality:** Links `ClientID` (`User`), `AgentID` (`Agent`), and `PropertyID` (`Property`).
- **Concurrency-Safe Conflict Prevention:**
  MySQL 8.4 does not support partial unique indexes with `WHERE` clauses. Concurrency safety is achieved by acquiring an **exclusive row lock on the target Agent record** (`SELECT AgentID FROM Agent WHERE AgentID = :agentId FOR UPDATE`) inside an explicit transaction, evaluating active schedule collisions, and inserting the appointment before releasing the lock.
