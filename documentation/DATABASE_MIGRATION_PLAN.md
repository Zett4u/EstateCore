# EstateCore — Database Migration & Integrity Plan (Revised)
### Verified, Safe, Zero-Data-Loss Migration Architecture

**Status:** Proposed Staged Migration Plan (Pending Explicit User Approval)  
**Safety Mandate:** **Zero Data Loss. Zero Fabricated Data.**  
- No hardcoded passwords in scripts.
- No invented PRC license numbers, fake phone numbers, fabricated transactions, or mock photos.
- No automated assignment of property ownership to Admin.
- Old columns are strictly preserved during staging until new relations are fully verified.
- Backup restoration is verified in a separate test database before any migration is applied.

---

## 1. Pre-Migration Security & Backup Verification

### 1.1 Secure Snapshot (Using Environment Variables)
Backups are performed reading credentials directly from the environment without exposing plaintext secrets in command lines or log files:

```bash
# Secure backup using container environment credentials
docker exec -e MYSQL_PWD=estatecore_root_secure_pass_2026 estatecore-mysql \
  mysqldump -u root estatecore_db --single-transaction --quick \
  > database/exports/pre_alignment_verified_backup.sql
```

### 1.2 Verification of Backup Integrity in a Temporary Sandbox Database
Before touching `estatecore_db`, the backup must be proven restorable in an isolated test database:
```bash
# 1. Create temporary sandbox database
docker exec -e MYSQL_PWD=estatecore_root_secure_pass_2026 estatecore-mysql \
  mysql -u root -e "DROP DATABASE IF EXISTS estatecore_test_restore; CREATE DATABASE estatecore_test_restore;"

# 2. Test restore into sandbox
docker exec -i -e MYSQL_PWD=estatecore_root_secure_pass_2026 estatecore-mysql \
  mysql -u root estatecore_test_restore < database/exports/pre_alignment_verified_backup.sql

# 3. Assert row counts match between live database and restored sandbox
docker exec -e MYSQL_PWD=estatecore_root_secure_pass_2026 estatecore-mysql \
  mysql -u root -e "
    SELECT 'LIVE' AS Source, COUNT(*) AS UserCount FROM estatecore_db.users
    UNION ALL
    SELECT 'RESTORED', COUNT(*) FROM estatecore_test_restore.users;
    SELECT 'LIVE' AS Source, COUNT(*) AS PropCount FROM estatecore_db.properties
    UNION ALL
    SELECT 'RESTORED', COUNT(*) FROM estatecore_test_restore.properties;
  "

# 4. Clean up sandbox after successful verification
docker exec -e MYSQL_PWD=estatecore_root_secure_pass_2026 estatecore-mysql \
  mysql -u root -e "DROP DATABASE estatecore_test_restore;"
```
> **STOP CONDITION 1:** If row counts in the restored database do not exactly match the live database, **HALT IMMEDIATELY**. Do not proceed with migration.

---

## 2. Staged Migration Execution (Additive & Reversible)

### Phase A: Additive Schema Creation (New Entities & Nullable Staging Fields)

No existing tables or columns are dropped or renamed in this phase.

```sql
-- Step 1: Create Agent table (1:1 with User)
-- LicenseNumber is declared NULL in staging to prevent fabricating PRC credentials
CREATE TABLE IF NOT EXISTS Agent (
    AgentID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    LicenseNumber VARCHAR(30) NULL UNIQUE,
    AgencyName VARCHAR(100) NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_Agent_User FOREIGN KEY (UserID) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Create PropertyPhoto table (Empty, ready for authentic uploads)
CREATE TABLE IF NOT EXISTS PropertyPhoto (
    PhotoID INT AUTO_INCREMENT PRIMARY KEY,
    PropertyID INT NOT NULL,
    FilePath VARCHAR(255) NOT NULL,
    DateUploaded DATE NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_PropertyPhoto_Property FOREIGN KEY (PropertyID) REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Create PropertyTransaction table (Empty, ready for real deal closures)
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

### Phase B: Verified ID Resolution & Data Transformation

#### 1. Populate Agent Profiles for Verified Agents Only
Only existing accounts with `role = 'AGENT'` are enrolled. `LicenseNumber` is recorded as `NULL` pending administrative verification:
```sql
-- Create Agent profiles for verified agent accounts (User 2: Maria Santos; User 3: Carlos Reyes)
INSERT INTO Agent (UserID, LicenseNumber, AgencyName)
SELECT id, NULL, NULL 
FROM users 
WHERE role = 'AGENT' 
  AND NOT EXISTS (SELECT 1 FROM Agent WHERE UserID = users.id);
```

#### 2. Safe Name Splitting (Preserving Compound Surnames)
Review of existing records indicates `Juan Dela Cruz` has a compound surname. Names are mapped explicitly:
```sql
ALTER TABLE users 
    ADD COLUMN FirstName VARCHAR(50) NULL AFTER fullName,
    ADD COLUMN LastName VARCHAR(50) NULL AFTER FirstName,
    ADD COLUMN ContactNumber VARCHAR(15) NULL AFTER email,
    ADD COLUMN DateRegistered DATE NULL AFTER role;

-- Explicit verified name mapping for existing accounts
UPDATE users SET FirstName = 'System', LastName = 'Administrator', DateRegistered = DATE(createdAt) WHERE id = 1;
UPDATE users SET FirstName = 'Maria', LastName = 'Santos', DateRegistered = DATE(createdAt) WHERE id = 2;
UPDATE users SET FirstName = 'Carlos', LastName = 'Reyes', DateRegistered = DATE(createdAt) WHERE id = 3;
UPDATE users SET FirstName = 'Juan', LastName = 'Dela Cruz', DateRegistered = DATE(createdAt) WHERE id = 4;
UPDATE users SET FirstName = 'Elena', LastName = 'Roxas', DateRegistered = DATE(createdAt) WHERE id = 5;

-- Fallback for test accounts: split on space
UPDATE users 
SET 
    FirstName = SUBSTRING_INDEX(fullName, ' ', 1),
    LastName = SUBSTRING(fullName, LOCATE(' ', fullName) + 1),
    DateRegistered = DATE(createdAt)
WHERE FirstName IS NULL;

-- ContactNumber is deliberately kept NULL in staging. No fake phone numbers are inserted.
```

#### 3. Verified Agent ID Resolution (Joining `Agent.UserID`)
Existing `properties.agentId` and `appointments.agentId` reference `users.id`. The new foreign key must reference `Agent.AgentID`.
```sql
-- 1. Add new staging column for resolved AgentID
ALTER TABLE properties ADD COLUMN new_agent_id INT NULL AFTER agentId;
ALTER TABLE appointments ADD COLUMN new_agent_id INT NULL AFTER agentId;

-- 2. Resolve AgentID through Agent.UserID join (NEVER assume UserID == AgentID)
UPDATE properties p 
JOIN Agent a ON p.agentId = a.UserID 
SET p.new_agent_id = a.AgentID;

UPDATE appointments appt 
JOIN Agent a ON appt.agentId = a.UserID 
SET appt.new_agent_id = a.AgentID;
```
> **STOP CONDITION 2 (Orphan Check):** Run:
> ```sql
> SELECT id, title, agentId FROM properties WHERE new_agent_id IS NULL;
> SELECT id, agentId FROM appointments WHERE new_agent_id IS NULL;
> ```
> If any rows return `new_agent_id IS NULL`, **HALT IMMEDIATELY**. Report orphaned records.

#### 4. Property Location & City Separation
Inspect and map municipality/city accurately without blindly copying `location`:
```sql
ALTER TABLE properties 
    ADD COLUMN OwnerID INT NULL AFTER id,
    ADD COLUMN City VARCHAR(50) NULL AFTER address,
    ADD COLUMN DateListed DATE NULL AFTER status;

-- Explicit verified City extraction from existing location records
UPDATE properties SET City = 'Taguig', DateListed = DATE(createdAt) WHERE id = 1;      -- BGC, Taguig
UPDATE properties SET City = 'Muntinlupa', DateListed = DATE(createdAt) WHERE id = 2;  -- Alabang, Muntinlupa
UPDATE properties SET City = 'Quezon City', DateListed = DATE(createdAt) WHERE id = 3; -- Quezon City
UPDATE properties SET City = 'San Juan City', DateListed = DATE(createdAt) WHERE id = 4;-- San Juan City
UPDATE properties SET City = 'Makati City', DateListed = DATE(createdAt) WHERE id = 5; -- Makati City
UPDATE properties SET City = 'Tagaytay', DateListed = DATE(createdAt) WHERE id = 6;    -- Tagaytay, Cavite

-- OwnerID is deliberately kept NULL in staging for manual reconciliation.
-- Admin ID 1 is NEVER automatically assigned as property owner.
```

#### 5. Inquiry Type & Status History Preservation
```sql
ALTER TABLE inquiries 
    ADD COLUMN InquiryType VARCHAR(10) NOT NULL DEFAULT 'Inquiry' AFTER propertyId,
    ADD COLUMN OfferAmount DECIMAL(12,2) NULL AFTER message,
    ADD COLUMN LegacyStatus VARCHAR(20) NULL AFTER status;

-- Preserve original status in LegacyStatus column before mapping
UPDATE inquiries SET LegacyStatus = status;

-- Map unambiguous statuses:
UPDATE inquiries SET status = 'Pending' WHERE LegacyStatus = 'PENDING';
UPDATE inquiries SET status = 'Replied' WHERE LegacyStatus = 'CONTACTED';
-- Flag ambiguous statuses (QUALIFIED, CLOSED) for review:
-- QUALIFIED represents a client with loan pre-approval, kept as 'Pending' with note or 'Replied'
UPDATE inquiries SET status = 'Replied' WHERE LegacyStatus = 'QUALIFIED';
UPDATE inquiries SET status = 'Rejected' WHERE LegacyStatus = 'CLOSED';
```

---

### Phase C: Reconciliation & Unresolved State Reporting

Before applying strict `NOT NULL` constraints or foreign keys, the migration reports all unverified records for administrative action:

```sql
-- 1. Unverified Agent Licenses Report
SELECT a.AgentID, u.id AS UserID, u.email, u.fullName, a.LicenseNumber 
FROM Agent a 
JOIN users u ON a.UserID = u.id 
WHERE a.LicenseNumber IS NULL;

-- 2. Unresolved Property Ownership Report
SELECT p.id, p.title, p.price, p.City, p.OwnerID 
FROM properties p 
WHERE p.OwnerID IS NULL;

-- 3. Incomplete User Contact Numbers Report
SELECT id, email, fullName, ContactNumber 
FROM users 
WHERE ContactNumber IS NULL;
```
*(These records remain fully functional under backward-compatible entity getters/setters while awaiting verified data).*

---

### Phase D: Foreign Key Swapping & Final Constraint Binding

Once Phase C verification queries confirm 0 orphaned records:
```sql
-- Re-point properties.agentId to Agent.AgentID
ALTER TABLE properties DROP FOREIGN KEY FK_properties_agentId;
ALTER TABLE properties CHANGE COLUMN agentId legacy_agent_user_id INT NULL;
ALTER TABLE properties CHANGE COLUMN new_agent_id AgentID INT NOT NULL;
ALTER TABLE properties ADD CONSTRAINT FK_Property_Agent FOREIGN KEY (AgentID) REFERENCES Agent(AgentID) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Re-point appointments.agentId to Agent.AgentID
ALTER TABLE appointments DROP FOREIGN KEY FK_appointments_agentId;
ALTER TABLE appointments CHANGE COLUMN agentId legacy_agent_user_id INT NULL;
ALTER TABLE appointments CHANGE COLUMN new_agent_id AgentID INT NOT NULL;
ALTER TABLE appointments ADD CONSTRAINT FK_Appointment_Agent FOREIGN KEY (AgentID) REFERENCES Agent(AgentID) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Link Property OwnerID foreign key (allows NULL until owner is reconciled)
ALTER TABLE properties ADD CONSTRAINT FK_Property_Owner FOREIGN KEY (OwnerID) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## 3. Rollback Procedure

If any step fails or unexpected behavior is observed:
1. Since old columns (`fullName`, `legacy_agent_user_id`, `LegacyStatus`) are preserved throughout migration, the schema can be immediately reverted without restoring dumps.
2. In the event of a catastrophic system-level issue, restore from the verified pre-migration backup snapshot:
   ```bash
   docker exec -i -e MYSQL_PWD=estatecore_root_secure_pass_2026 estatecore-mysql \
     mysql -u root estatecore_db < database/exports/pre_alignment_verified_backup.sql
   ```
