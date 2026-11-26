const mysql = require('../backend/node_modules/mysql2/promise');
const bcrypt = require('../backend/node_modules/bcryptjs');
const fs = require('fs');
const path = require('path');

async function testAuthAndSchema() {
  console.log('=== PHASE 2.1 AUTH & SCHEMA VERIFICATION ===');
  const targetDb = 'estatecore_test_restore';

  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
  });

  const results = {
    timestamp: new Date().toISOString(),
    authChecks: {},
    fkConstraints: {},
    academicCompliance: {},
  };

  // 1. Test Bcrypt Authentication on Existing Accounts
  console.log('\n--- 1. Testing Bcrypt Password Verification ---');
  const [users] = await conn.query('SELECT id, email, password, fullName, role FROM users WHERE id IN (1, 2, 4)');

  const testAccounts = [
    { email: 'admin@estatecore.local', expectedPass: 'Password123!', role: 'ADMIN' },
    { email: 'maria.santos@estatecore.local', expectedPass: 'Password123!', role: 'AGENT' },
    { email: 'juan.delacruz@client.local', expectedPass: 'Password123!', role: 'CLIENT' },
  ];

  for (const acc of testAccounts) {
    const user = users.find(u => u.email === acc.email);
    if (!user) {
      console.error(`User ${acc.email} not found!`);
      continue;
    }
    const match = await bcrypt.compare(acc.expectedPass, user.password);
    console.log(`Password check for ${acc.role} (${acc.email}):`, match ? 'VALID HASH (MATCH)' : 'FAILED');
    results.authChecks[acc.role] = {
      email: acc.email,
      hashPreserved: match,
    };
  }

  // 2. Test Foreign Key Rejections (Referential Integrity)
  console.log('\n--- 2. Testing Foreign Key Rejection on Invalid References ---');
  let invalidAgentRejected = false;
  try {
    // Try to assign property to non-existent agent ID 99999
    await conn.query('INSERT INTO properties (title, description, propertyType, listingType, price, location, address, agentId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Invalid Agent Property', 'Test', 'HOUSE', 'SALE', 1000000, 'Makati', 'Test Address', 99999]);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      invalidAgentRejected = true;
      console.log('Verified: MySQL rejected property insertion with invalid agentId 99999 (Error: ER_NO_REFERENCED_ROW_2)');
    }
  }

  let invalidOwnerRejected = false;
  try {
    // Try to assign property to non-existent owner ID 99999
    await conn.query('INSERT INTO properties (title, description, propertyType, listingType, price, location, address, ownerId) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['Invalid Owner Property', 'Test', 'HOUSE', 'SALE', 1000000, 'Makati', 'Test Address', 99999]);
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      invalidOwnerRejected = true;
      console.log('Verified: MySQL rejected property insertion with invalid ownerId 99999 (Error: ER_NO_REFERENCED_ROW_2)');
    }
  }

  results.fkConstraints = {
    invalidAgentRejected,
    invalidOwnerRejected,
  };

  // 3. Generate Schema Comparison Evidence
  console.log('\n--- 3. Capturing Academic Schema Comparison ---');
  const [tables] = await conn.query('SHOW TABLES');
  const schemaReport = {
    timestamp: new Date().toISOString(),
    database: targetDb,
    tables: {},
  };

  for (const row of tables) {
    const tableName = Object.values(row)[0];
    const [cols] = await conn.query(`SHOW FULL COLUMNS FROM ${tableName}`);
    const [keys] = await conn.query(`SHOW INDEXES FROM ${tableName}`);
    const [fks] = await conn.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${targetDb}' AND TABLE_NAME = '${tableName}' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    schemaReport.tables[tableName] = {
      columnCount: cols.length,
      columns: cols.map(c => ({
        name: c.Field,
        type: c.Type,
        nullable: c.Null === 'YES',
        key: c.Key,
        default: c.Default,
      })),
      indexCount: keys.length,
      foreignKeyCount: fks.length,
      foreignKeys: fks,
    };
  }

  const outputDir = path.resolve(__dirname, '../documentation/evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'phase2_1_schema_comparison.json'), JSON.stringify(schemaReport, null, 2));
  console.log('Schema comparison evidence written to documentation/evidence/phase2_1_schema_comparison.json');

  await conn.end();
  console.log('=== AUTH & SCHEMA VERIFICATION COMPLETE ===');
}

testAuthAndSchema().catch(err => {
  console.error(err);
  process.exit(1);
});
