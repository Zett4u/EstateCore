# EstateCore — Database Data Dictionary
### Complete Technical Schema Specifications (Laboratory Activity 04 & Production System)

**Database Management System:** MySQL 8.4 LTS  
**Storage Engine:** InnoDB  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Naming Standard:** Strict PascalCase for all tables and column identifiers

---

## 1. Table: `User`
Stores system accounts for all participants: buyers, renters, sellers, property managers, licensed agents, and administrators.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `UserID` | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique system-wide identity identifier |
| `FirstName` | `VARCHAR` | 50 | **NO** | Length: 1–50 | Given personal name of the account holder |
| `LastName` | `VARCHAR` | 50 | **NO** | Length: 1–50 | Family surname of the account holder |
| `Email` | `VARCHAR` | 100 | **NO** | `UNIQUE`, Email format | Login identifier and notification email |
| `ContactNumber`| `VARCHAR` | 15 | **NO** | Digits / International format | Mobile phone number for SMS and notifications |
| `PasswordHash` | `VARCHAR` | 255 | **NO** | bcrypt 10-round salted | Secure one-way hashed password; never returned by API |
| `Role` | `VARCHAR` | 20 | **NO** | `CHECK (Role IN ('Buyer','Renter','Seller','PropertyManager','Agent','Admin'))` | Application authorization role |
| `DateRegistered`| `DATE` | - | **NO** | Default current date | Server-assigned registration calendar date |
| `IsActive` | `TINYINT` | 1 | **NO** | Default `1` | Soft-state account flag (`1` = Active, `0` = Deactivated) |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp of row creation |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Audit timestamp of last record modification |

**Indexes:**
- `PRIMARY KEY (UserID)`
- `UNIQUE INDEX UQ_User_Email (Email)`
- `INDEX IDX_User_Role (Role)`

---

## 2. Table: `Agent`
Stores professional credentials and licensing details for registered real estate agents.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AgentID` | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique agent record identifier |
| `UserID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `User(UserID)`, `UNIQUE` | 1:1 linked user account; user must hold Agent role |
| `LicenseNumber`| `VARCHAR` | 30 | **NO** | `UNIQUE`, Length: 5–30 | Professional Regulation Commission (PRC) license number |
| `AgencyName` | `VARCHAR` | 100 | **YES** | Length: 1–100 | Real estate brokerage or agency affiliation |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Audit modification timestamp |

**Foreign Key Rules:**
- `FK_Agent_User`: `UserID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes:**
- `PRIMARY KEY (AgentID)`
- `UNIQUE INDEX UQ_Agent_UserID (UserID)`
- `UNIQUE INDEX UQ_Agent_LicenseNumber (LicenseNumber)`

---

## 3. Table: `Property`
Represents real estate inventory cataloged for sale or lease.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PropertyID` | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique property listing identifier |
| `OwnerID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Seller or property manager who owns the asset |
| `AgentID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Licensed agent handling marketing and inquiries |
| `Title` | `VARCHAR` | 150 | **NO** | Length: 5–150 | Headline title of listing |
| `PropertyType` | `VARCHAR` | 30 | **NO** | `House`, `Condo`, `Townhouse`, `Apartment`, `Commercial`, `Land` | Architectural categorization |
| `ListingType` | `VARCHAR` | 10 | **NO** | `CHECK (ListingType IN ('Sale', 'Rent'))` | Transaction category |
| `Price` | `DECIMAL` | 12,2 | **NO** | `CHECK (Price > 0)` | Selling price or monthly rental rate in PHP |
| `Address` | `VARCHAR` | 200 | **NO** | Length: 5–200 | Street address and building details |
| `City` | `VARCHAR` | 50 | **NO** | Length: 2–50 | Municipality or city location |
| `Bedrooms` | `INT` | 11 | **NO** | `CHECK (Bedrooms >= 0)` | Number of bedrooms (`0` for studio or commercial) |
| `Bathrooms` | `INT` | 11 | **NO** | `CHECK (Bathrooms >= 0)` | Number of bathrooms (`0` for vacant land) |
| `Status` | `VARCHAR` | 15 | **NO** | `CHECK (Status IN ('Available', 'Reserved', 'Sold', 'Rented'))` | Current lifecycle state of property |
| `DateListed` | `DATE` | - | **NO** | Default current date | Date the property was published to market |
| `Description` | `TEXT` | - | **NO** | Rich architectural copy | Detailed description, finishes, and amenities |
| `FloorArea` | `DECIMAL` | 10,2 | **NO** | In square meters | Usable interior floor area |
| `LotArea` | `DECIMAL` | 10,2 | **NO** | In square meters | Total land/lot area |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Record modification timestamp |

**Foreign Key Rules:**
- `FK_Property_Owner`: `OwnerID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FK_Property_Agent`: `AgentID` references `Agent(AgentID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes:**
- `PRIMARY KEY (PropertyID)`
- `INDEX IDX_Property_OwnerID (OwnerID)`
- `INDEX IDX_Property_AgentID (AgentID)`
- `INDEX IDX_Property_Status (Status)`
- `INDEX IDX_Property_ListingType (ListingType)`
- `INDEX IDX_Property_City (City)`
- `INDEX IDX_Property_Price (Price)`

---

## 4. Table: `PropertyPhoto`
Stores media galleries and architectural photographs attached to property listings.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PhotoID` | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique photograph identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Parent property listing |
| `FilePath` | `VARCHAR` | 255 | **NO** | Valid relative or storage URI | Storage path or CDN URL of image asset |
| `DateUploaded`| `DATE` | - | **NO** | Default current date | Date photograph was uploaded |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit timestamp |

**Foreign Key Rules:**
- `FK_PropertyPhoto_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE CASCADE ON UPDATE CASCADE.
**Indexes:**
- `PRIMARY KEY (PhotoID)`
- `INDEX IDX_PropertyPhoto_PropertyID (PropertyID)`

---

## 5. Table: `Inquiry`
Captures inbound customer inquiries and formal purchase/lease price offers.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `InquiryID` | `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique inquiry identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property subject of the inquiry |
| `UserID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Prospective buyer or renter sender |
| `InquiryType` | `VARCHAR` | 10 | **NO** | `CHECK (InquiryType IN ('Inquiry', 'Offer'))` | Message category |
| `Message` | `TEXT` | - | **NO** | Length: 5–2000 | Content of prospect's question or offer terms |
| `OfferAmount` | `DECIMAL` | 12,2 | **YES** | `CHECK (OfferAmount IS NULL OR OfferAmount > 0)` | Proposed purchase or rental price |
| `Status` | `VARCHAR` | 15 | **NO** | `CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Replied'))` | Resolution status |
| `DateSent` | `DATETIME` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Date and time inquiry was submitted |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Record creation audit timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

**Foreign Key Rules:**
- `FK_Inquiry_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE CASCADE ON UPDATE CASCADE.
- `FK_Inquiry_User`: `UserID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes:**
- `PRIMARY KEY (InquiryID)`
- `INDEX IDX_Inquiry_PropertyID (PropertyID)`
- `INDEX IDX_Inquiry_UserID (UserID)`
- `INDEX IDX_Inquiry_Status (Status)`

---

## 6. Table: `PropertyTransaction`
Auditable immutable deal ledger recording completed or pending property sales and leases.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TransactionID`| `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique transaction deal identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property involved in transaction |
| `BuyerID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Buyer or tenant party |
| `AgentID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Closing real estate agent |
| `Amount` | `DECIMAL` | 12,2 | **NO** | `CHECK (Amount > 0)` | Final agreed transacted monetary price in PHP |
| `TransactionType`| `VARCHAR`| 10 | **NO** | `CHECK (TransactionType IN ('Sale', 'Rent'))` | Deal classification |
| `PaymentMethod`| `VARCHAR` | 20 | **NO** | `CHECK (PaymentMethod IN ('Cash', 'BankTransfer', 'GCash', 'Card'))` | Payment settlement instrument |
| `TransactionDate`| `DATE` | - | **NO** | Default current date | Date deal was closed or recorded |
| `Status` | `VARCHAR` | 15 | **NO** | `CHECK (Status IN ('Pending', 'Completed', 'Cancelled'))` | Transaction settlement state |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Ledger creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Ledger update timestamp |

**Foreign Key Rules:**
- `FK_Transaction_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FK_Transaction_Buyer`: `BuyerID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FK_Transaction_Agent`: `AgentID` references `Agent(AgentID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes:**
- `PRIMARY KEY (TransactionID)`
- `INDEX IDX_Transaction_PropertyID (PropertyID)`
- `INDEX IDX_Transaction_BuyerID (BuyerID)`
- `INDEX IDX_Transaction_AgentID (AgentID)`
- `INDEX IDX_Transaction_Status (Status)`

---

## 7. Supporting Table: `Appointment`
Preserves tour scheduling and on-site property inspection workflows.

| Column Name | SQL Data Type | Size / Precision | Nullable | Constraints / Defaults | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `AppointmentID`| `INT` | 11 | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique tour identifier |
| `PropertyID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property scheduled for viewing |
| `ClientID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Prospective client attending tour |
| `AgentID` | `INT` | 11 | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Conducting agent |
| `AppointmentDate`| `DATE` | - | **NO** | Valid calendar date | Date of physical site visit |
| `AppointmentTime`| `VARCHAR`| 20 | **NO** | Valid 24h / 12h time string | Scheduled time of tour |
| `Status` | `VARCHAR` | 20 | **NO** | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | Tour workflow state |
| `Notes` | `TEXT` | - | **YES** | Special instructions | Client questions, gate passes, or remarks |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Record creation audit timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Record modification timestamp |

**Foreign Key Rules:**
- `FK_Appointment_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE CASCADE.
- `FK_Appointment_Client`: `ClientID` references `User(UserID)` ON DELETE RESTRICT.
- `FK_Appointment_Agent`: `AgentID` references `Agent(AgentID)` ON DELETE RESTRICT.
**Indexes:**
- `PRIMARY KEY (AppointmentID)`
- `INDEX IDX_Appointment_PropertyID (PropertyID)`
- `INDEX IDX_Appointment_ClientID (ClientID)`
- `INDEX IDX_Appointment_AgentID (AgentID)`
- `INDEX IDX_Appointment_Schedule (AppointmentDate, AppointmentTime)`
