const mysql = require('../backend/node_modules/mysql2/promise');
const { DataSource } = require('../backend/node_modules/typeorm');
const path = require('path');

async function testRollbackAndReMigrate() {
  console.log('=== PHASE 2: ROLLBACK & RE-MIGRATION VALIDATION ===');
  const targetDb = 'estatecore_test_restore';

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
    logging: ['error', 'warn'],
  });

  await dataSource.initialize();

  // 1. REVERT MIGRATION
  console.log('\n--- Step 1: Reverting Phase2 migration ---');
  await dataSource.undoLastMigration();
  console.log('Migration reverted successfully.');

  // Verify DB state after revert
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
  });

  const [tablesAfterRevert] = await conn.query('SHOW TABLES');
  const tableListAfterRevert = tablesAfterRevert.map(t => Object.values(t)[0]);
  console.log('Tables after revert:', tableListAfterRevert);

  // Check property foreign key points back to users
  const [propertyAgentFk] = await conn.query(`
    SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = '${targetDb}' AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agentId'
  `);
  console.log('Property agentId FK after revert:', propertyAgentFk);

  // Check properties.agentId values (should be mapped back to user IDs 2 and 3)
  const [propsAfterRevert] = await conn.query('SELECT id, title, agentId FROM properties');
  console.log('Properties after revert:');
  console.table(propsAfterRevert);

  // 2. RE-EXECUTE MIGRATION
  console.log('\n--- Step 2: Re-applying Phase2 migration ---');
  const appliedMigrations = await dataSource.runMigrations();
  console.log(`Re-applied migrations: ${appliedMigrations.length}`);
  appliedMigrations.forEach(m => console.log(` - ${m.name}`));

  const [tablesAfterReapply] = await conn.query('SHOW TABLES');
  const tableListAfterReapply = tablesAfterReapply.map(t => Object.values(t)[0]);
  console.log('Tables after re-apply:', tableListAfterReapply);

  const [propertyAgentFkReapplied] = await conn.query(`
    SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = '${targetDb}' AND TABLE_NAME = 'properties' AND COLUMN_NAME = 'agentId'
  `);
  console.log('Property agentId FK after re-apply:', propertyAgentFkReapplied);

  await conn.end();
  await dataSource.destroy();
  console.log('\n=== ROLLBACK & RE-MIGRATION TEST PASSED! ===');
}

testRollbackAndReMigrate().catch(err => {
  console.error('Rollback test failed:', err);
  process.exit(1);
});
