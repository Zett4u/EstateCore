# EstateCore — Entity-Relationship Diagram (ERD) & Schema Architecture
### Normalized Relational Architecture (Laboratory Activities 03–06 & Enterprise Implementation)

This document provides the definitive visual Entity-Relationship Diagram (ERD) and relational architecture for **EstateCore**, strictly aligned with `estatecire.pdf`.

---

## 1. Visual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o| Agent : "UserID (has profile 1:1)"
    User ||--o{ Property : "OwnerID (owns 1:M)"
    Agent ||--o{ Property : "AgentID (manages 1:M)"
    Property ||--o{ PropertyPhoto : "PropertyID (displays 1:M)"
    User ||--o{ Inquiry : "UserID (submits 1:M)"
    Property ||--o{ Inquiry : "PropertyID (receives 1:M)"
    Property ||--o{ PropertyTransaction : "PropertyID (settled_in 1:M)"
    User ||--o{ PropertyTransaction : "BuyerID (purchases/rents 1:M)"
    Agent ||--o{ PropertyTransaction : "AgentID (closes 1:M)"
    User ||--o{ Appointment : "ClientID (books 1:M)"
    Agent ||--o{ Appointment : "AgentID (conducts 1:M)"
    Property ||--o{ Appointment : "PropertyID (toured_in 1:M)"

    User {
        int UserID PK "Auto Increment"
        string FirstName "VARCHAR(50)"
        string LastName "VARCHAR(50)"
        string Email UK "VARCHAR(100), Unique"
        string ContactNumber "VARCHAR(15)"
        string PasswordHash "VARCHAR(255), bcrypt"
        string Role "VARCHAR(20), Buyer/Renter/Seller/Agent/Admin"
        date DateRegistered "DATE"
        boolean IsActive "TINYINT(1), Default 1"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Agent {
        int AgentID PK "Auto Increment"
        int UserID FK,UK "INT, Unique, 1:1 with User"
        string LicenseNumber UK "VARCHAR(30), PRC License Unique"
        string AgencyName "VARCHAR(100), Nullable"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Property {
        int PropertyID PK "Auto Increment"
        int OwnerID FK "INT -> User.UserID"
        int AgentID FK "INT -> Agent.AgentID"
        string Title "VARCHAR(150)"
        string PropertyType "VARCHAR(30), House/Condo/Lot/Commercial"
        string ListingType "VARCHAR(10), Sale/Rent"
        decimal Price "DECIMAL(12,2), > 0"
        string Address "VARCHAR(200)"
        string City "VARCHAR(50)"
        int Bedrooms "INT, >= 0"
        int Bathrooms "INT, >= 0"
        string Status "VARCHAR(15), Available/Reserved/Sold/Rented"
        date DateListed "DATE"
        text Description "TEXT, Architectural notes"
        decimal FloorArea "DECIMAL(10,2), SqM"
        decimal LotArea "DECIMAL(10,2), SqM"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    PropertyPhoto {
        int PhotoID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID"
        string FilePath "VARCHAR(255)"
        date DateUploaded "DATE"
        timestamp CreatedAt "TIMESTAMP"
    }

    Inquiry {
        int InquiryID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID"
        int UserID FK "INT -> User.UserID"
        string InquiryType "VARCHAR(10), Inquiry/Offer"
        text Message "TEXT"
        decimal OfferAmount "DECIMAL(12,2), Nullable, > 0"
        string Status "VARCHAR(15), Pending/Accepted/Rejected/Replied"
        datetime DateSent "DATETIME"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    PropertyTransaction {
        int TransactionID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID"
        int BuyerID FK "INT -> User.UserID"
        int AgentID FK "INT -> Agent.AgentID"
        decimal Amount "DECIMAL(12,2), > 0"
        string TransactionType "VARCHAR(10), Sale/Rent"
        string PaymentMethod "VARCHAR(20), Cash/BankTransfer/GCash/Card"
        date TransactionDate "DATE"
        string Status "VARCHAR(15), Pending/Completed/Cancelled"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Appointment {
        int AppointmentID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID"
        int ClientID FK "INT -> User.UserID"
        int AgentID FK "INT -> Agent.AgentID"
        date AppointmentDate "DATE"
        string AppointmentTime "VARCHAR(20)"
        string Status "VARCHAR(20), PENDING/CONFIRMED/COMPLETED/CANCELLED"
        text Notes "TEXT, Nullable"
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }
```

---

## 2. Relational Cardinality & Integrity Rules

### 1. `User` &rarr; `Agent` (1:1)
- **Cardinality:** Exactly zero or one `Agent` record per `User`.
- **Enforcement:** `Agent.UserID` is constrained as `UNIQUE` and `NOT NULL` with a foreign key referencing `User.UserID`.
- **Business Rule:** An agent is a registered user with professional licensing credentials (`LicenseNumber`). A user without an agent profile cannot be assigned to manage listings or broker transactions.

### 2. `User` &rarr; `Property` (1:M as Owner)
- **Cardinality:** One `User` can own zero, one, or many properties (`OwnerID`).
- **Enforcement:** `Property.OwnerID` references `User.UserID`.
- **Business Rule:** Property ownership represents the legal deed holder, developer, or landlord (Seller/PropertyManager). The owner is distinct from the broker agent.

### 3. `Agent` &rarr; `Property` (1:M as Listing Broker)
- **Cardinality:** One `Agent` manages zero, one, or many properties (`AgentID`).
- **Enforcement:** `Property.AgentID` references `Agent.AgentID`.
- **Business Rule:** An agent handles customer inquiries, schedules tours, and updates listing metadata.

### 4. `Property` &rarr; `PropertyPhoto` (1:M)
- **Cardinality:** One `Property` has zero, one, or many photos (`PhotoID`).
- **Enforcement:** `PropertyPhoto.PropertyID` references `Property.PropertyID` with `ON DELETE CASCADE`.

### 5. `User` & `Property` &rarr; `Inquiry` (M:N resolved through junction)
- **Cardinality:** A prospective buyer/renter can send inquiries to many properties; a property receives inquiries from many users.
- **Enforcement:** `Inquiry` contains composite foreign keys `PropertyID` &rarr; `Property.PropertyID` and `UserID` &rarr; `User.UserID`.
- **Business Rule:** Supports both questions (`InquiryType = 'Inquiry'`) and price negotiations (`InquiryType = 'Offer'` with `OfferAmount > 0`).

### 6. `PropertyTransaction` Ledger (Multi-Entity Linkage)
- **Cardinality:** Links `Property` (1:M), `BuyerID` [User] (1:M), and `AgentID` [Agent] (1:M).
- **Enforcement:** All three foreign keys are `NOT NULL`.
- **Business Rule:** When a deal is marked `Completed` for a `Sale`, the linked `Property.Status` must atomically transition to `Sold`. For a `Rent`, it transitions to `Rented`.

### 7. Supporting Module: `Appointment` (1:M)
- **Cardinality:** Links prospective client (`ClientID` &rarr; `User.UserID`), property (`PropertyID` &rarr; `Property.PropertyID`), and conducting agent (`AgentID` &rarr; `Agent.AgentID`).
- **Enforcement:** Conflict prevention index prevents double booking of an agent at the same date and time.
