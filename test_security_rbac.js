const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('=== STARTING ESTATECORE DEEP RBAC & SECURITY AUDIT ===\n');

  const results = [];
  let testNum = 0;

  function record(name, expectedStatus, actualStatus, pass, details = {}) {
    testNum++;
    const statusStr = pass ? 'PASS' : 'FAIL';
    console.log(`[TEST ${testNum}] [${statusStr}] ${name} (Expected: ${expectedStatus}, Actual: ${actualStatus})`);
    results.push({ testNum, name, expectedStatus, actualStatus, pass, details });
  }

  // --- Step 1: Obtain Auth Tokens ---
  console.log('\n--- 1. Authenticating Identities ---');

  const adminAuth = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'admin@estatecore.local', password: 'Password123!' });
  const adminToken = adminAuth.data.accessToken;
  const adminUser = adminAuth.data.user;

  const agentAuth = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'maria.santos@estatecore.local', password: 'Password123!' });
  const agentToken = agentAuth.data.accessToken;
  const agentUser = agentAuth.data.user;

  const clientAuth = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, { email: 'juan.delacruz@client.local', password: 'Password123!' });
  const clientToken = clientAuth.data.accessToken;
  const clientUser = clientAuth.data.user;

  console.log(`✓ Admin User ID: ${adminUser.id} (${adminUser.email})`);
  console.log(`✓ Agent User ID: ${agentUser.id} (${agentUser.email})`);
  console.log(`✓ Client User ID: ${clientUser.id} (${clientUser.email})`);

  // --- Step 2: Negative Authorization Tests ---
  console.log('\n--- 2. Negative Authorization & RBAC Enforcement Tests ---');

  // Test 1: Missing JWT token on protected endpoint
  const unauthMe = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
  });
  record('Anonymous request to /api/auth/me is rejected', 401, unauthMe.status, unauthMe.status === 401);

  // Test 2: Forged / Invalid JWT token
  const forgedToken = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': 'Bearer this.is.a.tampered.token.12345' },
  });
  record('Tampered JWT token rejected', 401, forgedToken.status, forgedToken.status === 401);

  // Test 3: Client attempting to access Admin user directory (GET /api/users)
  const clientUsers = await request({
    hostname: 'localhost', port: 3000, path: '/api/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${clientToken}` },
  });
  record('CLIENT accessing GET /api/users rejected', 403, clientUsers.status, clientUsers.status === 403);

  // Test 4: Agent attempting to access Admin user directory (GET /api/users)
  const agentUsers = await request({
    hostname: 'localhost', port: 3000, path: '/api/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${agentToken}` },
  });
  record('AGENT accessing GET /api/users rejected', 403, agentUsers.status, agentUsers.status === 403);

  // Test 5: Client attempting to create property listing (POST /api/properties)
  const clientCreateProp = await request({
    hostname: 'localhost', port: 3000, path: '/api/properties', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, {
    title: 'Unauthorized Client Listing',
    description: 'This should fail immediately with 403 Forbidden.',
    propertyType: 'CONDOMINIUM',
    listingType: 'SALE',
    price: 5000000,
    location: 'BGC, Taguig',
    address: '123 Fake St',
    bedrooms: 2,
    bathrooms: 1,
    floorArea: 50,
    lotArea: 0,
  });
  record('CLIENT attempting POST /api/properties rejected', 403, clientCreateProp.status, clientCreateProp.status === 403);

  // Test 6: Client attempting to update property listing (PATCH /api/properties/1)
  const clientUpdateProp = await request({
    hostname: 'localhost', port: 3000, path: '/api/properties/1', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, { price: 1 });
  record('CLIENT attempting PATCH /api/properties/1 rejected', 403, clientUpdateProp.status, clientUpdateProp.status === 403);

  // Test 7: Client attempting to delete property listing (DELETE /api/properties/1)
  const clientDeleteProp = await request({
    hostname: 'localhost', port: 3000, path: '/api/properties/1', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${clientToken}` },
  });
  record('CLIENT attempting DELETE /api/properties/1 rejected', 403, clientDeleteProp.status, clientDeleteProp.status === 403);

  // Test 8: Client attempting to view another user's profile (GET /api/users/1)
  const clientInspectAdmin = await request({
    hostname: 'localhost', port: 3000, path: '/api/users/1', method: 'GET',
    headers: { 'Authorization': `Bearer ${clientToken}` },
  });
  record('CLIENT inspecting another user profile (IDOR) rejected', 403, clientInspectAdmin.status, clientInspectAdmin.status === 403);

  // Test 9: Client attempting privilege escalation (PATCH /api/users/<clientId> with role: ADMIN)
  const clientSelfEscalate = await request({
    hostname: 'localhost', port: 3000, path: `/api/users/${clientUser.id}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, { role: 'ADMIN' });
  // The backend strips role for non-admins, returning 200 with unchanged role
  const clientRoleStillClient = clientSelfEscalate.data?.role === 'CLIENT';
  record('CLIENT privilege escalation via PATCH stripped by server', 200, clientSelfEscalate.status, clientSelfEscalate.status === 200 && clientRoleStillClient, { finalRole: clientSelfEscalate.data?.role });

  // Test 10: Agent attempting to update property assigned to ANOTHER agent (IDOR protection)
  // Let's create a test property assigned to Admin or another agent
  const adminCreatedProp = await request({
    hostname: 'localhost', port: 3000, path: '/api/properties', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
  }, {
    title: 'Admin Owned Exclusive Property',
    description: 'Owned strictly by Administrator, Agent Maria must not be able to modify.',
    propertyType: 'HOUSE',
    listingType: 'SALE',
    price: 25000000,
    location: 'Forbes Park, Makati',
    address: '10 Harvard Rd',
    bedrooms: 5,
    bathrooms: 4,
    floorArea: 400,
    lotArea: 600,
    agentId: adminUser.id, // Assigned to Admin
  });
  const adminPropId = adminCreatedProp.data.id;

  const agentCrossEdit = await request({
    hostname: 'localhost', port: 3000, path: `/api/properties/${adminPropId}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${agentToken}` },
  }, { title: 'Hacked by Agent Maria' });
  record('AGENT updating property of another agent rejected (Ownership Guard)', 403, agentCrossEdit.status, agentCrossEdit.status === 403);

  // Test 11: Agent attempting to delete property of another agent
  const agentCrossDelete = await request({
    hostname: 'localhost', port: 3000, path: `/api/properties/${adminPropId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${agentToken}` },
  });
  record('AGENT deleting property of another agent rejected (Ownership Guard)', 403, agentCrossDelete.status, agentCrossDelete.status === 403);

  // Test 12: Admin creating a property with invalid/non-existent agentId
  const adminBadAgentProp = await request({
    hostname: 'localhost', port: 3000, path: '/api/properties', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
  }, {
    title: 'Property with Fake Agent',
    description: 'Should fail validation because agent 99999 does not exist.',
    propertyType: 'CONDOMINIUM',
    listingType: 'SALE',
    price: 2000000,
    location: 'Quezon City',
    address: 'Test Address',
    agentId: 99999,
  });
  record('ADMIN assigning non-existent agentId rejected', 400, adminBadAgentProp.status, adminBadAgentProp.status === 400);

  // Test 13: Client accessing another client's inquiry by ID (IDOR)
  // Let's create an inquiry as Client Juan
  const clientInquiry = await request({
    hostname: 'localhost', port: 3000, path: '/api/inquiries', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, {
    propertyId: 1,
    subject: 'Client Juan Private Inquiry',
    message: 'Confidential financing questions.',
    contactNumber: '+63 917 111 2222',
  });
  const clientInquiryId = clientInquiry.data.id;

  // Now create a temporary second client to attempt cross-client access
  const tempClientReg = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/register', method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, {
    fullName: 'Snooping Client B',
    email: `snooper_${Date.now()}@test.local`,
    password: 'Password123!',
  });
  const snooperToken = tempClientReg.data.accessToken;

  const crossClientInquiryAccess = await request({
    hostname: 'localhost', port: 3000, path: `/api/inquiries/${clientInquiryId}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${snooperToken}` },
  });
  record('CLIENT inspecting another client inquiry (IDOR) rejected', 403, crossClientInquiryAccess.status, crossClientInquiryAccess.status === 403);

  // Test 14: Client attempting to approve their own appointment (Status Elevation Guard)
  // Create an appointment as Client Juan
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const clientAppt = await request({
    hostname: 'localhost', port: 3000, path: '/api/appointments', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, {
    propertyId: 1,
    appointmentDate: dateStr,
    appointmentTime: '14:00',
    notes: 'Tour with architect.',
  });
  const clientApptId = clientAppt.data.id;

  const clientSelfConfirmAppt = await request({
    hostname: 'localhost', port: 3000, path: `/api/appointments/${clientApptId}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, { status: 'CONFIRMED' });
  record('CLIENT attempting to set appointment status to CONFIRMED rejected', 403, clientSelfConfirmAppt.status, clientSelfConfirmAppt.status === 403);

  // Test 15: Client successfully cancelling their own appointment
  const clientCancelAppt = await request({
    hostname: 'localhost', port: 3000, path: `/api/appointments/${clientApptId}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, { status: 'CANCELLED' });
  record('CLIENT successfully cancelling their own appointment', 200, clientCancelAppt.status, clientCancelAppt.status === 200 && clientCancelAppt.data?.status === 'CANCELLED');

  // Test 16: Past date validation on appointment creation
  const pastAppt = await request({
    hostname: 'localhost', port: 3000, path: '/api/appointments', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
  }, {
    propertyId: 1,
    appointmentDate: '2020-01-01',
    appointmentTime: '10:00',
  });
  record('Creating appointment in the past rejected', 400, pastAppt.status, pastAppt.status === 400);

  // Clean up test property
  await request({
    hostname: 'localhost', port: 3000, path: `/api/properties/${adminPropId}`, method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });

  // --- Step 3: Direct MySQL Persistence Verification ---
  console.log('\n--- 3. Direct MySQL Database Persistence Verification ---');

  // Verify that clientInquiry persisted in MySQL
  try {
    const inquiryDbRow = execSync(
      `docker exec estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db -e "SELECT id, subject, clientId, status FROM inquiries WHERE id = ${clientInquiryId};"`,
      { encoding: 'utf-8' }
    );
    const persistedInDb = inquiryDbRow.includes('Client Juan Private Inquiry');
    record('Inquiry verified persisting directly in MySQL database table', 'SQL ROW FOUND', persistedInDb ? 'SQL ROW FOUND' : 'MISSING', persistedInDb, { output: inquiryDbRow.trim() });
  } catch (err) {
    record('Direct MySQL inquiry query', 'SUCCESS', 'FAILED', false, { error: err.message });
  }

  // Verify that cancelled appointment persisted in MySQL
  try {
    const apptDbRow = execSync(
      `docker exec estatecore-mysql mysql -u root -pestatecore_root_secure_pass_2026 estatecore_db -e "SELECT id, status, appointmentDate, clientId FROM appointments WHERE id = ${clientApptId};"`,
      { encoding: 'utf-8' }
    );
    const apptCancelledInDb = apptDbRow.includes('CANCELLED');
    record('Appointment cancellation status verified persisting in MySQL', 'CANCELLED IN DB', apptCancelledInDb ? 'CANCELLED IN DB' : 'NOT CANCELLED', apptCancelledInDb, { output: apptDbRow.trim() });
  } catch (err) {
    record('Direct MySQL appointment query', 'SUCCESS', 'FAILED', false, { error: err.message });
  }

  // --- Summary ---
  console.log('\n=== AUDIT SUMMARY ===');
  const passed = results.filter((r) => r.pass).length;
  console.log(`Total Security & Authorization Tests: ${results.length}`);
  console.log(`Passed: ${passed} / ${results.length}`);
  console.log(`Failed: ${results.length - passed}`);

  fs.writeFileSync(
    path.join(__dirname, 'documentation', 'evidence', 'rbac_security_audit_results.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\nSecurity audit results saved to documentation/evidence/rbac_security_audit_results.json');
}

runSecurityAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
