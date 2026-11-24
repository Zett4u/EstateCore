import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users table
    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`fullName\` varchar(150) NOT NULL,
        \`email\` varchar(150) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`role\` enum('ADMIN', 'AGENT', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
        \`isActive\` tinyint NOT NULL DEFAULT 1,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX \`IDX_users_email\` (\`email\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Properties table
    await queryRunner.query(`
      CREATE TABLE \`properties\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`title\` varchar(255) NOT NULL,
        \`description\` text NOT NULL,
        \`propertyType\` enum('HOUSE', 'APARTMENT', 'CONDOMINIUM', 'COMMERCIAL', 'LAND', 'TOWNHOUSE') NOT NULL,
        \`listingType\` enum('SALE', 'RENT') NOT NULL,
        \`price\` decimal(12,2) NOT NULL,
        \`location\` varchar(150) NOT NULL,
        \`address\` varchar(255) NOT NULL,
        \`bedrooms\` int NOT NULL DEFAULT 1,
        \`bathrooms\` int NOT NULL DEFAULT 1,
        \`floorArea\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`lotArea\` decimal(10,2) NOT NULL DEFAULT 0.00,
        \`status\` enum('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED') NOT NULL DEFAULT 'AVAILABLE',
        \`agentId\` int NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`IDX_properties_propertyType\` (\`propertyType\`),
        INDEX \`IDX_properties_listingType\` (\`listingType\`),
        INDEX \`IDX_properties_location\` (\`location\`),
        INDEX \`IDX_properties_status\` (\`status\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_properties_agentId\` FOREIGN KEY (\`agentId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Inquiries table
    await queryRunner.query(`
      CREATE TABLE \`inquiries\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`clientId\` int NOT NULL,
        \`propertyId\` int NOT NULL,
        \`assignedAgentId\` int NULL,
        \`subject\` varchar(200) NOT NULL,
        \`message\` text NOT NULL,
        \`contactNumber\` varchar(50) NOT NULL,
        \`status\` enum('PENDING', 'CONTACTED', 'QUALIFIED', 'CLOSED') NOT NULL DEFAULT 'PENDING',
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`IDX_inquiries_status\` (\`status\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_inquiries_clientId\` FOREIGN KEY (\`clientId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_inquiries_propertyId\` FOREIGN KEY (\`propertyId\`) REFERENCES \`properties\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_inquiries_assignedAgentId\` FOREIGN KEY (\`assignedAgentId\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Appointments table
    await queryRunner.query(`
      CREATE TABLE \`appointments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`propertyId\` int NOT NULL,
        \`clientId\` int NOT NULL,
        \`agentId\` int NOT NULL,
        \`appointmentDate\` date NOT NULL,
        \`appointmentTime\` varchar(20) NOT NULL,
        \`status\` enum('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`notes\` text NULL,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`IDX_appointments_date\` (\`appointmentDate\`),
        INDEX \`IDX_appointments_status\` (\`status\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_appointments_propertyId\` FOREIGN KEY (\`propertyId\`) REFERENCES \`properties\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_appointments_clientId\` FOREIGN KEY (\`clientId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`FK_appointments_agentId\` FOREIGN KEY (\`agentId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`appointments\`;`);
    await queryRunner.query(`DROP TABLE \`inquiries\`;`);
    await queryRunner.query(`DROP TABLE \`properties\`;`);
    await queryRunner.query(`DROP TABLE \`users\`;`);
  }
}
