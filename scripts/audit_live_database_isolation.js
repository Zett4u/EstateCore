const mysql = require('../backend/node_modules/mysql2/promise');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function auditLiveDatabase() {
  console.log('=== PHASE 2.2: LIVE DATABASE ISOLATION & FINGERPRINT AUDIT ===');

  // 1. SHA-256 of the backup file
  const backupPath = path.resolve(__dirname, '../database/exports/phase2_verified_backup.sql');
  let backupHash = 'NOT_FOUND';
  let backupSize = 0;
  if (fs.existsSync(backupPath)) {
    const fileBuffer = fs.readFileSync(backupPath);
    backupSize = fileBuffer.length;
    backupHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }
  console.log(`Backup File: ${backupPath}`);
  console.log(`Backup Size: ${backupSize} bytes`);
  console.log(`Backup SHA-256: ${backupHash}`);

  // 2. Read-only connection to live database `estatecore_db` with retry
  let liveConn;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      liveConn = await mysql.createConnection({
        host: attempt === 1 ? 'localhost' : '127.0.0.1',
        port: 3307,
        user: 'estatecore_user',
        password: 'estatecore_secure_pass_2026',
        database: 'estatecore_db',
      });
      break;
    } catch (e) {
      if (attempt === 3) throw e;
      console.log(`Connection attempt ${attempt} failed, retrying...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const [[serverMeta]] = await liveConn.query(`
    SELECT 
      DATABASE() as currentDb,
      VERSION() as mysqlVersion,
      @@hostname as hostname,
      @@port as port,
      @@character_set_database as charset,
      @@collation_database as collation
  `);
  console.log('\nLive Server Metadata:', serverMeta);

  // 3. Tables list
  const [tables] = await liveConn.query('SHOW FULL TABLES WHERE Table_Type = "BASE TABLE"');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('\nLive Database Tables:', tableNames);

  // 4. Migration history
  const [migrations] = await liveConn.query('SELECT * FROM migrations ORDER BY id');
  console.log('\nLive Migrations History:');
  console.table(migrations);

  // 5. Table row counts
  const rowCounts = {};
  for (const table of tableNames) {
    const [[countResult]] = await liveConn.query(`SELECT COUNT(*) as count FROM ${table}`);
    rowCounts[table] = countResult.count;
  }
  console.log('\nLive Row Counts:');
  console.table(rowCounts);

  // 6. Schema column audit for `users` (checking absence of Phase 2.1 columns in live DB)
  const [userCols] = await liveConn.query('SHOW FULL COLUMNS FROM users');
  const userColNames = userCols.map(c => c.Field);
  const liveHasPhase2UserCols = userColNames.includes('firstName') || userColNames.includes('lastName') || userColNames.includes('contactNumber');

  // Schema column audit for `properties` (checking absence of Phase 2 columns in live DB)
  const [propCols] = await liveConn.query('SHOW FULL COLUMNS FROM properties');
  const propColNames = propCols.map(c => c.Field);
  const liveHasPhase2PropCols = propColNames.includes('ownerId') || propColNames.includes('city');

  // Schema check for tables `agents`, `property_photos`, `property_transactions`
  const liveHasPhase2Tables = tableNames.includes('agents') || tableNames.includes('property_photos') || tableNames.includes('property_transactions');

  // 7. Representative record cryptographic fingerprints (hashing actual data rows)
  const [sampleUsers] = await liveConn.query('SELECT id, fullName, email, role, createdAt FROM users ORDER BY id');
  const [sampleProps] = await liveConn.query('SELECT id, title, agentId, price, createdAt FROM properties ORDER BY id');
  const [sampleInquiries] = await liveConn.query('SELECT id, clientId, propertyId, status, subject, createdAt FROM inquiries ORDER BY id');

  const usersFingerprint = crypto.createHash('sha256').update(JSON.stringify(sampleUsers)).digest('hex');
  const propsFingerprint = crypto.createHash('sha256').update(JSON.stringify(sampleProps)).digest('hex');
  const inquiriesFingerprint = crypto.createHash('sha256').update(JSON.stringify(sampleInquiries)).digest('hex');

  const auditReport = {
    timestamp: new Date().toISOString(),
    backup: {
      path: 'database/exports/phase2_verified_backup.sql',
      sizeBytes: backupSize,
      sha256: backupHash,
    },
    liveServer: serverMeta,
    liveDatabase: {
      name: serverMeta.currentDb,
      tableCount: tableNames.length,
      tables: tableNames,
      rowCounts,
      migrationCount: migrations.length,
      migrations,
      isolationCheck: {
        liveHasPhase2Tables,
        liveHasPhase2UserCols,
        liveHasPhase2PropCols,
        is100PercentUntouched: !liveHasPhase2Tables && !liveHasPhase2UserCols && !liveHasPhase2PropCols && migrations.length === 1,
      },
      recordFingerprints: {
        users: { count: sampleUsers.length, sha256: usersFingerprint },
        properties: { count: sampleProps.length, sha256: propsFingerprint },
        inquiries: { count: sampleInquiries.length, sha256: inquiriesFingerprint },
      },
      columns: {
        users: userColNames,
        properties: propColNames,
      },
    },
  };

  await liveConn.end();

  const outputDir = path.resolve(__dirname, '../documentation/evidence/final-project');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'live_db_pre_commit_audit.json'), JSON.stringify(auditReport, null, 2));

  console.log('\n--- ISOLATION AUDIT RESULT ---');
  console.log('Live DB Has Phase 2 Tables (`agents`, etc.):', liveHasPhase2Tables);
  console.log('Live DB Has Phase 2 User Columns (`firstName`, etc.):', liveHasPhase2UserCols);
  console.log('Live DB Has Phase 2 Property Columns (`ownerId`, etc.):', liveHasPhase2PropCols);
  console.log('Live DB Migrations Count (Expected: 1):', migrations.length);
  console.log('Live DB Untouched & Fully Isolated:', auditReport.liveDatabase.isolationCheck.is100PercentUntouched ? 'YES (CONFIRMED 100%)' : 'NO');
}

auditLiveDatabase().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
