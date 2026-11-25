import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2AcademicSchemaAlignment1700000000001 implements MigrationInterface {
  name = 'Phase2AcademicSchemaAlignment1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Database Safety Check: refuse execution against live estatecore_db without explicit authorization
    const currentDb = (queryRunner.connection.options as any).database;
    if (currentDb === 'estatecore_db' && process.env.ALLOW_LIVE_MIGRATION !== 'true') {
      throw new Error(
        'SECURITY REJECTION: Live database estatecore_db migration attempted without explicit human authorization! (ALLOW_LIVE_MIGRATION != true)'
      );
    }

    // 1. Academic Schema Alignment for `users`: add firstName, lastName, and contactNumber
    await queryRunner.query(`
      ALTER TABLE \`users\`
      ADD COLUMN \`firstName\` varchar(100) NULL AFTER \`fullName\`,
      ADD COLUMN \`lastName\` varchar(100) NULL AFTER \`firstName\`,
      ADD COLUMN \`contactNumber\` varchar(50) NULL AFTER \`email\`;
    `);

    // Deterministically populate firstName and lastName from existing fullName
    await queryRunner.query(`
      UPDATE \`users\`
      SET \`firstName\` = CASE
        WHEN LOCATE(' ', \`fullName\`) > 0 THEN SUBSTRING_INDEX(\`fullName\`, ' ', 1)
        ELSE \`fullName\`
      END,
      \`lastName\` = CASE
        WHEN LOCATE(' ', \`fullName\`) > 0 THEN TRIM(SUBSTRING(\`fullName\`, LOCATE(' ', \`fullName\`) + 1))
        ELSE ''
      END;
    `);

    // 2. Create `agents` table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`agents\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`userId\` int NOT NULL,
        \`licenseNumber\` varchar(50) NULL,
        \`agencyName\` varchar(150) NULL,
        \`verificationStatus\` enum('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING_VERIFICATION',
        \`specialization\` varchar(150) NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX \`IDX_agents_userId\` (\`userId\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_agents_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Safe mapping: Insert Agent profiles strictly for users with role = 'AGENT'
    // Maria Santos (UserID=2) -> AgentID=1
    // Carlos Reyes (UserID=3) -> AgentID=2
    // License numbers and agency affiliations remain strictly NULL until verified credentials exist
    await queryRunner.query(`
      INSERT INTO \`agents\` (\`userId\`, \`agencyName\`, \`verificationStatus\`, \`licenseNumber\`)
      SELECT \`id\`, NULL, 'PENDING_VERIFICATION', NULL
      FROM \`users\`
      WHERE \`role\` = 'AGENT' AND \`id\` NOT IN (SELECT \`userId\` FROM \`agents\`)
      ORDER BY \`id\` ASC;
    `);

    // 4. Add `ownerId` and `city` to `properties`
    await queryRunner.query(`
      ALTER TABLE \`properties\`
      ADD COLUMN \`ownerId\` int NULL AFTER \`id\`,
      ADD COLUMN \`city\` varchar(100) NULL AFTER \`location\`,
      ADD CONSTRAINT \`FK_properties_ownerId\` FOREIGN KEY (\`ownerId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // Populate `city` from existing location if available
    await queryRunner.query(`
      UPDATE \`properties\`
      SET \`city\` = CASE
        WHEN \`location\` LIKE '%Taguig%' OR \`location\` LIKE '%BGC%' THEN 'Taguig'
        WHEN \`location\` LIKE '%Makati%' THEN 'Makati'
        WHEN \`location\` LIKE '%Muntinlupa%' OR \`location\` LIKE '%Alabang%' THEN 'Muntinlupa'
        WHEN \`location\` LIKE '%Quezon%' THEN 'Quezon City'
        WHEN \`location\` LIKE '%Cavite%' THEN 'Cavite'
        WHEN \`location\` LIKE '%Batangas%' THEN 'Batangas'
        ELSE \`location\`
      END
      WHERE \`city\` IS NULL;
    `);

    // 5. Migrate `properties.agentId` foreign key to reference `agents(id)` strictly avoiding Admin assignment
    // Step 5a: Drop the old foreign key referencing `users(id)`
    await queryRunner.query(`
      ALTER TABLE \`properties\` DROP FOREIGN KEY \`FK_properties_agentId\`;
    `);

    // Step 5b: Capture previous agent user ID in a temporary column
    await queryRunner.query(`
      ALTER TABLE \`properties\` ADD COLUMN \`_oldAgentUserId\` int NULL;
    `);
    await queryRunner.query(`
      UPDATE \`properties\` SET \`_oldAgentUserId\` = \`agentId\`;
    `);

    // Step 5c: Reset all property agent assignments to NULL (so unverified/admin properties become NULL)
    await queryRunner.query(`
      UPDATE \`properties\` SET \`agentId\` = NULL;
    `);

    // Step 5d: Only assign agentId where _oldAgentUserId corresponds to a verified Agent record
    // This correctly assigns properties 1, 2, 5 -> Agent 1 (Maria) and 3, 4, 6 -> Agent 2 (Carlos),
    // while properties 17 and 18 (assigned to Admin User 1) remain strictly NULL.
    await queryRunner.query(`
      UPDATE \`properties\` p
      JOIN \`agents\` a ON p.\`_oldAgentUserId\` = a.\`userId\`
      SET p.\`agentId\` = a.\`id\`;
    `);

    // Step 5e: Drop temporary column
    await queryRunner.query(`
      ALTER TABLE \`properties\` DROP COLUMN \`_oldAgentUserId\`;
    `);

    // Step 5f: Add the new foreign key referencing `agents(id)`
    await queryRunner.query(`
      ALTER TABLE \`properties\`
      ADD CONSTRAINT \`FK_properties_agentId\` FOREIGN KEY (\`agentId\`) REFERENCES \`agents\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 6. Create `property_photos` table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`property_photos\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`propertyId\` int NOT NULL,
        \`filePath\` varchar(500) NOT NULL,
        \`isPrimary\` tinyint(1) NOT NULL DEFAULT 0,
        \`caption\` varchar(255) NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_property_photos_propertyId\` (\`propertyId\`),
        CONSTRAINT \`FK_property_photos_propertyId\` FOREIGN KEY (\`propertyId\`) REFERENCES \`properties\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Create `property_transactions` table (with RESTRICT to prevent financial cascading deletes)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`property_transactions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`propertyId\` int NOT NULL,
        \`buyerId\` int NOT NULL,
        \`agentId\` int NOT NULL,
        \`amount\` decimal(12,2) NOT NULL,
        \`transactionType\` enum('SALE', 'RENT') NOT NULL,
        \`paymentMethod\` enum('CASH', 'BANK_TRANSFER', 'CHECK', 'FINANCING') NOT NULL DEFAULT 'BANK_TRANSFER',
        \`status\` enum('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`transactionDate\` date NOT NULL,
        \`notes\` text NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_transactions_propertyId\` (\`propertyId\`),
        INDEX \`IDX_transactions_buyerId\` (\`buyerId\`),
        INDEX \`IDX_transactions_agentId\` (\`agentId\`),
        INDEX \`IDX_transactions_status\` (\`status\`),
        INDEX \`IDX_transactions_date\` (\`transactionDate\`),
        CONSTRAINT \`FK_transactions_propertyId\` FOREIGN KEY (\`propertyId\`) REFERENCES \`properties\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_transactions_buyerId\` FOREIGN KEY (\`buyerId\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_transactions_agentId\` FOREIGN KEY (\`agentId\`) REFERENCES \`agents\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Enhance `inquiries` table: add `inquiryType`, `offerAmount`, and `legacyStatus`
    await queryRunner.query(`
      ALTER TABLE \`inquiries\`
      ADD COLUMN \`inquiryType\` enum('GENERAL', 'VIEWING', 'FINANCING', 'OFFER') NOT NULL DEFAULT 'GENERAL' AFTER \`propertyId\`,
      ADD COLUMN \`offerAmount\` decimal(12,2) NULL AFTER \`message\`,
      ADD COLUMN \`legacyStatus\` varchar(50) NULL AFTER \`status\`;
    `);

    // Preserve legacy status verbatim
    await queryRunner.query(`
      UPDATE \`inquiries\`
      SET \`legacyStatus\` = \`status\`
      WHERE \`legacyStatus\` IS NULL;
    `);

    // Protect inquiry history: transition foreign keys to RESTRICT so deleting a user or property doesn't erase inquiries
    await queryRunner.query(`ALTER TABLE \`inquiries\` DROP FOREIGN KEY \`FK_inquiries_clientId\`;`);
    await queryRunner.query(`ALTER TABLE \`inquiries\` DROP FOREIGN KEY \`FK_inquiries_propertyId\`;`);
    await queryRunner.query(`
      ALTER TABLE \`inquiries\`
      ADD CONSTRAINT \`FK_inquiries_clientId\` FOREIGN KEY (\`clientId\`) REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE,
      ADD CONSTRAINT \`FK_inquiries_propertyId\` FOREIGN KEY (\`propertyId\`) REFERENCES \`properties\` (\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const currentDb = (queryRunner.connection.options as any).database;
    if (currentDb === 'estatecore_db' && process.env.ALLOW_LIVE_MIGRATION !== 'true') {
      throw new Error(
        'SECURITY REJECTION: Live database operation blocked! (ALLOW_LIVE_MIGRATION != true)'
      );
    }

    // 1. Revert inquiries FKs and extensions
    await queryRunner.query(`ALTER TABLE \`inquiries\` DROP FOREIGN KEY \`FK_inquiries_clientId\`;`);
    await queryRunner.query(`ALTER TABLE \`inquiries\` DROP FOREIGN KEY \`FK_inquiries_propertyId\`;`);
    await queryRunner.query(`
      ALTER TABLE \`inquiries\`
      ADD CONSTRAINT \`FK_inquiries_clientId\` FOREIGN KEY (\`clientId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      ADD CONSTRAINT \`FK_inquiries_propertyId\` FOREIGN KEY (\`propertyId\`) REFERENCES \`properties\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    await queryRunner.query(`
      ALTER TABLE \`inquiries\`
      DROP COLUMN \`legacyStatus\`,
      DROP COLUMN \`offerAmount\`,
      DROP COLUMN \`inquiryType\`;
    `);

    // 2. Drop property_transactions
    await queryRunner.query(`DROP TABLE IF EXISTS \`property_transactions\`;`);

    // 3. Drop property_photos
    await queryRunner.query(`DROP TABLE IF EXISTS \`property_photos\`;`);

    // 4. Revert properties.agentId back to users(id)
    await queryRunner.query(`ALTER TABLE \`properties\` DROP FOREIGN KEY \`FK_properties_agentId\`;`);

    // Safely map properties.agentId back from Agent.id to Agent.userId
    await queryRunner.query(`ALTER TABLE \`properties\` ADD COLUMN \`_oldAgentId\` int NULL;`);
    await queryRunner.query(`UPDATE \`properties\` SET \`_oldAgentId\` = \`agentId\`;`);
    await queryRunner.query(`UPDATE \`properties\` SET \`agentId\` = NULL;`);
    await queryRunner.query(`
      UPDATE \`properties\` p
      JOIN \`agents\` a ON p.\`_oldAgentId\` = a.\`id\`
      SET p.\`agentId\` = a.\`userId\`;
    `);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`_oldAgentId\`;`);

    // Drop owner foreign key & columns
    await queryRunner.query(`ALTER TABLE \`properties\` DROP FOREIGN KEY \`FK_properties_ownerId\`;`);
    await queryRunner.query(`ALTER TABLE \`properties\` DROP COLUMN \`ownerId\`, DROP COLUMN \`city\`;`);

    // Re-add original constraint pointing to users(id)
    await queryRunner.query(`
      ALTER TABLE \`properties\`
      ADD CONSTRAINT \`FK_properties_agentId\` FOREIGN KEY (\`agentId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE;
    `);

    // 5. Drop agents table
    await queryRunner.query(`DROP TABLE IF EXISTS \`agents\`;`);

    // 6. Revert users table additions
    await queryRunner.query(`
      ALTER TABLE \`users\`
      DROP COLUMN \`contactNumber\`,
      DROP COLUMN \`lastName\`,
      DROP COLUMN \`firstName\`;
    `);
  }
}
