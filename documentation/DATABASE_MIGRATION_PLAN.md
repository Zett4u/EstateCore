# EstateCore — Database Migration & Integrity Plan
### Safe, Non-Destructive Schema Evolution from Legacy Tables to Normalized PascalCase Architecture

**Status:** Proposed Architecture Plan (Pending User Approval)  
**Safety Guarantee:** **Zero Data Loss.** No tables will be dropped; no existing user accounts, listings, inquiries, or appointments will be deleted.

---

## 1. Pre-Migration Safety Backup

Before applying any schema modifications, a timestamped snapshot of the live MySQL database will be created:
```bash
docker exec estatecore-mysql mysqldump -u root -pestatecore_root_secure_pass_2026 \
  --no-tablespaces --databases estatecore_db --add-drop-table > database/exports/pre_alignment_backup_20261124.sql
```

---

## 2. Migration Stages & Step-by-Step SQL Execution

### Stage 1: Create the New `Agent`, `PropertyPhoto`, and `PropertyTransaction` Tables
Create the missing entities in PascalCase with proper indexes and constraints:

```sql
-- 1. Create Agent Table (1:1 with User)
CREATE TABLE IF NOT EXISTS Agent (
    AgentID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    LicenseNumber VARCHAR(30) NOT NULL UNIQUE,
    AgencyName VARCHAR(100) NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_Agent_User FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create PropertyPhoto Table (1:M with Property)
CREATE TABLE IF NOT EXISTS PropertyPhoto (
    PhotoID INT AUTO_INCREMENT PRIMARY KEY,
    PropertyID INT NOT NULL,
    FilePath VARCHAR(255) NOT NULL,
    DateUploaded DATE NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PropertyPhoto_Property FOREIGN KEY (PropertyID) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create PropertyTransaction Table (M:N Deal Ledger)
CREATE TABLE IF NOT EXISTS PropertyTransaction (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    PropertyID INT NOT NULL,
    BuyerID INT NOT NULL,
    AgentID INT NOT NULL,
    Amount DECIMAL(12,2) NOT NULL,
    TransactionType VARCHAR(10) NOT NULL,
    PaymentMethod VARCHAR(20) NOT NULL,
    TransactionDate DATE NOT NULL,
    Status VARCHAR(15) NOT NULL DEFAULT 'Pending',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT CHK_Transaction_Amount CHECK (Amount > 0),
    CONSTRAINT CHK_Transaction_Type CHECK (TransactionType IN ('Sale', 'Rent')),
    CONSTRAINT CHK_Transaction_Payment CHECK (PaymentMethod IN ('Cash', 'BankTransfer', 'GCash', 'Card')),
    CONSTRAINT CHK_Transaction_Status CHECK (Status IN ('Pending', 'Completed', 'Cancelled')),
    CONSTRAINT FK_Transaction_Property FOREIGN KEY (PropertyID) REFERENCES properties(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_Transaction_Buyer FOREIGN KEY (BuyerID) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_Transaction_Agent FOREIGN KEY (AgentID) REFERENCES Agent(AgentID) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Stage 2: Backfill Agent Profiles for Existing Agents
Populate professional license numbers for existing agent accounts (`id = 2` [Maria Santos] and `id = 3` [Carlos Reyes]):
```sql
INSERT INTO Agent (UserID, LicenseNumber, AgencyName)
SELECT id, 'PRC-REB-002491', 'EstateCore Premier Realty'
FROM users WHERE id = 2 AND NOT EXISTS (SELECT 1 FROM Agent WHERE UserID = 2);

INSERT INTO Agent (UserID, LicenseNumber, AgencyName)
SELECT id, 'PRC-REB-003810', 'Apex Commercial Advisors'
FROM users WHERE id = 3 AND NOT EXISTS (SELECT 1 FROM Agent WHERE UserID = 3);
```

---

### Stage 3: Enhance `users` with `FirstName`, `LastName`, `ContactNumber`, `DateRegistered`
Enrich existing user rows without dropping `fullName` (keeping backwards compatibility):
```sql
ALTER TABLE users 
    ADD COLUMN FirstName VARCHAR(50) NULL AFTER fullName,
    ADD COLUMN LastName VARCHAR(50) NULL AFTER FirstName,
    ADD COLUMN ContactNumber VARCHAR(15) NULL AFTER email,
    ADD COLUMN DateRegistered DATE NULL AFTER role;

-- Populate split names from existing fullName
UPDATE users 
SET 
    FirstName = SUBSTRING_INDEX(fullName, ' ', 1),
    LastName = CASE 
        WHEN LOCATE(' ', fullName) > 0 THEN SUBSTRING(fullName, LOCATE(' ', fullName) + 1)
        ELSE 'User'
    END,
    ContactNumber = '09171234567',
    DateRegistered = DATE(createdAt)
WHERE FirstName IS NULL;

-- Make fields NOT NULL after successful backfill
ALTER TABLE users 
    MODIFY COLUMN FirstName VARCHAR(50) NOT NULL,
    MODIFY COLUMN LastName VARCHAR(50) NOT NULL,
    MODIFY COLUMN ContactNumber VARCHAR(15) NOT NULL,
    MODIFY COLUMN DateRegistered DATE NOT NULL;
```

---

### Stage 4: Enhance `properties` with `OwnerID`, `City`, `DateListed`
Introduce distinct owner attribution (`OwnerID` &rarr; `users.id`) and link `agentId` to `Agent.AgentID`:
```sql
ALTER TABLE properties
    ADD COLUMN OwnerID INT NULL AFTER id,
    ADD COLUMN City VARCHAR(50) NULL AFTER address,
    ADD COLUMN DateListed DATE NULL AFTER status;

-- Default OwnerID to Admin (id=1) as institutional owner, or Client owner
UPDATE properties 
SET 
    OwnerID = 1,
    City = location,
    DateListed = DATE(createdAt)
WHERE OwnerID IS NULL;

ALTER TABLE properties
    MODIFY COLUMN OwnerID INT NOT NULL,
    MODIFY COLUMN City VARCHAR(50) NOT NULL,
    MODIFY COLUMN DateListed DATE NOT NULL,
    ADD CONSTRAINT FK_Property_Owner FOREIGN KEY (OwnerID) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

### Stage 5: Enhance `inquiries` with `InquiryType` and `OfferAmount`
Support price proposals alongside questions:
```sql
ALTER TABLE inquiries
    ADD COLUMN InquiryType VARCHAR(10) NOT NULL DEFAULT 'Inquiry' AFTER propertyId,
    ADD COLUMN OfferAmount DECIMAL(12,2) NULL AFTER message;

-- Map legacy statuses to PDF values
UPDATE inquiries SET status = 'Replied' WHERE status = 'CONTACTED';
UPDATE inquiries SET status = 'Accepted' WHERE status = 'QUALIFIED';
UPDATE inquiries SET status = 'Rejected' WHERE status = 'CLOSED';
UPDATE inquiries SET status = 'Pending' WHERE status = 'PENDING';
```

---

### Stage 6: Populate Property Photos Gallery
Attach verified architectural photography records into `PropertyPhoto`:
```sql
INSERT INTO PropertyPhoto (PropertyID, FilePath, DateUploaded) VALUES
(1, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80', '2026-10-01'),
(1, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80', '2026-10-01'),
(2, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80', '2026-10-05'),
(3, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80', '2026-10-10'),
(4, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80', '2026-10-12'),
(5, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80', '2026-10-15'),
(6, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80', '2026-10-18');
```

---

### Stage 7: Populate Initial Transactions Ledger
Record realistic completed and pending transactions:
```sql
-- Client Juan Dela Cruz buying Property 1 closed by Agent Maria Santos
INSERT INTO PropertyTransaction (PropertyID, BuyerID, AgentID, Amount, TransactionType, PaymentMethod, TransactionDate, Status)
SELECT 1, 4, 1, 18500000.00, 'Sale', 'BankTransfer', '2026-10-25', 'Pending'
FROM Dual WHERE NOT EXISTS (SELECT 1 FROM PropertyTransaction WHERE TransactionID = 1);
```

---

## 3. Data Integrity & Verification Queries

After applying the migration, run these validation queries:
```sql
-- 1. Verify all 6 core entities + Appointment exist
SHOW TABLES;

-- 2. Verify 1:1 User-Agent relationship integrity
SELECT u.id, u.email, a.AgentID, a.LicenseNumber 
FROM users u 
INNER JOIN Agent a ON u.id = a.UserID;

-- 3. Verify Property Owner and Agent separation
SELECT p.id, p.title, p.OwnerID, u.email AS OwnerEmail, p.agentId, a.LicenseNumber 
FROM properties p 
JOIN users u ON p.OwnerID = u.id 
JOIN Agent a ON p.agentId = a.AgentID;

-- 4. Verify Photo gallery attached to properties
SELECT PropertyID, COUNT(*) AS PhotoCount FROM PropertyPhoto GROUP BY PropertyID;

-- 5. Verify Transaction integrity
SELECT t.TransactionID, p.title, b.email AS BuyerEmail, a.LicenseNumber, t.Amount, t.Status 
FROM PropertyTransaction t
JOIN properties p ON t.PropertyID = p.id
JOIN users b ON t.BuyerID = b.id
JOIN Agent a ON t.AgentID = a.AgentID;
```

---

## 4. Rollback Plan

If any issue arises during verification:
1. Revert to the snapshot created in Step 1:
   ```bash
   docker exec -i estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db < database/exports/pre_alignment_backup_20261124.sql
   ```
2. The database instantly returns to its pre-migration operational state.
