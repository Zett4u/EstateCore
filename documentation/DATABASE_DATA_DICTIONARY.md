# EstateCore — Database Data Dictionary (Revised)
### Complete Technical Schema Specifications (Laboratory Activity 04 & Enterprise Implementation)

**Database Management System:** MySQL 8.4 LTS  
**Storage Engine:** InnoDB  
**Character Set:** `utf8mb4`  
**Collation:** `utf8mb4_unicode_ci`  
**Naming Standard:** Strict PascalCase for all tables and column identifiers

---

## 1. Table: `User`
Stores system accounts for all participants: buyers, renters, sellers, property managers, licensed agents, and administrators.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `UserID` | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique identity identifier across the entire platform |
| `FirstName` | `VARCHAR` | 50 | **NO** | **NO** | Length: 1–50 | First / given name of the account holder |
| `LastName` | `VARCHAR` | 50 | **NO** | **NO** | Length: 1–50 | Last / family surname (supports compound surnames e.g. "Dela Cruz") |
| `Email` | `VARCHAR` | 100 | **NO** | **NO** | `UNIQUE`, Email format | Login identifier and notification email address |
| `ContactNumber`| `VARCHAR` | 15 | **YES** | **NO** | Length: 7–15 | Phone number. **Nullable during migration staging** until collected from users; no fake phone numbers are injected. |
| `PasswordHash` | `VARCHAR` | 255 | **NO** | **NO** | bcrypt 10-round salted | Secure one-way hashed password; never exposed in API responses |
| `Role` | `VARCHAR` | 20 | **NO** | **NO** | `CHECK (Role IN ('Buyer','Renter','Seller','PropertyManager','Agent','Admin'))` | Application authorization role |
| `DateRegistered`| `DATE` | - | **NO** | **NO** | Default current date | Calendar date of account registration |
| `IsActive` | `TINYINT` | 1 | **NO** | **NO** | Default `1` | Soft-state account flag (`1` = Active, `0` = Deactivated) |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Audit modification timestamp |

**Indexes & Keys:**
- `PRIMARY KEY (UserID)`
- `UNIQUE INDEX UQ_User_Email (Email)`
- `INDEX IDX_User_Role (Role)`

---

## 2. Table: `Agent`
Stores professional credentials and licensing records for real estate agents in 1:1 relationship with `User`.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `AgentID` | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique agent record identifier |
| `UserID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `User(UserID)`, `UNIQUE` | 1:1 link to User. User must hold `Agent` role |
| `LicenseNumber`| `VARCHAR` | 30 | **YES** | **NO** | `UNIQUE` when non-null | Professional Regulation Commission (PRC) license number. **Nullable during staging** until verified; no fake numbers are fabricated. |
| `AgencyName` | `VARCHAR` | 100 | **YES** | **YES** | Length: 1–100 | Brokerage, realty firm, or agency affiliation |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Audit creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Audit modification timestamp |

**Foreign Key Rules:**
- `FK_Agent_User`: `UserID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes & Keys:**
- `PRIMARY KEY (AgentID)`
- `UNIQUE INDEX UQ_Agent_UserID (UserID)`
- `UNIQUE INDEX UQ_Agent_LicenseNumber (LicenseNumber)`

---

## 3. Table: `Property`
Represents real estate inventory cataloged for sale or lease.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `PropertyID` | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique property listing identifier |
| `OwnerID` | `INT` | 11 | **YES** | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Seller or property manager who legally owns the asset. **Nullable during staging** until ownership is verified; not defaulted to Admin. |
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

**Foreign Key Rules:**
- `FK_Property_Owner`: `OwnerID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FK_Property_Agent`: `AgentID` references `Agent(AgentID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes & Keys:**
- `PRIMARY KEY (PropertyID)`
- `INDEX IDX_Property_OwnerID (OwnerID)`
- `INDEX IDX_Property_AgentID (AgentID)`
- `INDEX IDX_Property_Status (Status)`
- `INDEX IDX_Property_ListingType (ListingType)`
- `INDEX IDX_Property_City (City)`
- `INDEX IDX_Property_Price (Price)`

---

## 4. Table: `PropertyPhoto`
Stores photographic media galleries attached to property listings.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `PhotoID` | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique photograph identifier |
| `PropertyID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property shown in the photo |
| `FilePath` | `VARCHAR` | 255 | **NO** | **NO** | Length: 5–255 | Relative file storage path or CDN URI |
| `DateUploaded`| `DATE` | - | **NO** | **NO** | Default current date | Calendar date photo was uploaded |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |

**Foreign Key Rules:**
- `FK_PropertyPhoto_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE CASCADE ON UPDATE CASCADE.
**Indexes & Keys:**
- `PRIMARY KEY (PhotoID)`
- `INDEX IDX_PropertyPhoto_PropertyID (PropertyID)`

---

## 5. Table: `Inquiry`
Records prospect inquiries and purchase/lease price offers.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `InquiryID` | `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique inquiry identifier |
| `PropertyID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property inquired about |
| `UserID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Prospective buyer or renter sender |
| `InquiryType` | `VARCHAR` | 10 | **NO** | **NO** | `CHECK (InquiryType IN ('Inquiry', 'Offer'))` | Message classification |
| `Message` | `TEXT` | - | **NO** | **NO** | Length: 5–2000 | Inquirer's message or proposal details |
| `OfferAmount` | `DECIMAL` | 12,2 | **YES** | **YES** | `CHECK (OfferAmount IS NULL OR OfferAmount > 0)` | Proposed financial offer; required only when `InquiryType = 'Offer'` |
| `Status` | `VARCHAR` | 15 | **NO** | **NO** | `CHECK (Status IN ('Pending', 'Accepted', 'Rejected', 'Replied'))` | Current lifecycle state of inquiry |
| `DateSent` | `DATETIME` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Date and time inquiry was submitted |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Record creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

**Foreign Key Rules:**
- `FK_Inquiry_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE CASCADE ON UPDATE CASCADE.
- `FK_Inquiry_User`: `UserID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes & Keys:**
- `PRIMARY KEY (InquiryID)`
- `INDEX IDX_Inquiry_PropertyID (PropertyID)`
- `INDEX IDX_Inquiry_UserID (UserID)`
- `INDEX IDX_Inquiry_Status (Status)`

---

## 6. Table: `PropertyTransaction`
Auditable immutable deal ledger recording completed and pending sales and rentals.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `TransactionID`| `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique transaction deal identifier |
| `PropertyID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property involved in deal |
| `BuyerID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Buyer or tenant party entering deal |
| `AgentID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Closing broker handling transaction |
| `Amount` | `DECIMAL` | 12,2 | **NO** | **NO** | `CHECK (Amount > 0)` | Final transacted monetary amount in PHP |
| `TransactionType`| `VARCHAR`| 10 | **NO** | **NO** | `CHECK (TransactionType IN ('Sale', 'Rent'))` | Deal classification |
| `PaymentMethod`| `VARCHAR` | 20 | **NO** | **NO** | `CHECK (PaymentMethod IN ('Cash', 'BankTransfer', 'GCash', 'Card'))` | Payment settlement instrument |
| `TransactionDate`| `DATE` | - | **NO** | **NO** | Default current date | Calendar date deal occurred |
| `Status` | `VARCHAR` | 15 | **NO** | **NO** | `CHECK (Status IN ('Pending', 'Completed', 'Cancelled'))` | Transaction settlement state |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Immutable creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

**Foreign Key Rules:**
- `FK_Transaction_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FK_Transaction_Buyer`: `BuyerID` references `User(UserID)` ON DELETE RESTRICT ON UPDATE CASCADE.
- `FK_Transaction_Agent`: `AgentID` references `Agent(AgentID)` ON DELETE RESTRICT ON UPDATE CASCADE.
**Indexes & Keys:**
- `PRIMARY KEY (TransactionID)`
- `INDEX IDX_Transaction_PropertyID (PropertyID)`
- `INDEX IDX_Transaction_BuyerID (BuyerID)`
- `INDEX IDX_Transaction_AgentID (AgentID)`
- `INDEX IDX_Transaction_Status (Status)`

---

## 7. Supporting Table: `Appointment`
Preserves tour scheduling and on-site inspection workflows.

| Column Name | SQL Data Type | Size / Precision | Nullable (Staging) | Nullable (Final Target) | Constraints / Defaults | Description & Domain Rules |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `AppointmentID`| `INT` | 11 | **NO** | **NO** | `PRIMARY KEY`, `AUTO_INCREMENT` | Unique viewing tour identifier |
| `PropertyID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Property(PropertyID)` | Property scheduled for viewing |
| `ClientID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `User(UserID)` | Prospective client attending tour |
| `AgentID` | `INT` | 11 | **NO** | **NO** | `FOREIGN KEY` &rarr; `Agent(AgentID)` | Conducting agent (resolved via `Agent.UserID`) |
| `AppointmentDate`| `DATE` | - | **NO** | **NO** | Valid calendar date | Date of physical visit |
| `AppointmentTime`| `VARCHAR`| 20 | **NO** | **NO** | Valid time format (e.g. `10:00`, `14:30`) | Scheduled time of tour |
| `Status` | `VARCHAR` | 20 | **NO** | **NO** | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED` | Tour workflow state |
| `Notes` | `TEXT` | - | **YES** | **YES** | Special instructions | Gate pass or client remarks |
| `CreatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP` | Row creation timestamp |
| `UpdatedAt` | `TIMESTAMP` | - | **NO** | **NO** | `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` | Status change timestamp |

**Foreign Key Rules:**
- `FK_Appointment_Property`: `PropertyID` references `Property(PropertyID)` ON DELETE CASCADE.
- `FK_Appointment_Client`: `ClientID` references `User(UserID)` ON DELETE RESTRICT.
- `FK_Appointment_Agent`: `AgentID` references `Agent(AgentID)` ON DELETE RESTRICT.
**Indexes & Keys:**
- `PRIMARY KEY (AppointmentID)`
- `INDEX IDX_Appointment_PropertyID (PropertyID)`
- `INDEX IDX_Appointment_ClientID (ClientID)`
- `INDEX IDX_Appointment_AgentID (AgentID)`
- `INDEX IDX_Appointment_Schedule (AppointmentDate, AppointmentTime)`
