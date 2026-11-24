const mysql = require('../backend/node_modules/mysql2/promise');
const { DataSource } = require('../backend/node_modules/typeorm');
const path = require('path');

async function runSandboxMigration() {
  console.log('=== PHASE 2: SANDBOX MIGRATION EXECUTION ===');

  // Verify connection target
  const targetDb = 'estatecore_test_restore';
  console.log(`Targeting sandbox database: ${targetDb}`);

  if (targetDb === 'estatecore_db') {
    throw new Error('FATAL: Aborting! Cannot run against live database estatecore_db!');
  }

  const sandboxDataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3307,
    username: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
    entities: [path.join(__dirname, '../backend/dist/**/*.entity.js')],
    migrations: [path.join(__dirname, '../backend/dist/database/migrations/*.js')],
    synchronize: false,
    logging: ['error', 'warn', 'schema', 'migration'],
  });

  await sandboxDataSource.initialize();
  console.log(`Connected to DataSource. Active DB: ${(sandboxDataSource.options).database}`);

  if ((sandboxDataSource.options).database !== targetDb) {
    throw new Error(`CRITICAL GUARD: DataSource pointed to unexpected database: ${(sandboxDataSource.options).database}`);
  }

  console.log('Running pending migrations on sandbox...');
  const appliedMigrations = await sandboxDataSource.runMigrations();
  console.log(`Migrations successfully applied: ${appliedMigrations.length}`);
  appliedMigrations.forEach(m => console.log(` - ${m.name}`));

  await sandboxDataSource.destroy();

  // Verification via raw MySQL
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
  });

  const [tables] = await conn.query('SHOW TABLES');
  const tableNames = tables.map(t => Object.values(t)[0]);
  console.log('\nSandbox tables after migration:', tableNames);

  const [agents] = await conn.query('SELECT * FROM agents');
  console.log('\nCreated Agent records in sandbox:');
  console.table(agents);

  const [properties] = await conn.query('SELECT id, title, ownerId, city, agentId FROM properties');
  console.log('\nUpdated Property records in sandbox:');
  console.table(properties);

  const [inquiries] = await conn.query('SELECT id, inquiryType, offerAmount, legacyStatus, status FROM inquiries');
  console.log('\nEnhanced Inquiries in sandbox:');
  console.table(inquiries);

  await conn.end();
}

runSandboxMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
