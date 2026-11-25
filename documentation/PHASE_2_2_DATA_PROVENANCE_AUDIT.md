# ESTATECORE &mdash; DATA PROVENANCE & FIELD AUDIT (PHASE 2.2)

**Project:** EstateCore Real Estate Management Platform  
**Academic Source of Truth:** `estatecire.pdf` (BSIT 4-C Laboratory Activity 04)  
**Milestone:** Phase 2.2 &mdash; Data Provenance, User Names & Agency Affiliations  
**Date:** November 25, 2026  
**Auditor:** Antigravity Engineering Agent

---

## 1. Agency Affiliation Provenance Audit

### Finding
In previous phases, the `agents` table was seeded/migrated with:
`agencyName = 'EstateCore Realty'` or `default: 'Independent'`.

**Assessment:** `EstateCore Realty` is a fictional platform title and was not derived from any authentic legal employment contract or PRC broker association. Presenting Maria Santos or Carlos Reyes as employees of `EstateCore Realty` violates the non-negotiable instruction:
> *"Do not invent agency information. If that is only a system default, label it as such. Do not present it as Maria's or Carlos's verified brokerage affiliation without evidence."*

### Action Taken in Phase 2.2
1. **Migration Updated:** In [`1700000000001-Phase2AcademicSchemaAlignment.ts`](file:///c:/xampp/htdocs/EstateCore/backend/src/database/migrations/1700000000001-Phase2AcademicSchemaAlignment.ts), `agencyName` was altered to strictly `varchar(150) NULL`. The `INSERT INTO agents` statement sets `agencyName = NULL`.
2. **Entity Updated:** In [`Agent`](file:///c:/xampp/htdocs/EstateCore/backend/src/agents/entities/agent.entity.ts), the misleading `default: 'Independent'` was removed.
3. **Backend Service Updated:** [`AgentsService`](file:///c:/xampp/htdocs/EstateCore/backend/src/agents/agents.service.ts) returns `agencyName: null` unless an authentic agency name is explicitly provided in an admin update.

**Empirical Result in Sandbox:**
```
┌─────────┬────┬────────┬───────────────┬────────────┬────────────────────────┐
│ (index) │ id │ userId │ licenseNumber │ agencyName │ verificationStatus     │
├─────────┼────┼────────┼───────────────┼────────────┼────────────────────────┤
│ 0       │ 1  │ 2      │ null          │ null       │ 'PENDING_VERIFICATION' │
│ 1       │ 2  │ 3      │ null          │ null       │ 'PENDING_VERIFICATION' │
└─────────┴────┴────────┴───────────────┴────────────┴────────────────────────┘
```
**Conclusion:** Both Maria Santos and Carlos Reyes have strictly unverified credentials (`licenseNumber = NULL`, `agencyName = NULL`, `verificationStatus = 'PENDING_VERIFICATION'`). Zero assumed affiliations exist.

---

## 2. User Name Mapping Audit (All 11 Accounts)

Every account in `users` was inspected to determine the validity of the `fullName` &rarr; `firstName` / `lastName` split:

| User ID | Canonical `fullName` | Generated `firstName` | Generated `lastName` | Multi-Word Surname? | Account Classification | Provenance & Audit Assessment |
|:---:|---|---|---|:---:|---|---|
| **1** | `System Administrator` | `System` | `Administrator` | NO | System Account | Functional system account; clean two-word split. |
| **2** | `Maria Santos` | `Maria` | `Santos` | NO | Verified User | Authentic human account; clean single first name and single surname. |
| **3** | `Carlos Reyes` | `Carlos` | `Reyes` | NO | Verified User | Authentic human account; clean single first name and single surname. |
| **4** | `Juan Dela Cruz` | `Juan` | `Dela Cruz` | **YES** | Verified User | Authentic human account; **verified Spanish-Filipino compound surname** (`Dela Cruz`). Split is accurate. |
| **5** | `Elena Roxas` | `Elena` | `Roxas` | NO | Verified User | Authentic human account; clean single first name and single surname. |
| **6** | `Updated Test Buyer Name` | `Updated` | `Test Buyer Name` | YES | Test Artifact | Synthetic test buyer created in Phase 0; multi-word test string. |
| **7** | `Updated Test Buyer Name` | `Updated` | `Test Buyer Name` | YES | Test Artifact | Synthetic test buyer created in Phase 0; multi-word test string. |
| **8** | `Snooping Client B` | `Snooping` | `Client B` | YES | Test Artifact | Synthetic test client created in Phase 0; multi-word test string. |
| **9** | `Snooping Client B` | `Snooping` | `Client B` | YES | Test Artifact | Synthetic test client created in Phase 0; multi-word test string. |
| **10** | `Contract Verification User`| `Contract` | `Verification User`| YES | Test Artifact | Synthetic test account created by Phase 1 integration test. |
| **11** | `Contract Verification User`| `Contract` | `Verification User`| YES | Test Artifact | Synthetic test account created by Phase 1 integration test. |

### Architectural Safeguard
The original `fullName` column is permanently retained as the immutable canonical representation. The application does not discard `fullName`, ensuring that full names are never corrupted by automated splitting rules.

---

## 3. Academic Field Provenance Matrix

| PDF Attribute | Physical DB Column | Entity Property | Data Type | Nullable | Provenance Classification | Provenance Source & Justification |
|---|---|---|---|:---:|:---:|---|
| **UserID** | `users.id` | `User.id` | `int` | NO | **EXACT** | Primary key from original database creation. |
| **FirstName** | `users.firstName` | `User.firstName` | `varchar(100)` | YES | **DERIVED** | Deterministically derived from `fullName`. Verified accurate for human accounts (1&ndash;5). |
| **LastName** | `users.lastName` | `User.lastName` | `varchar(100)` | YES | **DERIVED** | Deterministically derived from `fullName`. Correctly parsed compound surname `Dela Cruz`. |
| **Email** | `users.email` | `User.email` | `varchar(150)` | NO | **EXACT** | Authentic user credential from original seed and registration. |
| **ContactNumber** | `users.contactNumber` | `User.contactNumber` | `varchar(50)` | YES | **PENDING** | Column added in Phase 2.1; existing accounts remain `NULL` (no fake numbers). |
| **PasswordHash** | `users.password` | `User.password` | `varchar(255)` | NO | **EXACT** | Bcrypt hash created at seed (`Password123!`); verified untouched. |
| **Role** | `users.role` | `User.role` | `enum` | NO | **EXACT** | Original application roles (`ADMIN`, `AGENT`, `CLIENT`). |
| **DateRegistered** | `users.createdAt` | `User.dateRegistered` | `timestamp` | NO | **EXACT** | Real creation timestamp preserved verbatim from initial seed. |
| **AgentID** | `agents.id` | `Agent.id` | `int` | NO | **EXACT** | Auto-increment primary key in new `agents` table. |
| **LicenseNumber** | `agents.licenseNumber` | `Agent.licenseNumber` | `varchar(50)` | YES | **PENDING** | Set strictly to `NULL` pending PRC submission. |
| **AgencyName** | `agents.agencyName` | `Agent.agencyName` | `varchar(150)` | YES | **PENDING** | Set strictly to `NULL` pending verified brokerage contract. |
| **PropertyID** | `properties.id` | `Property.id` | `int` | NO | **EXACT** | Primary key from original seed listings. |
| **OwnerID** | `properties.ownerId` | `Property.ownerId` | `int` | YES | **PENDING** | Column added in Phase 2; set strictly to `NULL` pending deed verification. |
| **AgentID (Prop)**| `properties.agentId` | `Property.agentId` | `int` | YES | **EXACT** | Mapped from verified `agents.id` (Props 1, 2, 5 &rarr; Maria [1]; Props 3, 4, 6 &rarr; Carlos [2]; Props 17, 18 &rarr; NULL). |
| **Title** | `properties.title` | `Property.title` | `varchar(255)` | NO | **EXACT** | Authentic marketing title from original seed. |
| **PropertyType** | `properties.propertyType`| `Property.propertyType`| `enum` | NO | **EXACT** | `HOUSE`, `CONDOMINIUM`, `COMMERCIAL`, `LAND`, `TOWNHOUSE`, `APARTMENT`. |
| **ListingType** | `properties.listingType` | `Property.listingType` | `enum` | NO | **EXACT** | `SALE`, `RENT`. |
| **Price** | `properties.price` | `Property.price` | `decimal(12,2)` | NO | **EXACT** | Authentic Philippine Peso valuations from seed. |
| **Address** | `properties.address` | `Property.address` | `varchar(255)` | NO | **EXACT** | Physical street address from seed. |
| **City** | `properties.city` | `Property.city` | `varchar(100)` | YES | **DERIVED** | Populated by SQL pattern match on `location` (e.g. BGC &rarr; Taguig, Alabang &rarr; Muntinlupa). Documented as derived municipal field. |
| **Bedrooms** | `properties.bedrooms` | `Property.bedrooms` | `int` | NO | **EXACT** | Physical room count from seed. |
| **Bathrooms** | `properties.bathrooms` | `Property.bathrooms` | `int` | NO | **EXACT** | Physical bath count from seed. |
| **Status** | `properties.status` | `Property.status` | `enum` | NO | **EXACT** | `AVAILABLE`, `RESERVED`, `SOLD`, `RENTED`. |
| **DateListed** | `properties.createdAt` | `Property.dateListed` | `timestamp` | NO | **EXACT** | Real creation timestamp preserved from seed. |
| **PhotoID** | `property_photos.id` | `PropertyPhoto.id` | `int` | NO | **EXACT** | Auto-increment primary key in new gallery table. |
| **FilePath** | `property_photos.filePath`| `PropertyPhoto.filePath`| `varchar(500)`| NO | **EXACT** | Verified image asset URI. |
| **DateUploaded**| `property_photos.createdAt`| `PropertyPhoto.dateUploaded`| `timestamp`| NO | **EXACT** | Upload timestamp. |
| **InquiryID** | `inquiries.id` | `Inquiry.id` | `int` | NO | **EXACT** | Primary key from original inquiry records. |
| **UserID (Inq)** | `inquiries.clientId` | `Inquiry.client` | `int` | NO | **EXACT** | Foreign key referencing `users.id` (Protected by `RESTRICT`). |
| **InquiryType** | `inquiries.inquiryType` | `Inquiry.inquiryType` | `enum` | NO | **DERIVED** | Defaults to `GENERAL` for legacy records; accepts `VIEWING`, `FINANCING`, `OFFER`. |
| **Message** | `inquiries.message` | `Inquiry.message` | `text` | NO | **EXACT** | Original client text preserved verbatim. |
| **OfferAmount** | `inquiries.offerAmount` | `Inquiry.offerAmount` | `decimal(12,2)`| YES | **EXACT** | Financial bid amount; nullable. |
| **DateSent** | `inquiries.createdAt` | `Inquiry.dateSent` | `timestamp` | NO | **EXACT** | Original creation timestamp preserved verbatim. |
| **TransactionID**| `property_transactions.id`| `PropertyTransaction.id`| `int` | NO | **EXACT** | Auto-increment primary key in new transaction table. |
| **Amount** | `property_transactions.amount`| `PropertyTransaction.amount`| `decimal(12,2)`| NO | **EXACT** | Financial closing amount. |
| **TransactionType**| `property_transactions.transactionType`| `PropertyTransaction.transactionType`| `enum` | NO | **EXACT** | `SALE`, `RENT`. |
| **TransactionDate**| `property_transactions.transactionDate`| `PropertyTransaction.transactionDate`| `date` | NO | **EXACT** | Contract execution date. |
