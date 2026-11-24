# EstateCore — Entity-Relationship Diagram (ERD) & Relational Architecture (Revised)
### Verified Relational Schema Aligned with `estatecire.pdf` & Real-World Real Estate Domain

This document presents the revised Entity-Relationship Diagram (ERD) and relational architecture for **EstateCore**, strictly preserving the six core entities from Laboratory Activity 04 and maintaining EstateCore's supporting appointment module.

---

## 1. Visual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    User ||--o| Agent : "UserID (1:1 profile, UserID UNIQUE in Agent)"
    User ||--o{ Property : "OwnerID (1:M, deed holder/seller owns listings)"
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
        int UserID PK "Auto Increment"
        string FirstName "VARCHAR(50), NOT NULL"
        string LastName "VARCHAR(50), NOT NULL"
        string Email UK "VARCHAR(100), UNIQUE, NOT NULL"
        string ContactNumber "VARCHAR(15), NULL in staging"
        string PasswordHash "VARCHAR(255), bcrypt hash"
        string Role "VARCHAR(20), Buyer/Renter/Seller/PropertyManager/Agent/Admin"
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
        timestamp CreatedAt "TIMESTAMP"
        timestamp UpdatedAt "TIMESTAMP"
    }

    Property {
        int PropertyID PK "Auto Increment"
        int OwnerID FK "INT -> User.UserID, NULL in staging"
        int AgentID FK "INT -> Agent.AgentID, NOT NULL"
        string Title "VARCHAR(150), NOT NULL"
        string PropertyType "VARCHAR(30), House/Condo/Townhouse/Apartment/Commercial/Land"
        string ListingType "VARCHAR(10), Sale/Rent"
        decimal Price "DECIMAL(12,2), CHECK Price > 0"
        string Address "VARCHAR(200), NOT NULL"
        string City "VARCHAR(50), NOT NULL"
        int Bedrooms "INT, CHECK Bedrooms >= 0"
        int Bathrooms "INT, CHECK Bathrooms >= 0"
        string Status "VARCHAR(15), Available/Reserved/Sold/Rented"
        date DateListed "DATE, NOT NULL"
        text Description "TEXT, Architectural details"
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
        int InquiryID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID, ON DELETE CASCADE"
        int UserID FK "INT -> User.UserID, ON DELETE RESTRICT"
        string InquiryType "VARCHAR(10), Inquiry/Offer"
        text Message "TEXT, NOT NULL"
        decimal OfferAmount "DECIMAL(12,2), Nullable, CHECK OfferAmount > 0"
        string Status "VARCHAR(15), Pending/Accepted/Rejected/Replied"
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
        int AppointmentID PK "Auto Increment"
        int PropertyID FK "INT -> Property.PropertyID, ON DELETE CASCADE"
        int ClientID FK "INT -> User.UserID, ON DELETE RESTRICT"
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

### 2. `User` &rarr; `Property` (1:M as Legal Owner)
- **Cardinality:** One `User` can own zero, one, or many properties (`OwnerID`).
- **Domain Meaning:** `OwnerID` represents the legal deed holder, developer, or landlord (PDF role: `Seller` or `PropertyManager`).
- **Separation of Concerns:** The owner is distinct from the broker agent. An agent does not own the property they market, and an owner does not need agent licensing credentials to list their asset for representation.
- **Staging Rule:** For existing properties with unverified ownership, `OwnerID` is maintained as `NULL` during migration until verified seller accounts are attached.

### 3. `Agent` &rarr; `Property` (1:M as Listing Representative)
- **Cardinality:** One `Agent` represents zero, one, or many properties (`AgentID`).
- **Relational Anchor:** `Property.AgentID` references `Agent.AgentID` (not `User.UserID`).
- **Domain Meaning:** The licensed professional responsible for client tours, marketing, inquiry responses, and transaction documentation.

### 4. `Property` &rarr; `PropertyPhoto` (1:M Gallery)
- **Cardinality:** One `Property` has zero, one, or many photos (`PhotoID`).
- **Referential Integrity:** `ON DELETE CASCADE` ensures photo metadata is removed if a property record is removed.
- **Physical Cleanup Requirement:** Application service lifecycle hooks must delete the physical files from server storage/S3 when a database photo record is removed.

### 5. `User` & `Property` &rarr; `Inquiry` (M:N Resolved via Junction)
- **Cardinality:** A prospective buyer or renter can inquire about multiple properties; a property can receive inquiries from multiple users.
- **Composite Association:** `Inquiry.PropertyID` &rarr; `Property.PropertyID` and `Inquiry.UserID` &rarr; `User.UserID`.
- **Domain Meaning:** Captures both informational inquiries (`InquiryType = 'Inquiry'`) and formal price proposals (`InquiryType = 'Offer'` with `OfferAmount > 0`).

### 6. `PropertyTransaction` (Multi-Entity Deal Ledger & Recurrence)
- **Cardinality:** A property can have **multiple transactions over time** (`1:M`).
- **Domain Meaning:** 
  - For `Sale`: Typically one completed sale occurs per property ownership lifecycle.
  - For `Rent`: **Properties are rented repeatedly over time.** A lease of 1 year concludes, the property returns to `Available`, and a new rental transaction occurs with a new tenant.
  - Therefore, the schema **does NOT enforce a unique constraint on `PropertyID` in `PropertyTransaction`**.
- **Auditability:** Transactions record `Pending`, `Completed`, or `Cancelled`. Once `Completed`, the financial and participant fields become immutable, forming an auditable ledger.

### 7. `Appointment` (Tour Coordination & Conflict Prevention)
- **Cardinality:** Links `ClientID` (`User`), `AgentID` (`Agent`), and `PropertyID` (`Property`).
- **Double-Booking Prevention:** A standard database index on `(AppointmentDate, AppointmentTime)` is insufficient to prevent an agent from being booked for two different properties at the same time. EstateCore enforces scheduling uniqueness at the transaction level:
  $$\text{Exclusive Check: } \text{COUNT(*)} = 0 \text{ WHERE } AgentID = :agent \text{ AND } Date = :date \text{ AND } Time = :time \text{ AND } Status \neq \text{'CANCELLED'}$$
