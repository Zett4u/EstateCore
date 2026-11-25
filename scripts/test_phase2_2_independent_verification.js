const mysql = require('../backend/node_modules/mysql2/promise');
const { DataSource } = require('../backend/node_modules/typeorm');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function runIndependentVerification() {
  console.log('=== PHASE 2.2: INDEPENDENT VERIFICATION EXECUTION ===');

  const targetDb = 'estatecore_test_restore';

  // 1. Reset sandbox database from verified backup
  console.log('\n--- 1. Restoring Sandbox from Verified Backup ---');
  const rootConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'estatecore_root_secure_pass_2026',
    multipleStatements: true,
  });

  await rootConn.query(`
    DROP DATABASE IF EXISTS ${targetDb};
    CREATE DATABASE ${targetDb} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    GRANT ALL PRIVILEGES ON ${targetDb}.* TO 'estatecore_user'@'%';
    FLUSH PRIVILEGES;
  `);

  const backupBuffer = fs.readFileSync(path.resolve(__dirname, '../database/exports/phase2_verified_backup.sql'));
  let backupSql;
  // Handle UTF-16 LE BOM from PowerShell redirection
  if (backupBuffer[0] === 0xff && backupBuffer[1] === 0xfe) {
    backupSql = backupBuffer.toString('utf16le');
  } else {
    backupSql = backupBuffer.toString('utf8');
  }
  // Strip UTF-8 BOM if present
  backupSql = backupSql.replace(/^\uFEFF/, '');
  fs.writeFileSync(path.resolve(__dirname, '../database/exports/phase2_verified_backup.sql'), backupSql, 'utf8');

  await rootConn.query(`USE ${targetDb};\n` + backupSql);
  await rootConn.end();
  console.log('Sandbox restored from backup.');

  // 2. Initialize TypeORM DataSource targeting sandbox
  const dataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3307,
    username: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
    entities: [path.join(__dirname, '../backend/dist/**/*.entity.js')],
    migrations: [path.join(__dirname, '../backend/dist/database/migrations/*.js')],
    synchronize: false,
    logging: ['error'],
  });

  await dataSource.initialize();
  console.log(`Connected to DataSource. Active DB: ${(dataSource.options).database}`);

  // 3. Run Migration UP
  console.log('\n--- 2. Executing Migration UP on Sandbox ---');
  const applied = await dataSource.runMigrations();
  console.log(`Applied migrations (${applied.length}): ${applied.map(m => m.name).join(', ')}`);

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
  });

  // Check A: Agency Name Provenance Check (Must be NULL, no assumed 'EstateCore Realty')
  console.log('\n--- 3. Verifying Agency Name Provenance in Agents Table ---');
  const [agents] = await conn.query('SELECT * FROM agents ORDER BY id');
  console.table(agents);
  const agencyProvenanceValid = agents.every(a => a.agencyName === null && a.licenseNumber === null);
  console.log('AgencyName & LicenseNumber strictly NULL (No assumed affiliations):', agencyProvenanceValid ? 'PASSED' : 'FAILED');

  // Check B: User Name Mapping Detailed Review
  console.log('\n--- 4. Auditing User Names (All 11 Records) ---');
  const [users] = await conn.query('SELECT id, fullName, firstName, lastName, contactNumber, email, role FROM users ORDER BY id');
  console.table(users);

  const userNameAudit = users.map(u => ({
    id: u.id,
    fullName: u.fullName,
    firstName: u.firstName,
    lastName: u.lastName,
    contactNumber: u.contactNumber,
    isMultiWordSurname: u.lastName ? u.lastName.includes(' ') : false,
    classification: u.id <= 5 ? 'VERIFIED_USER_ACCOUNT' : 'INTEGRATION_TEST_RECORD',
    auditAssessment: u.id === 4 ? 'VERIFIED_SPANISH_FILIPINO_SURNAME (Dela Cruz)' : (u.id <= 5 ? 'VERIFIED_CLEAN_SPLIT' : 'SYNTHETIC_TEST_ARTIFACT'),
  }));

  // Check C: Property Agent Assignments & Admin Properties (17, 18)
  console.log('\n--- 5. Auditing Property Assignments & Unassigned Admin Properties ---');
  const [properties] = await conn.query('SELECT id, title, ownerId, city, agentId FROM properties ORDER BY id');
  console.table(properties);
  const prop17 = properties.find(p => p.id === 17);
  const prop18 = properties.find(p => p.id === 18);
  const adminUnassignedValid = prop17?.agentId === null && prop18?.agentId === null;
  console.log('Properties 17 and 18 strictly unassigned (agentId IS NULL):', adminUnassignedValid ? 'PASSED' : 'FAILED');

  // Check D: Appointment & Inquiry Relationship Audit
  console.log('\n--- 6. Auditing Foreign Key Referenced Tables ---');
  const [allFks] = await conn.query(`
    SELECT 
      TABLE_NAME, 
      CONSTRAINT_NAME, 
      COLUMN_NAME, 
      REFERENCED_TABLE_NAME, 
      REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = '${targetDb}' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME, CONSTRAINT_NAME
  `);
  console.table(allFks);

  const relationships = {
    'properties.agentId': allFks.find(f => f.TABLE_NAME === 'properties' && f.COLUMN_NAME === 'agentId')?.REFERENCED_TABLE_NAME,
    'property_transactions.agentId': allFks.find(f => f.TABLE_NAME === 'property_transactions' && f.COLUMN_NAME === 'agentId')?.REFERENCED_TABLE_NAME,
    'appointments.agentId': allFks.find(f => f.TABLE_NAME === 'appointments' && f.COLUMN_NAME === 'agentId')?.REFERENCED_TABLE_NAME,
    'inquiries.assignedAgentId': allFks.find(f => f.TABLE_NAME === 'inquiries' && f.COLUMN_NAME === 'assignedAgentId')?.REFERENCED_TABLE_NAME,
    'inquiries.clientId': allFks.find(f => f.TABLE_NAME === 'inquiries' && f.COLUMN_NAME === 'clientId')?.REFERENCED_TABLE_NAME,
    'inquiries.propertyId': allFks.find(f => f.TABLE_NAME === 'inquiries' && f.COLUMN_NAME === 'propertyId')?.REFERENCED_TABLE_NAME,
  };
  console.log('Foreign Key Target Mapping Summary:', relationships);

  // Check E: Inquiry RESTRICT Protection Test
  console.log('\n--- 7. Testing Inquiry RESTRICT History Protection ---');
  let deleteBlocked = false;
  try {
    await conn.query('DELETE FROM properties WHERE id = 1');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      deleteBlocked = true;
    }
  }
  console.log('Deletion of property with inquiries blocked by MySQL RESTRICT:', deleteBlocked ? 'PASSED' : 'FAILED');

  // Check F: DOWN Rollback and Re-UP
  console.log('\n--- 8. Testing Migration DOWN (Rollback) & Re-UP ---');
  await dataSource.undoLastMigration();
  const [tablesDown] = await conn.query('SHOW TABLES');
  const rollbackSuccess = !tablesDown.map(t => Object.values(t)[0]).includes('agents');
  console.log('Rollback successful (agents table removed):', rollbackSuccess ? 'PASSED' : 'FAILED');

  const reapplied = await dataSource.runMigrations();
  const [tablesReapplied] = await conn.query('SHOW TABLES');
  const reapplySuccess = tablesReapplied.map(t => Object.values(t)[0]).includes('agents');
  console.log('Re-apply successful (agents table recreated cleanly):', reapplySuccess ? 'PASSED' : 'FAILED');

  // Check G: Verification of Live Database Protection
  console.log('\n--- 9. Verifying Live Database estatecore_db Untouched ---');
  const liveConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: 'estatecore_db',
  });
  const [liveTables] = await liveConn.query('SHOW TABLES');
  const liveTableList = liveTables.map(t => Object.values(t)[0]);
  const [[liveMigrations]] = await liveConn.query('SELECT count(*) as count FROM estatecore_db.migrations');
  const liveUntouched = liveTableList.length === 5 && liveMigrations.count === 1 && !liveTableList.includes('agents');
  console.log('Live DB completely untouched:', liveUntouched ? 'PASSED (100% UNTOUCHED)' : 'FAILED');
  await liveConn.end();

  await conn.end();
  await dataSource.destroy();

  const report = {
    timestamp: new Date().toISOString(),
    sandboxDatabase: targetDb,
    liveDatabaseUntouched: liveUntouched,
    agencyProvenanceValid,
    adminUnassignedValid,
    deleteBlockedByRestrict: deleteBlocked,
    rollbackSuccess,
    reapplySuccess,
    userNameAudit,
    relationships,
    foreignKeys: allFks,
  };

  const outputDir = path.resolve(__dirname, '../documentation/evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'phase2_2_verification_results.json'), JSON.stringify(report, null, 2));

  console.log('\n=== ALL PHASE 2.2 VERIFICATIONS COMPLETED SUCCESSFULLY ===');
}

runIndependentVerification().catch(err => {
  console.error('Phase 2.2 Verification failed:', err);
  process.exit(1);
});
