const mysql = require('../backend/node_modules/mysql2/promise');
const { DataSource } = require('../backend/node_modules/typeorm');
const path = require('path');
const fs = require('fs');

async function runValidation() {
  console.log('=== PHASE 2.1 COMPREHENSIVE VALIDATION SUITE ===');
  const targetDb = 'estatecore_test_restore';

  const results = {
    timestamp: new Date().toISOString(),
    sandboxDatabase: targetDb,
    liveDatabaseProtected: false,
    upMigration: {},
    inquiryHistoryProtection: {},
    adminMappingCorrection: {},
    downMigrationRollback: {},
    reAppliedUpMigration: {},
    academicCompliance: {},
    persistence: {},
  };

  // Step 1: Initialize TypeORM DataSource targeting sandbox
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

  // Step 2: Run UP Migration
  console.log('\n--- Step 2: Executing Migration UP on Sandbox ---');
  const applied = await dataSource.runMigrations();
  console.log(`Applied migrations: ${applied.map(m => m.name).join(', ')}`);
  results.upMigration.appliedCount = applied.length;

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
  });

  // Check 1: User firstName, lastName, contactNumber
  const [users] = await conn.query('SELECT id, fullName, firstName, lastName, contactNumber, email, role FROM users ORDER BY id');
  console.log('\nUsers table after UP migration:');
  console.table(users);
  const userCheckPassed = users.every(u => {
    if (u.fullName === 'System Administrator') return u.firstName === 'System' && u.lastName === 'Administrator';
    if (u.fullName === 'Maria Santos') return u.firstName === 'Maria' && u.lastName === 'Santos';
    if (u.fullName === 'Carlos Reyes') return u.firstName === 'Carlos' && u.lastName === 'Reyes';
    if (u.fullName === 'Juan Dela Cruz') return u.firstName === 'Juan' && u.lastName === 'Dela Cruz';
    if (u.fullName === 'Elena Roxas') return u.firstName === 'Elena' && u.lastName === 'Roxas';
    return u.firstName !== null;
  }) && users.every(u => u.contactNumber === null); // No fabricated phone numbers
  results.academicCompliance.users = {
    passed: userCheckPassed,
    sampleUsers: users.slice(0, 5),
  };
  console.log('User firstName/lastName/contactNumber check:', userCheckPassed ? 'PASSED' : 'FAILED');

  // Check 2: Properties agent assignment (CRITICAL: Properties 17 and 18 MUST have agentId = NULL)
  const [properties] = await conn.query('SELECT id, title, ownerId, city, agentId FROM properties ORDER BY id');
  console.log('\nProperties table after UP migration:');
  console.table(properties);

  const prop17 = properties.find(p => p.id === 17);
  const prop18 = properties.find(p => p.id === 18);
  const prop1to6 = properties.filter(p => p.id <= 6);

  const adminMappingCorrect = prop17?.agentId === null && prop18?.agentId === null;
  const standardAgentMappingCorrect = 
    properties.find(p => p.id === 1)?.agentId === 1 &&
    properties.find(p => p.id === 2)?.agentId === 1 &&
    properties.find(p => p.id === 3)?.agentId === 2 &&
    properties.find(p => p.id === 4)?.agentId === 2 &&
    properties.find(p => p.id === 5)?.agentId === 1 &&
    properties.find(p => p.id === 6)?.agentId === 2;

  results.adminMappingCorrection = {
    passed: adminMappingCorrect && standardAgentMappingCorrect,
    property17AgentId: prop17?.agentId,
    property18AgentId: prop18?.agentId,
    adminAssignmentCleanedToNull: adminMappingCorrect,
    validAgentAssignmentsPreserved: standardAgentMappingCorrect,
  };
  console.log('Admin-to-Agent mapping correction check (props 17/18 agentId === NULL):', adminMappingCorrect ? 'PASSED' : 'FAILED');
  console.log('Standard agent assignments (props 1..6):', standardAgentMappingCorrect ? 'PASSED' : 'FAILED');

  // Check 3: Inquiry history protection (Foreign keys must be ON DELETE RESTRICT)
  const [inquiryFks] = await conn.query(`
    SELECT CONSTRAINT_NAME, TABLE_NAME, REFERENCED_TABLE_NAME, DELETE_RULE
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = '${targetDb}' AND TABLE_NAME = 'inquiries'
  `);
  console.log('\nInquiry foreign key deletion rules:');
  console.table(inquiryFks);

  const clientFkRule = inquiryFks.find(f => f.CONSTRAINT_NAME === 'FK_inquiries_clientId')?.DELETE_RULE;
  const propertyFkRule = inquiryFks.find(f => f.CONSTRAINT_NAME === 'FK_inquiries_propertyId')?.DELETE_RULE;

  // Test actual RESTRICT enforcement: try to delete Property 1 (which has inquiries)
  let deleteBlocked = false;
  try {
    await conn.query('DELETE FROM properties WHERE id = 1');
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      deleteBlocked = true;
      console.log('Verified: MySQL RESTRICT prevented deletion of property with inquiries! (Error:', err.code, ')');
    }
  }

  results.inquiryHistoryProtection = {
    passed: clientFkRule === 'RESTRICT' && propertyFkRule === 'RESTRICT' && deleteBlocked,
    clientFkDeleteRule: clientFkRule,
    propertyFkDeleteRule: propertyFkRule,
    deletionBlockedByRestrict: deleteBlocked,
  };
  console.log('Inquiry history protection check:', results.inquiryHistoryProtection.passed ? 'PASSED' : 'FAILED');

  // Step 3: Test Rollback (DOWN migration)
  console.log('\n--- Step 3: Testing Migration DOWN (Rollback) ---');
  await dataSource.undoLastMigration();
  console.log('Migration reverted.');

  const [tablesAfterDown] = await conn.query('SHOW TABLES');
  const tableListAfterDown = tablesAfterDown.map(t => Object.values(t)[0]);
  const [usersColsAfterDown] = await conn.query('SHOW COLUMNS FROM users');
  const userColNamesAfterDown = usersColsAfterDown.map(c => c.Field);

  const rollbackPassed = 
    !tableListAfterDown.includes('agents') &&
    !tableListAfterDown.includes('property_photos') &&
    !tableListAfterDown.includes('property_transactions') &&
    !userColNamesAfterDown.includes('firstName') &&
    !userColNamesAfterDown.includes('lastName') &&
    !userColNamesAfterDown.includes('contactNumber');

  results.downMigrationRollback = {
    passed: rollbackPassed,
    tablesRemaining: tableListAfterDown,
    usersColsRemaining: userColNamesAfterDown,
  };
  console.log('Rollback test check:', rollbackPassed ? 'PASSED' : 'FAILED');

  // Step 4: Re-apply Migration UP
  console.log('\n--- Step 4: Re-applying Migration UP (Idempotency Check) ---');
  const reapplied = await dataSource.runMigrations();
  console.log(`Re-applied migrations: ${reapplied.map(m => m.name).join(', ')}`);

  const [tablesAfterReapply] = await conn.query('SHOW TABLES');
  const tableListAfterReapply = tablesAfterReapply.map(t => Object.values(t)[0]);
  const reapplyPassed = reapplied.length === 1 && tableListAfterReapply.includes('agents');
  results.reAppliedUpMigration = {
    passed: reapplyPassed,
    appliedCount: reapplied.length,
    tables: tableListAfterReapply,
  };
  console.log('Re-apply idempotency check:', reapplyPassed ? 'PASSED' : 'FAILED');

  // Step 5: Test Persistence in Sandbox (Agent, Photo, Transaction)
  console.log('\n--- Step 5: Testing Sandbox Entity Persistence ---');
  const [insertedPhoto] = await conn.query(`
    INSERT INTO property_photos (propertyId, filePath, isPrimary, caption)
    VALUES (1, '/uploads/properties/bgc_condo_balcony.jpg', 1, 'Scenic Balcony')
  `);
  const photoId = insertedPhoto.insertId;

  const [insertedTx] = await conn.query(`
    INSERT INTO property_transactions (propertyId, buyerId, agentId, amount, transactionType, paymentMethod, status, transactionDate, notes)
    VALUES (1, 4, 1, 18500000.00, 'SALE', 'BANK_TRANSFER', 'COMPLETED', '2026-11-25', 'Phase 2.1 verified transaction')
  `);
  const txId = insertedTx.insertId;

  // Query back
  const [[queriedPhoto]] = await conn.query('SELECT * FROM property_photos WHERE id = ?', [photoId]);
  const [[queriedTx]] = await conn.query('SELECT * FROM property_transactions WHERE id = ?', [txId]);

  results.persistence = {
    passed: queriedPhoto !== undefined && queriedTx !== undefined && Number(queriedTx.amount) === 18500000.00,
    photoPersisted: queriedPhoto?.filePath === '/uploads/properties/bgc_condo_balcony.jpg',
    txPersisted: queriedTx?.status === 'COMPLETED',
  };
  console.log('Sandbox persistence check:', results.persistence.passed ? 'PASSED' : 'FAILED');

  // Step 6: Verify Live Database Safety (estatecore_db)
  console.log('\n--- Step 6: Verifying Live Database Untouched ---');
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
  const [liveUserCols] = await liveConn.query('SHOW COLUMNS FROM estatecore_db.users');
  const liveUserColNames = liveUserCols.map(c => c.Field);

  const liveDbUntouched = 
    liveTableList.length === 5 &&
    liveMigrations.count === 1 &&
    !liveTableList.includes('agents') &&
    !liveUserColNames.includes('firstName');

  results.liveDatabaseProtected = liveDbUntouched;
  console.log('Live database untouched:', liveDbUntouched ? 'PASSED (100% UNTOUCHED)' : 'FAILED');

  await liveConn.end();
  await conn.end();
  await dataSource.destroy();

  // Save evidence
  const outputDir = path.resolve(__dirname, '../documentation/evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'phase2_1_correction_results.json'), JSON.stringify(results, null, 2));

  console.log('\n=== ALL PHASE 2.1 VALIDATION SCENARIOS COMPLETED ===');
}

runValidation().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
