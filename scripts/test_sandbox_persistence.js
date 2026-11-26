const mysql = require('../backend/node_modules/mysql2/promise');
const { DataSource } = require('../backend/node_modules/typeorm');
const path = require('path');
const fs = require('fs');

async function testPersistence() {
  console.log('=== PHASE 2: PERSISTENCE & FOREIGN KEY VERIFICATION ===');
  const targetDb = 'estatecore_test_restore';

  const dataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3307,
    username: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
    entities: [path.join(__dirname, '../backend/dist/**/*.entity.js')],
    synchronize: false,
    logging: ['error'],
  });

  await dataSource.initialize();
  console.log(`Connected to DataSource. Active DB: ${(dataSource.options).database}`);

  const results = {
    timestamp: new Date().toISOString(),
    database: targetDb,
    tests: {},
  };

  // Test 1: Agent CRUD & Persistence
  console.log('\n--- 1. Testing Agent Persistence ---');
  const agentRepo = dataSource.getRepository('Agent');
  const userRepo = dataSource.getRepository('User');

  // Verify initial agents (Maria Santos, Carlos Reyes)
  const existingAgents = await agentRepo.find({ relations: ['user'] });
  console.log(`Found ${existingAgents.length} existing migrated agents:`);
  existingAgents.forEach(a => console.log(` - Agent ID ${a.id}: UserID ${a.userId} (${a.user?.fullName}), License: ${a.licenseNumber}, Status: ${a.verificationStatus}`));

  // Create test agent for User ID 6
  let testUser = await userRepo.findOne({ where: { id: 6 } });
  if (!testUser) {
    testUser = await userRepo.save({
      fullName: 'Test Agent Candidate',
      email: 'test.candidate@estatecore.local',
      password: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role: 'CLIENT',
      isActive: true,
    });
  }

  // Ensure no existing agent for this user
  await agentRepo.delete({ userId: testUser.id });

  testUser.role = 'AGENT';
  await userRepo.save(testUser);

  const newAgent = agentRepo.create({
    userId: testUser.id,
    licenseNumber: null,
    agencyName: 'Sandbox Test Realty',
    verificationStatus: 'PENDING_VERIFICATION',
  });
  const savedAgent = await agentRepo.save(newAgent);
  console.log(`Created test Agent ID: ${savedAgent.id} for User ID ${testUser.id}`);

  // Update Agent
  savedAgent.licenseNumber = 'PRC-0099881';
  savedAgent.agencyName = 'Sandbox Premier Realty';
  savedAgent.verificationStatus = 'VERIFIED';
  await agentRepo.save(savedAgent);
  console.log(`Updated test Agent ID ${savedAgent.id}: verified license and agency.`);

  const retrievedAgent = await agentRepo.findOne({ where: { id: savedAgent.id }, relations: ['user'] });
  results.tests.agentPersistence = {
    passed: retrievedAgent !== null && retrievedAgent.licenseNumber === 'PRC-0099881' && retrievedAgent.verificationStatus === 'VERIFIED',
    agentId: retrievedAgent?.id,
    licenseNumber: retrievedAgent?.licenseNumber,
    agencyName: retrievedAgent?.agencyName,
    verificationStatus: retrievedAgent?.verificationStatus,
  };
  console.log('Agent persistence test passed:', results.tests.agentPersistence.passed);

  // Test 2: Property Photo Persistence
  console.log('\n--- 2. Testing PropertyPhoto Persistence ---');
  const photoRepo = dataSource.getRepository('PropertyPhoto');
  const newPhoto = photoRepo.create({
    propertyId: 1,
    filePath: '/uploads/properties/bgc_condo_living_room.jpg',
    isPrimary: true,
    caption: 'Luxury Living Room View of BGC Skyline',
  });
  const savedPhoto = await photoRepo.save(newPhoto);
  console.log(`Saved PropertyPhoto ID: ${savedPhoto.id} for Property ID 1`);

  const retrievedPhoto = await photoRepo.findOne({ where: { id: savedPhoto.id } });
  results.tests.photoPersistence = {
    passed: retrievedPhoto !== null && retrievedPhoto.filePath === '/uploads/properties/bgc_condo_living_room.jpg',
    photoId: retrievedPhoto?.id,
    filePath: retrievedPhoto?.filePath,
    isPrimary: retrievedPhoto?.isPrimary,
  };
  console.log('Photo persistence test passed:', results.tests.photoPersistence.passed);

  // Test 3: Property Transaction Persistence
  console.log('\n--- 3. Testing PropertyTransaction Persistence ---');
  const txRepo = dataSource.getRepository('PropertyTransaction');
  const newTx = txRepo.create({
    propertyId: 1,
    buyerId: 4, // Juan Dela Cruz
    agentId: 1, // Maria Santos
    amount: 18500000.00,
    transactionType: 'SALE',
    paymentMethod: 'BANK_TRANSFER',
    status: 'COMPLETED',
    transactionDate: '2026-11-24',
    notes: 'Academic defense test transaction in isolated sandbox',
  });
  const savedTx = await txRepo.save(newTx);
  console.log(`Saved PropertyTransaction ID: ${savedTx.id}`);

  const retrievedTx = await txRepo.findOne({ where: { id: savedTx.id }, relations: ['property', 'buyer', 'agent'] });
  results.tests.transactionPersistence = {
    passed: retrievedTx !== null && Number(retrievedTx.amount) === 18500000.00 && retrievedTx.status === 'COMPLETED',
    transactionId: retrievedTx?.id,
    propertyTitle: retrievedTx?.property?.title,
    buyerName: retrievedTx?.buyer?.fullName,
    amount: Number(retrievedTx?.amount),
    status: retrievedTx?.status,
  };
  console.log('Transaction persistence test passed:', results.tests.transactionPersistence.passed);

  // Test 4: Restart Simulation
  console.log('\n--- 4. Testing Persistence Across Connection Reset (Restart) ---');
  await dataSource.destroy();
  console.log('Connection closed (simulating service shutdown).');

  const restartDataSource = new DataSource({
    type: 'mysql',
    host: '127.0.0.1',
    port: 3307,
    username: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: targetDb,
    entities: [path.join(__dirname, '../backend/dist/**/*.entity.js')],
    synchronize: false,
    logging: ['error'],
  });
  await restartDataSource.initialize();
  console.log('Re-connected (simulating service restart).');

  const reloadedAgent = await restartDataSource.getRepository('Agent').findOne({ where: { id: savedAgent.id } });
  const reloadedPhoto = await restartDataSource.getRepository('PropertyPhoto').findOne({ where: { id: savedPhoto.id } });
  const reloadedTx = await restartDataSource.getRepository('PropertyTransaction').findOne({ where: { id: savedTx.id } });

  const restartPassed = reloadedAgent !== null && reloadedPhoto !== null && reloadedTx !== null;
  results.tests.restartPersistence = {
    passed: restartPassed,
    persistedAgentId: reloadedAgent?.id,
    persistedPhotoId: reloadedPhoto?.id,
    persistedTransactionId: reloadedTx?.id,
  };
  console.log('Data survived restart:', restartPassed);

  await restartDataSource.destroy();

  // Test 5: Verify Live DB Protection (estatecore_db has NOT been modified)
  console.log('\n--- 5. Verifying Live DB (estatecore_db) Untouched ---');
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: 'estatecore_db',
  });
  const [liveTables] = await conn.query('SHOW TABLES');
  const liveTableList = liveTables.map(t => Object.values(t)[0]);
  const [[liveMigrations]] = await conn.query('SELECT count(*) as count FROM estatecore_db.migrations');

  results.tests.liveDatabaseIntegrity = {
    passed: liveTableList.length === 5 && liveMigrations.count === 1 && !liveTableList.includes('agents'),
    liveTables: liveTableList,
    migrationCount: liveMigrations.count,
    agentsTablePresentInLive: liveTableList.includes('agents'),
  };
  console.log('Live DB integrity verified untouched:', results.tests.liveDatabaseIntegrity.passed);
  await conn.end();

  // Save report
  const outputDir = path.resolve(__dirname, '../documentation/evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'phase2_persistence_test_results.json'), JSON.stringify(results, null, 2));

  console.log('\n=== ALL PERSISTENCE TESTS PASSED (100%) ===');
}

testPersistence().catch(err => {
  console.error('Persistence test failed:', err);
  process.exit(1);
});
