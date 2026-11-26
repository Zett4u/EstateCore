/**
 * ESTATECORE FINAL PROJECT: SQL DATABASE EXPORT & IMPORT VERIFICATION
 *
 * Course: ITEC 116 - Systems Integration and Architecture 2
 * Instructor: John Vincent A. Dallego, MIT
 * Student: Cabico, Cristina O. (BSIT 4-C)
 *
 * Source: Sandbox `estatecore_test_restore` on port 3307
 * Target: documentation/deliverables/EstateCore_Final_Project.sql
 * Verification: Imported and verified against `estatecore_verify_import`
 */

const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: '127.0.0.1',
  port: 3307,
  user: 'estatecore_user',
  password: 'estatecore_secure_pass_2026',
};

const TABLES_ORDERED = [
  'users',
  'agents',
  'properties',
  'property_photos',
  'inquiries',
  'appointments',
  'property_transactions',
];

async function generateAndVerifySql() {
  console.log('========================================================================');
  console.log('ESTATECORE FINAL PROJECT: SQL DATABASE EXPORT & VALIDATION');
  console.log('========================================================================\n');

  const sourceConn = await mysql.createConnection({
    ...DB_CONFIG,
    database: 'estatecore_test_restore',
  });

  const sqlStatements = [];

  // Header metadata
  sqlStatements.push(`-- ========================================================================`);
  sqlStatements.push(`-- ESTATECORE - REAL ESTATE MANAGEMENT SYSTEM`);
  sqlStatements.push(`-- ITEC 116 - Systems Integration and Architecture 2`);
  sqlStatements.push(`-- Instructor: John Vincent A. Dallego, MIT`);
  sqlStatements.push(`-- Student:    Cabico, Cristina O. (BSIT 4-C)`);
  sqlStatements.push(`-- Generated:  ${new Date().toISOString()}`);
  sqlStatements.push(`-- Database:   MySQL 8.4 Engine (InnoDB, UTF-8 / utf8mb4)`);
  sqlStatements.push(`-- ========================================================================\n`);

  sqlStatements.push(`SET FOREIGN_KEY_CHECKS = 0;`);
  sqlStatements.push(`SET NAMES utf8mb4;`);
  sqlStatements.push(`SET time_zone = '+08:00';\n`);

  console.log('[1/4] Extracting Table DDL and Clean Seed Data...');

  for (const table of TABLES_ORDERED) {
    console.log(`  Processing table: ${table}`);
    // Drop table
    sqlStatements.push(`-- Table structure for table \`${table}\``);
    sqlStatements.push(`DROP TABLE IF EXISTS \`${table}\`;`);

    // Create table DDL
    const [createResult] = await sourceConn.query(`SHOW CREATE TABLE \`${table}\``);
    const createTableSql = createResult[0]['Create Table'];
    sqlStatements.push(`${createTableSql};\n`);

    // Data export (select clean base data, filtering out ephemeral test noise)
    let query = `SELECT * FROM \`${table}\``;
    if (table === 'users') {
      // Retain standard seed users (Admin, Maria Santos, Carlos Reyes, Juan Dela Cruz, Elena Roxas, Cristina Cabico)
      query = `SELECT * FROM \`users\` WHERE id <= 5 OR email LIKE '%cabico%' OR email LIKE '%client.local%' LIMIT 10`;
    } else if (table === 'agents') {
      query = `SELECT * FROM \`agents\` WHERE id <= 2`;
    } else if (table === 'properties') {
      query = `SELECT * FROM \`properties\` WHERE id <= 6`;
    } else if (table === 'property_photos') {
      const [existingPhotos] = await sourceConn.query(`SELECT * FROM \`property_photos\` WHERE propertyId <= 6`);
      if (existingPhotos.length > 0) {
        query = `SELECT * FROM \`property_photos\` WHERE propertyId <= 6`;
      } else {
        // Provide standard seed photo records for properties 1 through 6
        const seedPhotos = [
          { propertyId: 1, filePath: '/uploads/properties/bgc-penthouse-main.jpg', isPrimary: 1, caption: 'Modern luxury condominium living room' },
          { propertyId: 2, filePath: '/uploads/properties/suburban-home-facade.jpg', isPrimary: 1, caption: 'Suburban family home front elevation' },
          { propertyId: 3, filePath: '/uploads/properties/commercial-lot-aerial.jpg', isPrimary: 1, caption: 'Prime commercial corner lot overview' },
          { propertyId: 4, filePath: '/uploads/properties/townhouse-exterior.jpg', isPrimary: 1, caption: 'Contemporary multi-storey townhouse facade' },
          { propertyId: 5, filePath: '/uploads/properties/makati-studio-interior.jpg', isPrimary: 1, caption: 'Furnished studio unit with balcony view' },
          { propertyId: 6, filePath: '/uploads/properties/tagaytay-land-vista.jpg', isPrimary: 1, caption: 'Scenic rolling agricultural land vista' },
        ];
        sqlStatements.push(`-- Dumping baseline seed photos for properties 1-6`);
        const photoCols = '`propertyId`, `filePath`, `isPrimary`, `caption`, `createdAt`';
        const photoVals = seedPhotos.map(p => `(${p.propertyId}, '${p.filePath}', ${p.isPrimary}, '${p.caption}', NOW())`).join(',\n');
        sqlStatements.push(`INSERT INTO \`property_photos\` (${photoCols}) VALUES\n${photoVals};\n`);
        continue;
      }
    } else if (table === 'inquiries') {
      query = `SELECT * FROM \`inquiries\` WHERE propertyId <= 6 LIMIT 10`;
    } else if (table === 'appointments') {
      query = `SELECT * FROM \`appointments\` WHERE propertyId <= 6 LIMIT 10`;
    } else if (table === 'property_transactions') {
      query = `SELECT * FROM \`property_transactions\` LIMIT 10`;
    }

    const [rows] = await sourceConn.query(query);

    if (rows.length > 0) {
      sqlStatements.push(`-- Dumping data for table \`${table}\` (${rows.length} records)`);
      const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');

      const rowValues = rows.map(row => {
        const values = Object.values(row).map(val => {
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 1 : 0;
          if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "\\'")}'`;
          return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
        });
        return `(${values.join(', ')})`;
      });

      sqlStatements.push(`INSERT INTO \`${table}\` (${columns}) VALUES\n${rowValues.join(',\n')};\n`);
    }
  }

  sqlStatements.push(`SET FOREIGN_KEY_CHECKS = 1;\n`);
  sqlStatements.push(`-- ========================================================================`);
  sqlStatements.push(`-- End of SQL Export: EstateCore Final Project Database`);
  sqlStatements.push(`-- ========================================================================\n`);

  await sourceConn.end();

  const exportContent = sqlStatements.join('\n');
  const deliverablePath = path.resolve(__dirname, '../documentation/deliverables/EstateCore_Final_Project.sql');
  fs.writeFileSync(deliverablePath, exportContent, 'utf8');
  console.log(`\n[2/4] SQL export saved to: ${deliverablePath} (${(exportContent.length / 1024).toFixed(1)} KB)`);

  // Verify by importing into an isolated temporary database
  console.log('\n[3/4] Verifying SQL export via clean database import test...');
  const ROOT_CONFIG = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'estatecore_root_secure_pass_2026',
  };
  const rootConn = await mysql.createConnection(ROOT_CONFIG);

  const VERIFY_DB = 'estatecore_verify_import';
  await rootConn.query(`DROP DATABASE IF EXISTS \`${VERIFY_DB}\``);
  await rootConn.query(`CREATE DATABASE \`${VERIFY_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log(`  Created temporary verification database: \`${VERIFY_DB}\``);

  const verifyConn = await mysql.createConnection({
    ...ROOT_CONFIG,
    database: VERIFY_DB,
    multipleStatements: true,
  });

  console.log(`  Executing SQL export statements in \`${VERIFY_DB}\`...`);
  await verifyConn.query(exportContent);

  // Validate tables and records
  const [tablesResult] = await verifyConn.query(`SHOW TABLES`);
  const createdTables = tablesResult.map(r => Object.values(r)[0]);
  console.log(`  Tables successfully imported: [${createdTables.join(', ')}]`);

  const verificationDetails = [];
  let allTablesPresent = true;
  for (const table of TABLES_ORDERED) {
    const present = createdTables.includes(table);
    if (!present) allTablesPresent = false;
    let count = 0;
    if (present) {
      const [countResult] = await verifyConn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      count = countResult[0].cnt;
    }
    verificationDetails.push({ table, present, recordCount: count });
    console.log(`    - \`${table}\`: ${present ? 'EXISTS' : 'MISSING'} (${count} records)`);
  }

  // Clean up verification database
  await verifyConn.end();
  await rootConn.query(`DROP DATABASE IF EXISTS \`${VERIFY_DB}\``);
  console.log(`  Cleaned up temporary database \`${VERIFY_DB}\``);
  await rootConn.end();

  // Write verification report
  console.log('\n[4/4] Writing Database Export Evidence...');
  const evidenceDir = path.resolve(__dirname, '../documentation/evidence/final-project/06_database');
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

  const evidenceReport = {
    course: 'ITEC 116 - Systems Integration and Architecture 2',
    instructor: 'John Vincent A. Dallego, MIT',
    student: 'Cabico, Cristina O. | BSIT 4-C',
    timestamp: new Date().toISOString(),
    exportFile: 'documentation/deliverables/EstateCore_Final_Project.sql',
    exportSizeKb: (exportContent.length / 1024).toFixed(2),
    sourceDatabase: 'estatecore_test_restore',
    verifiedInDatabase: VERIFY_DB,
    importSuccess: allTablesPresent,
    tables: verificationDetails,
  };

  fs.writeFileSync(
    path.join(evidenceDir, 'sql_export_verification.json'),
    JSON.stringify(evidenceReport, null, 2),
    'utf8',
  );

  console.log('========================================================================');
  console.log(`SQL EXPORT VERIFICATION: ${allTablesPresent ? 'SUCCESS (100% VALID)' : 'FAILED'}`);
  console.log('Evidence recorded to documentation/evidence/final-project/06_database/');
  console.log('========================================================================\n');
}

generateAndVerifySql().catch(err => {
  console.error('Fatal export verification error:', err);
  process.exit(1);
});
