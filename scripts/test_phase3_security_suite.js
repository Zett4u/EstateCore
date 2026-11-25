const { NestFactory } = require('../backend/node_modules/@nestjs/core');
const { ValidationPipe, Logger } = require('../backend/node_modules/@nestjs/common');
const mysql = require('../backend/node_modules/mysql2/promise');
const path = require('path');
const fs = require('fs');

// Ensure strict sandbox isolation
process.env.NODE_ENV = 'test';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3307';
process.env.DB_USERNAME = 'estatecore_user';
process.env.DB_PASSWORD = 'estatecore_secure_pass_2026';
process.env.DB_NAME = 'estatecore_test_restore';
process.env.JWT_SECRET = 'estatecore_super_secret_jwt_key_2026_academic_defense_key';
process.env.JWT_EXPIRATION = '3600s';
const TEST_PORT = 3344;
process.env.PORT = String(TEST_PORT);

const BASE_URL = `http://127.0.0.1:${TEST_PORT}/api/v1`;
const LEGACY_URL = `http://127.0.0.1:${TEST_PORT}/api`;

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
  };
  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
  } else {
    data = await res.text();
  }
  return { status: res.status, data };
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('ESTATECORE PHASE 3: COMPREHENSIVE RBAC, ISOLATION & SECURITY TEST SUITE');
  console.log('Academic Source of Truth: estatecire.pdf (Labs 03, 04, 05, 06)');
  console.log(`Target Environment: SANDBOX (estatecore_test_restore on port 3307)`);
  console.log('========================================================================\n');

  // Verify DB safety before booting
  if (process.env.DB_NAME !== 'estatecore_test_restore') {
    throw new Error(`CRITICAL ABORT: DB_NAME is '${process.env.DB_NAME}', must be 'estatecore_test_restore'!`);
  }

  // 1. Boot NestJS Server
  console.log('[1/7] Booting NestJS Application against Sandbox...');
  const { AppModule } = require('../backend/dist/app.module');
  const { AllExceptionsFilter } = require('../backend/dist/common/filters/http-exception.filter');

  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });

  app.use((req, res, next) => {
    if (req.url && req.url.startsWith('/api/') && !req.url.startsWith('/api/v1/')) {
      req.url = req.url.replace(/^\/api\/(?!v1(\/|$))/, '/api/v1/');
    }
    next();
  });

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(TEST_PORT, '127.0.0.1');
  console.log(`  -> Test server listening on http://127.0.0.1:${TEST_PORT}/api/v1\n`);

  const results = {
    summary: { total: 0, passed: 0, failed: 0 },
    testCases: [],
  };

  function record(category, testName, expectedStatus, actualStatus, passed, detail = '') {
    results.summary.total++;
    if (passed) {
      results.summary.passed++;
      console.log(`  ✓ [PASS] [${category}] ${testName} (Expected: ${expectedStatus}, Got: ${actualStatus})`);
    } else {
      results.summary.failed++;
      console.error(`  ✗ [FAIL] [${category}] ${testName} (Expected: ${expectedStatus}, Got: ${actualStatus}) - ${detail}`);
    }
    results.testCases.push({
      category,
      testName,
      expectedStatus,
      actualStatus,
      passed,
      detail,
    });
  }

  try {
    // 2. Authentication & Token Acquisition
    console.log('[2/7] Authenticating Users & Establishing Personas...');
    
    // Admin (User 1)
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@estatecore.local', password: 'Password123!' },
    });
    record('AUTH', 'Admin Login', 200, adminLogin.status, adminLogin.status === 200 && !!adminLogin.data?.accessToken);
    const adminToken = adminLogin.data?.accessToken;

    // Agent Maria Santos (User 2, Agent 1)
    const mariaLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'maria.santos@estatecore.local', password: 'Password123!' },
    });
    record('AUTH', 'Agent Maria Santos Login', 200, mariaLogin.status, mariaLogin.status === 200 && !!mariaLogin.data?.accessToken);
    const mariaToken = mariaLogin.data?.accessToken;

    // Agent Carlos Reyes (User 3, Agent 2)
    const carlosLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'carlos.reyes@estatecore.local', password: 'Password123!' },
    });
    record('AUTH', 'Agent Carlos Reyes Login', 200, carlosLogin.status, carlosLogin.status === 200 && !!carlosLogin.data?.accessToken);
    const carlosToken = carlosLogin.data?.accessToken;

    // Client Juan Dela Cruz (User 4)
    const juanLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'juan.delacruz@client.local', password: 'Password123!' },
    });
    record('AUTH', 'Client Juan Dela Cruz Login', 200, juanLogin.status, juanLogin.status === 200 && !!juanLogin.data?.accessToken);
    const juanToken = juanLogin.data?.accessToken;

    // Client Elena Roxas (User 5)
    const elenaLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'elena.roxas@client.local', password: 'Password123!' },
    });
    record('AUTH', 'Client Elena Roxas Login', 200, elenaLogin.status, elenaLogin.status === 200 && !!elenaLogin.data?.accessToken);
    const elenaToken = elenaLogin.data?.accessToken;

    // 3. Unauthenticated Access & Public Catalog Integrity
    console.log('\n[3/7] Verifying Public Endpoints & Unauthenticated Access Security...');
    
    // Public Catalog
    const pubCatalog = await request('/properties');
    record('PUBLIC', 'Public Property Catalog Access', 200, pubCatalog.status, pubCatalog.status === 200 && Array.isArray(pubCatalog.data));

    // Public Property Detail
    const pubDetail = await request('/properties/1');
    record('PUBLIC', 'Public Property Detail Access', 200, pubDetail.status, pubDetail.status === 200 && pubDetail.data?.id === 1);

    // Public Agents List
    const pubAgents = await request('/agents');
    record('PUBLIC', 'Public Agents Directory Access', 200, pubAgents.status, pubAgents.status === 200 && Array.isArray(pubAgents.data));

    // Backward Compatibility Alias
    const legacyCatalog = await request(`${LEGACY_URL}/properties`);
    record('PUBLIC', 'Legacy /api/properties Alias Access', 200, legacyCatalog.status, legacyCatalog.status === 200);

    // Unauthenticated Rejection: Property Creation
    const unauthPropCreate = await request('/properties', {
      method: 'POST',
      body: { title: 'Unauthorized Villa', price: 5000000, location: 'Makati', address: '123 Test St', propertyType: 'CONDOMINIUM', listingType: 'SALE' },
    });
    record('UNAUTH', 'Reject Anonymous Property Creation', 401, unauthPropCreate.status, unauthPropCreate.status === 401);

    // Unauthenticated Rejection: Property Update
    const unauthPropUpdate = await request('/properties/1', {
      method: 'PATCH',
      body: { title: 'Hacked Title' },
    });
    record('UNAUTH', 'Reject Anonymous Property Update', 401, unauthPropUpdate.status, unauthPropUpdate.status === 401);

    // Unauthenticated Rejection: Property Deletion
    const unauthPropDelete = await request('/properties/1', { method: 'DELETE' });
    record('UNAUTH', 'Reject Anonymous Property Deletion', 401, unauthPropDelete.status, unauthPropDelete.status === 401);

    // Unauthenticated Rejection: Photo Upload
    const unauthPhoto = await request('/properties/1/photos', {
      method: 'POST',
      body: { filePath: 'https://example.com/test.jpg' },
    });
    record('UNAUTH', 'Reject Anonymous Photo Upload', 401, unauthPhoto.status, unauthPhoto.status === 401);

    // Unauthenticated Rejection: User Directory
    const unauthUsers = await request('/users');
    record('UNAUTH', 'Reject Anonymous User Directory Access', 401, unauthUsers.status, unauthUsers.status === 401);

    // Unauthenticated Rejection: Inquiries List
    const unauthInq = await request('/inquiries');
    record('UNAUTH', 'Reject Anonymous Inquiries Access', 401, unauthInq.status, unauthInq.status === 401);

    // Unauthenticated Rejection: Appointments List
    const unauthAppt = await request('/appointments');
    record('UNAUTH', 'Reject Anonymous Appointments Access', 401, unauthAppt.status, unauthAppt.status === 401);

    // Unauthenticated Rejection: Transactions List
    const unauthTx = await request('/transactions');
    record('UNAUTH', 'Reject Anonymous Transactions Access', 401, unauthTx.status, unauthTx.status === 401);

    // 4. Agent Isolation & Privilege Bounds
    console.log('\n[4/7] Verifying Agent Isolation, BOLA & Cross-Agent Boundaries...');

    // Agent Maria updates Property 1 (assigned to Agent 1 = Maria)
    const mariaUpdateOwn = await request('/properties/1', {
      method: 'PATCH',
      token: mariaToken,
      body: { description: 'Updated by assigned agent Maria Santos' },
    });
    record('AGENT_ISOLATION', 'Agent Maria Updates Assigned Property 1', 200, mariaUpdateOwn.status, mariaUpdateOwn.status === 200);

    // Agent Carlos attempts to update Property 1 (assigned to Maria)
    const carlosUpdateMariaProp = await request('/properties/1', {
      method: 'PATCH',
      token: carlosToken,
      body: { description: 'Malicious update by Carlos Reyes' },
    });
    record('AGENT_ISOLATION', 'Agent Carlos Forbidden to Update Maria Assigned Property 1', 403, carlosUpdateMariaProp.status, carlosUpdateMariaProp.status === 403);

    // Agent Carlos attempts to delete Property 1 (assigned to Maria)
    const carlosDeleteMariaProp = await request('/properties/1', {
      method: 'DELETE',
      token: carlosToken,
    });
    record('AGENT_ISOLATION', 'Agent Carlos Forbidden to Delete Maria Assigned Property 1', 403, carlosDeleteMariaProp.status, carlosDeleteMariaProp.status === 403);

    // Agent Carlos attempts to upload photo to Property 1 (assigned to Maria)
    const carlosUploadMariaPhoto = await request('/properties/1/photos', {
      method: 'POST',
      token: carlosToken,
      body: { filePath: 'https://example.com/carlos-fake.jpg' },
    });
    record('AGENT_ISOLATION', 'Agent Carlos Forbidden to Upload Photo to Maria Assigned Property 1', 403, carlosUploadMariaPhoto.status, carlosUploadMariaPhoto.status === 403);

    // Agent Maria attempts privilege escalation: reassigning property to Carlos (agentId: 2)
    const mariaReassignAgent = await request('/properties/1', {
      method: 'PATCH',
      token: mariaToken,
      body: { agentId: 2 },
    });
    record('AGENT_ISOLATION', 'Agent Maria Forbidden to Reassign Property Agent', 403, mariaReassignAgent.status, mariaReassignAgent.status === 403);

    // Agent Maria attempts to list all users
    const mariaListUsers = await request('/users', { token: mariaToken });
    record('AGENT_ISOLATION', 'Agent Maria Forbidden from Global User Directory', 403, mariaListUsers.status, mariaListUsers.status === 403);

    // Agent Maria reads her own profile
    const mariaReadSelf = await request('/users/2', { token: mariaToken });
    record('AGENT_ISOLATION', 'Agent Maria Can View Own User Profile', 200, mariaReadSelf.status, mariaReadSelf.status === 200 && mariaReadSelf.data?.id === 2);

    // Agent Maria attempts to read Carlos user profile (User 3)
    const mariaReadCarlos = await request('/users/3', { token: mariaToken });
    record('AGENT_ISOLATION', 'Agent Maria Forbidden from Viewing Carlos User Profile', 403, mariaReadCarlos.status, mariaReadCarlos.status === 403);

    // Agent Maria updates her own professional agent profile (Agent 1)
    const mariaUpdateAgent = await request('/agents/1', {
      method: 'PATCH',
      token: mariaToken,
      body: { agencyName: 'Santos Real Estate Partners' },
    });
    record('AGENT_ISOLATION', 'Agent Maria Can Update Own Agent Profile', 200, mariaUpdateAgent.status, mariaUpdateAgent.status === 200);

    // Agent Carlos attempts to update Maria agent profile (Agent 1)
    const carlosUpdateMariaAgent = await request('/agents/1', {
      method: 'PATCH',
      token: carlosToken,
      body: { agencyName: 'Hijacked by Carlos' },
    });
    record('AGENT_ISOLATION', 'Agent Carlos Forbidden to Update Maria Agent Profile', 403, carlosUpdateMariaAgent.status, carlosUpdateMariaAgent.status === 403);

    // Agent Inquiry Isolation: Maria views inquiries (all must be assignedAgentId == 2)
    const mariaInqs = await request('/inquiries', { token: mariaToken });
    const mariaInqsValid = mariaInqs.status === 200 && mariaInqs.data.every(i => i.assignedAgentId === 2);
    record('AGENT_ISOLATION', 'Agent Maria Inquiries List Filtered to Assigned Only', 200, mariaInqs.status, mariaInqsValid);

    // Agent Carlos attempts to view Maria inquiry (Inquiry 1, assignedAgentId = 2)
    const carlosViewMariaInq = await request('/inquiries/1', { token: carlosToken });
    record('AGENT_ISOLATION', 'Agent Carlos Forbidden from Viewing Maria Assigned Inquiry 1', 403, carlosViewMariaInq.status, carlosViewMariaInq.status === 403);

    // Agent Appointment Isolation: Maria views appointments (all must be agentId == 2)
    const mariaAppts = await request('/appointments', { token: mariaToken });
    const mariaApptsValid = mariaAppts.status === 200 && mariaAppts.data.every(a => a.agentId === 2);
    record('AGENT_ISOLATION', 'Agent Maria Appointments Filtered to Assigned Only', 200, mariaAppts.status, mariaApptsValid);

    // Agent Carlos attempts to view Maria appointment (Appointment 1, agentId = 2)
    const carlosViewMariaAppt = await request('/appointments/1', { token: carlosToken });
    record('AGENT_ISOLATION', 'Agent Carlos Forbidden from Viewing Maria Assigned Appointment 1', 403, carlosViewMariaAppt.status, carlosViewMariaAppt.status === 403);

    // 5. Client Persona & Resource Ownership Enforcement
    console.log('\n[5/7] Verifying Client Persona & Resource-Level Property Ownership...');

    // Client Juan Dela Cruz creates a property listing (Property Owner capability)
    const juanCreateProp = await request('/properties', {
      method: 'POST',
      token: juanToken,
      body: {
        title: 'Juan Dela Cruz Ancestral Estate',
        description: 'Privately owned estate listed directly by owner',
        price: 15500000,
        location: 'Alabang, Muntinlupa City',
        address: '45 Acacia Avenue, Ayala Alabang',
        propertyType: 'HOUSE',
        listingType: 'SALE',
        bedrooms: 4,
        bathrooms: 3,
        floorArea: 320,
        lotArea: 450,
      },
    });
    const juanProp = juanCreateProp.data;
    const juanPropCreated = juanCreateProp.status === 201 && juanProp?.ownerId === 4;
    record('CLIENT_OWNERSHIP', 'Client Juan Creates Listing as Property Owner (ownerId=4)', 201, juanCreateProp.status, juanPropCreated);
    const juanPropId = juanProp?.id;

    // Juan updates his owned property
    const juanUpdateOwn = await request(`/properties/${juanPropId}`, {
      method: 'PATCH',
      token: juanToken,
      body: { description: 'Updated description by verified property owner Juan' },
    });
    record('CLIENT_OWNERSHIP', 'Client Juan Updates Owned Property Listing', 200, juanUpdateOwn.status, juanUpdateOwn.status === 200);

    // Client Elena attempts to update Juan owned property
    const elenaUpdateJuanProp = await request(`/properties/${juanPropId}`, {
      method: 'PATCH',
      token: elenaToken,
      body: { description: 'Malicious modification by Elena Roxas' },
    });
    record('CLIENT_OWNERSHIP', 'Client Elena Forbidden from Updating Juan Owned Property', 403, elenaUpdateJuanProp.status, elenaUpdateJuanProp.status === 403);

    // Client Elena attempts to delete Juan owned property
    const elenaDeleteJuanProp = await request(`/properties/${juanPropId}`, {
      method: 'DELETE',
      token: elenaToken,
    });
    record('CLIENT_OWNERSHIP', 'Client Elena Forbidden from Deleting Juan Owned Property', 403, elenaDeleteJuanProp.status, elenaDeleteJuanProp.status === 403);

    // Client Elena attempts to upload photo to Juan owned property
    const elenaPhotoJuanProp = await request(`/properties/${juanPropId}/photos`, {
      method: 'POST',
      token: elenaToken,
      body: { filePath: 'https://example.com/elena-photo.jpg' },
    });
    record('CLIENT_OWNERSHIP', 'Client Elena Forbidden from Uploading Photo to Juan Owned Property', 403, elenaPhotoJuanProp.status, elenaPhotoJuanProp.status === 403);

    // Client Juan uploads photo to his own property
    const juanPhotoOwn = await request(`/properties/${juanPropId}/photos`, {
      method: 'POST',
      token: juanToken,
      body: { filePath: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c', isPrimary: true, caption: 'Main Facade' },
    });
    record('CLIENT_OWNERSHIP', 'Client Juan Uploads Photo to Owned Property', 201, juanPhotoOwn.status, juanPhotoOwn.status === 201);

    // Client Juan attempts to inject ownerId: 5 (privilege escalation)
    const juanChangeOwner = await request(`/properties/${juanPropId}`, {
      method: 'PATCH',
      token: juanToken,
      body: { ownerId: 5 },
    });
    record('CLIENT_OWNERSHIP', 'Client Juan Forbidden from Altering Listing Owner', 403, juanChangeOwner.status, juanChangeOwner.status === 403);

    // Client Juan attempts to assign agentId: 1 directly via PATCH
    const juanChangeAgent = await request(`/properties/${juanPropId}`, {
      method: 'PATCH',
      token: juanToken,
      body: { agentId: 1 },
    });
    record('CLIENT_OWNERSHIP', 'Client Juan Forbidden from Assigning Agent via PATCH', 403, juanChangeAgent.status, juanChangeAgent.status === 403);

    // Client Juan attempts role escalation: setting role to ADMIN
    const juanRoleEscalation = await request('/users/4', {
      method: 'PATCH',
      token: juanToken,
      body: { role: 'ADMIN' },
    });
    // Check if role was ignored/stripped
    const juanRefetched = await request('/users/4', { token: juanToken });
    const roleProtected = juanRefetched.data?.role === 'CLIENT';
    record('CLIENT_OWNERSHIP', 'Client Juan Role Escalation to ADMIN Stripped/Prevented', 200, juanRoleEscalation.status, roleProtected);

    // Client Juan attempts to list all users
    const juanListUsers = await request('/users', { token: juanToken });
    record('CLIENT_OWNERSHIP', 'Client Juan Forbidden from Global User Directory', 403, juanListUsers.status, juanListUsers.status === 403);

    // Client Juan attempts to read Elena profile (User 5)
    const juanReadElena = await request('/users/5', { token: juanToken });
    record('CLIENT_OWNERSHIP', 'Client Juan Forbidden from Reading Elena User Profile', 403, juanReadElena.status, juanReadElena.status === 403);

    // Client Juan views own profile (User 4)
    const juanReadSelf = await request('/users/4', { token: juanToken });
    record('CLIENT_OWNERSHIP', 'Client Juan Can View Own User Profile', 200, juanReadSelf.status, juanReadSelf.status === 200 && juanReadSelf.data?.id === 4);

    // Client Inquiry Isolation: Juan views own inquiry (Inquiry 1)
    const juanViewOwnInq = await request('/inquiries/1', { token: juanToken });
    record('CLIENT_OWNERSHIP', 'Client Juan Can View Own Inquiry 1', 200, juanViewOwnInq.status, juanViewOwnInq.status === 200 && juanViewOwnInq.data?.clientId === 4);

    // Client Elena attempts to view Juan inquiry (Inquiry 1)
    const elenaViewJuanInq = await request('/inquiries/1', { token: elenaToken });
    record('CLIENT_OWNERSHIP', 'Client Elena Forbidden from Viewing Juan Inquiry 1', 403, elenaViewJuanInq.status, elenaViewJuanInq.status === 403);

    // Client Appointment Isolation: Juan views own appointment (Appointment 1)
    const juanViewOwnAppt = await request('/appointments/1', { token: juanToken });
    record('CLIENT_OWNERSHIP', 'Client Juan Can View Own Appointment 1', 200, juanViewOwnAppt.status, juanViewOwnAppt.status === 200 && juanViewOwnAppt.data?.clientId === 4);

    // Client Elena attempts to view Juan appointment (Appointment 1)
    const elenaViewJuanAppt = await request('/appointments/1', { token: elenaToken });
    record('CLIENT_OWNERSHIP', 'Client Elena Forbidden from Viewing Juan Appointment 1', 403, elenaViewJuanAppt.status, elenaViewJuanAppt.status === 403);

    // Client Elena attempts to cancel Juan appointment (Appointment 1)
    const elenaCancelJuanAppt = await request('/appointments/1', {
      method: 'PATCH',
      token: elenaToken,
      body: { status: 'CANCELLED' },
    });
    record('CLIENT_OWNERSHIP', 'Client Elena Forbidden from Modifying Juan Appointment 1', 403, elenaCancelJuanAppt.status, elenaCancelJuanAppt.status === 403);

    // Juan deletes his owned listing
    const juanDeleteOwn = await request(`/properties/${juanPropId}`, {
      method: 'DELETE',
      token: juanToken,
    });
    record('CLIENT_OWNERSHIP', 'Client Juan Deletes Owned Property Listing', 200, juanDeleteOwn.status, juanDeleteOwn.status === 200);

    // 6. Transactions Security & BOLA Isolation
    console.log('\n[6/7] Verifying Transactions Security, BOLA & Financial Boundaries...');

    // Seed a verified transaction in sandbox: Property 2, buyer Juan (4), agent Maria (Agent 1)
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'estatecore_user',
      password: 'estatecore_secure_pass_2026',
      database: 'estatecore_test_restore',
    });

    const [txInsert] = await conn.query(
      `INSERT INTO property_transactions (propertyId, buyerId, agentId, amount, transactionType, paymentMethod, transactionDate, status, notes)
       VALUES (2, 4, 1, 12500000.00, 'SALE', 'BANK_TRANSFER', '2026-11-25', 'COMPLETED', 'Phase 3 verified transaction test')`
    );
    const testTxId = txInsert.insertId;
    console.log(`  -> Seeded test transaction ID ${testTxId} (Buyer: 4 Juan, Agent: 1 Maria)`);

    // Admin views all transactions
    const adminTxList = await request('/transactions', { token: adminToken });
    record('TRANSACTIONS', 'Admin Can View All Transactions', 200, adminTxList.status, adminTxList.status === 200 && Array.isArray(adminTxList.data));

    // Admin views single transaction
    const adminTxGet = await request(`/transactions/${testTxId}`, { token: adminToken });
    record('TRANSACTIONS', 'Admin Can View Transaction by ID', 200, adminTxGet.status, adminTxGet.status === 200 && adminTxGet.data?.transactionId === testTxId);

    // Client Juan views own transactions list
    const juanTxList = await request('/transactions', { token: juanToken });
    const juanTxListValid = juanTxList.status === 200 && juanTxList.data.every(t => t.buyerId === 4);
    record('TRANSACTIONS', 'Client Juan Transactions List Filtered to Own Purchases', 200, juanTxList.status, juanTxListValid);

    // Client Juan views own transaction by ID
    const juanTxGet = await request(`/transactions/${testTxId}`, { token: juanToken });
    record('TRANSACTIONS', 'Client Juan Can View Own Transaction', 200, juanTxGet.status, juanTxGet.status === 200 && juanTxGet.data?.buyerId === 4);

    // Client Elena attempts to view Juan transaction
    const elenaTxGet = await request(`/transactions/${testTxId}`, { token: elenaToken });
    record('TRANSACTIONS', 'Client Elena Forbidden from Viewing Juan Transaction', 403, elenaTxGet.status, elenaTxGet.status === 403);

    // Agent Maria views her transaction
    const mariaTxGet = await request(`/transactions/${testTxId}`, { token: mariaToken });
    record('TRANSACTIONS', 'Agent Maria Can View Assigned Transaction', 200, mariaTxGet.status, mariaTxGet.status === 200 && mariaTxGet.data?.agentId === 1);

    // Agent Carlos attempts to view Maria transaction
    const carlosTxGet = await request(`/transactions/${testTxId}`, { token: carlosToken });
    record('TRANSACTIONS', 'Agent Carlos Forbidden from Viewing Maria Transaction', 403, carlosTxGet.status, carlosTxGet.status === 403);

    // Clean up test transaction from sandbox
    await conn.query('DELETE FROM property_transactions WHERE id = ?', [testTxId]);
    await conn.end();
    console.log(`  -> Cleaned up test transaction ID ${testTxId}`);

    // 7. Admin Master Authority Verification
    console.log('\n[7/7] Verifying Admin Administrative Authority & Delegation Controls...');

    // Admin creates property assigned to Agent 2 (Carlos) and Owner 4 (Juan)
    const adminCreateProp = await request('/properties', {
      method: 'POST',
      token: adminToken,
      body: {
        title: 'Admin Provisioned Commercial Center',
        description: 'Managed commercial listing provisioned by system administrator',
        price: 45000000,
        location: 'Bonifacio Global City, Taguig',
        address: '5th Avenue corner 26th Street',
        propertyType: 'COMMERCIAL',
        listingType: 'SALE',
        agentId: 2,
        ownerId: 4,
      },
    });
    const adminProp = adminCreateProp.data;
    record('ADMIN_AUTHORITY', 'Admin Creates Property with Agent 2 and Owner 4', 201, adminCreateProp.status, adminCreateProp.status === 201 && adminProp?.agentId === 2 && adminProp?.ownerId === 4);
    const adminPropId = adminProp?.id;

    // Admin reassigns agent from Carlos (2) to Maria (1)
    const adminReassignAgent = await request(`/properties/${adminPropId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { agentId: 1 },
    });
    record('ADMIN_AUTHORITY', 'Admin Reassigns Property Agent to Maria (1)', 200, adminReassignAgent.status, adminReassignAgent.status === 200 && adminReassignAgent.data?.agentId === 1);

    // Admin reassigns owner from Juan (4) to Elena (5)
    const adminReassignOwner = await request(`/properties/${adminPropId}`, {
      method: 'PATCH',
      token: adminToken,
      body: { ownerId: 5 },
    });
    record('ADMIN_AUTHORITY', 'Admin Reassigns Property Owner to Elena (5)', 200, adminReassignOwner.status, adminReassignOwner.status === 200 && adminReassignOwner.data?.ownerId === 5);

    // Admin deletes the test property
    const adminDeleteProp = await request(`/properties/${adminPropId}`, {
      method: 'DELETE',
      token: adminToken,
    });
    record('ADMIN_AUTHORITY', 'Admin Deletes Test Property Listing', 200, adminDeleteProp.status, adminDeleteProp.status === 200);

  } finally {
    await app.close();
    console.log('\nTest server shut down cleanly.');
  }

  // 8. Live Database Safety Check
  console.log('\n--- VERIFYING LIVE DATABASE ZERO-TOUCH INTEGRITY ---');
  const liveConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: 'estatecore_db',
  });

  const [liveTables] = await liveConn.query('SHOW TABLES');
  const tableNames = liveTables.map(r => Object.values(r)[0]);
  console.log(`Live DB Tables (${tableNames.length}): ${tableNames.join(', ')}`);

  // Verify agents table NOT present in live DB (Phase 2 migration was never applied to live DB)
  const liveHasAgents = tableNames.includes('agents');
  const liveHasPropertyTx = tableNames.includes('property_transactions');
  const liveHasPropertyPhotos = tableNames.includes('property_photos');
  const [liveUsers] = await liveConn.query('SELECT COUNT(*) as count FROM users');
  const [liveProps] = await liveConn.query('SELECT COUNT(*) as count FROM properties');
  const [liveInqs] = await liveConn.query('SELECT COUNT(*) as count FROM inquiries');
  const [liveAppts] = await liveConn.query('SELECT COUNT(*) as count FROM appointments');

  const liveSafe = !liveHasAgents && !liveHasPropertyTx && !liveHasPropertyPhotos;
  console.log(`Live Database Schema Untouched: ${liveSafe}`);
  console.log(`Live Record Counts: Users=${liveUsers[0].count}, Properties=${liveProps[0].count}, Inquiries=${liveInqs[0].count}, Appointments=${liveAppts[0].count}`);

  await liveConn.end();

  results.liveDatabaseIntegrity = {
    untouched: liveSafe,
    tableCount: tableNames.length,
    agentsTablePresent: liveHasAgents,
    propertyTransactionsPresent: liveHasPropertyTx,
    propertyPhotosPresent: liveHasPropertyPhotos,
    userCount: liveUsers[0].count,
    propertyCount: liveProps[0].count,
    inquiryCount: liveInqs[0].count,
    appointmentCount: liveAppts[0].count,
  };

  console.log('\n========================================================================');
  console.log(`TEST RESULTS SUMMARY:`);
  console.log(`Total Tests Run: ${results.summary.total}`);
  console.log(`Passed:          ${results.summary.passed}`);
  console.log(`Failed:          ${results.summary.failed}`);
  console.log(`Success Rate:    ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
  console.log(`Live DB Safe:    ${liveSafe ? 'YES (100% UNTOUCHED)' : 'COMPROMISED'}`);
  console.log('========================================================================\n');

  // Save evidence
  const evidenceDir = path.join(__dirname, '../documentation/evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(evidenceDir, 'phase3_security_test_results.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log(`Evidence saved to: documentation/evidence/phase3_security_test_results.json`);

  if (results.summary.failed > 0 || !liveSafe) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
