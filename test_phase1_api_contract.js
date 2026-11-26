const http = require('http');
const fs = require('fs');
const path = require('path');

const API_HOST = '127.0.0.1';
const API_PORT = 3000;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: API_HOST,
        port: API_PORT,
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function runPhase1Suite() {
  console.log('=== STARTING ESTATECORE PHASE 1 API CONTRACT & SECURITY SUITE ===\n');

  const testResults = [];
  let passedCount = 0;
  let totalCount = 0;

  async function test(name, fn) {
    totalCount++;
    process.stdout.write(`[TEST ${totalCount}] ${name} ... `);
    const start = Date.now();
    try {
      const details = await fn();
      passedCount++;
      const duration = Date.now() - start;
      console.log(`PASSED (${duration}ms)`);
      testResults.push({ id: totalCount, name, status: 'PASS', durationMs: duration, details });
    } catch (err) {
      const duration = Date.now() - start;
      console.log(`FAILED (${duration}ms)`);
      console.error(`       Error: ${err.message}`);
      testResults.push({ id: totalCount, name, status: 'FAIL', durationMs: duration, error: err.message });
    }
  }

  // Tokens acquired during authentication tests
  let adminToken = null;
  let agentToken = null;
  let clientToken = null;

  try {
    // -------------------------------------------------------------------------
    // 1. AUTHENTICATION & JWT CONTRACT
    // -------------------------------------------------------------------------
    await test('POST /api/v1/auth/login as Administrator and verify 3600s JWT expiration', async () => {
      const res = await request(
        { method: 'POST', path: '/api/v1/auth/login' },
        { email: 'admin@estatecore.local', password: 'Password123!' }
      );
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.body)}`);
      adminToken = res.body.accessToken;
      if (!adminToken) throw new Error('No accessToken returned');

      const decoded = parseJwt(adminToken);
      const lifespan = decoded.exp - decoded.iat;
      if (lifespan !== 3600) {
        throw new Error(`Expected JWT lifespan of exactly 3600s (1 hour), but got ${lifespan}s`);
      }
      return { role: decoded.role, durationSeconds: lifespan };
    });

    await test('POST /api/v1/auth/login as Agent and Client', async () => {
      const agentRes = await request(
        { method: 'POST', path: '/api/v1/auth/login' },
        { email: 'maria.santos@estatecore.local', password: 'Password123!' }
      );
      if (agentRes.status !== 200) throw new Error(`Agent login failed: ${agentRes.status}`);
      agentToken = agentRes.body.accessToken;

      const clientRes = await request(
        { method: 'POST', path: '/api/v1/auth/login' },
        { email: 'juan.delacruz@client.local', password: 'Password123!' }
      );
      if (clientRes.status !== 200) throw new Error(`Client login failed: ${clientRes.status}`);
      clientToken = clientRes.body.accessToken;

      return { agentSub: parseJwt(agentToken).sub, clientSub: parseJwt(clientToken).sub };
    });

    await test('POST /api/v1/auth/register creates new Client with input validation', async () => {
      const uniqueEmail = `contract_test_${Date.now()}@domain.local`;
      const res = await request(
        { method: 'POST', path: '/api/v1/auth/register' },
        { fullName: 'Contract Verification User', email: uniqueEmail, password: 'Password123!' }
      );
      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
      if (res.body.user.role !== 'CLIENT') throw new Error(`Expected role CLIENT, got ${res.body.user.role}`);
      return { registeredUser: res.body.user.email };
    });

    // -------------------------------------------------------------------------
    // 2. TOKEN REVOCATION & LOGOUT (GENUINE SECURITY)
    // -------------------------------------------------------------------------
    await test('POST /api/v1/auth/logout revokes token; subsequent request rejected with 401', async () => {
      // 1. Create a dedicated ephemeral user session for logout testing
      const tempLogin = await request(
        { method: 'POST', path: '/api/v1/auth/login' },
        { email: 'juan.delacruz@client.local', password: 'Password123!' }
      );
      const tempToken = tempLogin.body.accessToken;

      // 2. Verify token works before logout
      const beforeLogout = await request({
        method: 'GET',
        path: '/api/v1/auth/me',
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      if (beforeLogout.status !== 200) throw new Error(`Token did not work before logout: ${beforeLogout.status}`);

      // 3. Call logout endpoint
      const logoutRes = await request({
        method: 'POST',
        path: '/api/v1/auth/logout',
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      if (logoutRes.status !== 200) throw new Error(`Logout failed with status ${logoutRes.status}`);

      // 4. Verify token is now REJECTED with 401 Unauthorized
      const afterLogout = await request({
        method: 'GET',
        path: '/api/v1/auth/me',
        headers: { Authorization: `Bearer ${tempToken}` },
      });
      if (afterLogout.status !== 401) {
        throw new Error(`Expected 401 Unauthorized for revoked token, but got ${afterLogout.status}`);
      }
      return { revocationConfirmed: true, rejectedStatus: afterLogout.status };
    });

    // -------------------------------------------------------------------------
    // 3. BACKWARD COMPATIBILITY: /api/* TRANSFORMS TO /api/v1/*
    // -------------------------------------------------------------------------
    await test('Backward compatibility: /api/properties transparently aliases to /api/v1/properties', async () => {
      const resV1 = await request({ method: 'GET', path: '/api/v1/properties' });
      const resLegacy = await request({ method: 'GET', path: '/api/properties' });

      if (resV1.status !== 200 || resLegacy.status !== 200) {
        throw new Error(`Status mismatch: v1=${resV1.status}, legacy=${resLegacy.status}`);
      }
      if (resV1.body.length !== resLegacy.body.length) {
        throw new Error(`Data length mismatch between /api/v1 and /api routes`);
      }
      return { count: resV1.body.length };
    });

    // -------------------------------------------------------------------------
    // 4. USERS RESOURCE (PDF LAB 05 EP 04 - 07)
    // -------------------------------------------------------------------------
    await test('GET /api/v1/users (Admin only)', async () => {
      const res = await request({
        method: 'GET',
        path: '/api/v1/users',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body)) throw new Error('Expected array of users');
      return { userCount: res.body.length };
    });

    await test('GET /api/v1/users/:id (Admin or Self)', async () => {
      const selfRes = await request({
        method: 'GET',
        path: '/api/v1/users/4',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      if (selfRes.status !== 200) throw new Error(`Expected 200 viewing self, got ${selfRes.status}`);

      const forbiddenRes = await request({
        method: 'GET',
        path: '/api/v1/users/1',
        headers: { Authorization: `Bearer ${clientToken}` },
      });
      if (forbiddenRes.status !== 403) throw new Error(`Expected 403 snooping admin, got ${forbiddenRes.status}`);

      return { selfViewStatus: selfRes.status, forbiddenStatus: forbiddenRes.status };
    });

    await test('PUT & PATCH /api/v1/users/:id support', async () => {
      const putRes = await request(
        {
          method: 'PUT',
          path: '/api/v1/users/4',
          headers: { Authorization: `Bearer ${clientToken}` },
        },
        { fullName: 'Juan Dela Cruz Updated' }
      );
      if (putRes.status !== 200) throw new Error(`Expected 200 on PUT, got ${putRes.status}`);

      const patchRes = await request(
        {
          method: 'PATCH',
          path: '/api/v1/users/4',
          headers: { Authorization: `Bearer ${clientToken}` },
        },
        { fullName: 'Juan Dela Cruz' }
      );
      if (patchRes.status !== 200) throw new Error(`Expected 200 on PATCH, got ${patchRes.status}`);

      return { putStatus: putRes.status, patchStatus: patchRes.status };
    });

    // -------------------------------------------------------------------------
    // 5. AGENTS RESOURCE (PDF LAB 05 EP 08 - 11)
    // -------------------------------------------------------------------------
    await test('GET /api/v1/agents returns verified agent list (Public / Auth)', async () => {
      const res = await request({ method: 'GET', path: '/api/v1/agents' });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!Array.isArray(res.body) || res.body.length === 0) {
        throw new Error('Expected non-empty list of agents');
      }
      const agent = res.body[0];
      if (!agent.agentId || !agent.email || !agent.agencyName) {
        throw new Error(`Agent structure missing required fields: ${JSON.stringify(agent)}`);
      }
      if (agent.verificationStatus !== 'PENDING_VERIFICATION') {
        throw new Error(`Agent must have verificationStatus 'PENDING_VERIFICATION'`);
      }
      return { agentCount: res.body.length, sampleAgent: agent.fullName };
    });

    await test('GET /api/v1/agents/:id returns single agent dossier', async () => {
      const res = await request({ method: 'GET', path: '/api/v1/agents/2' });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (res.body.agentId !== 2) throw new Error(`Expected agentId 2, got ${res.body.agentId}`);
      return { agentName: res.body.fullName, email: res.body.email };
    });

    await test('PUT /api/v1/agents/:id updates agent profile (Admin or Self)', async () => {
      const res = await request(
        {
          method: 'PUT',
          path: '/api/v1/agents/2',
          headers: { Authorization: `Bearer ${agentToken}` },
        },
        { agencyName: 'EstateCore Premier Realty' }
      );
      if (res.status !== 200) throw new Error(`Expected 200 on PUT /agents/:id, got ${res.status}`);
      return { updatedAgency: res.body.agencyName };
    });

    // -------------------------------------------------------------------------
    // 6. PROPERTIES RESOURCE (PDF LAB 05 EP 12 - 16)
    // -------------------------------------------------------------------------
    await test('GET /api/v1/properties and GET /api/v1/properties/:id', async () => {
      const listRes = await request({ method: 'GET', path: '/api/v1/properties' });
      if (listRes.status !== 200) throw new Error(`Expected 200, got ${listRes.status}`);

      const singleRes = await request({ method: 'GET', path: '/api/v1/properties/1' });
      if (singleRes.status !== 200) throw new Error(`Expected 200, got ${singleRes.status}`);
      if (singleRes.body.id !== 1) throw new Error(`Expected property ID 1, got ${singleRes.body.id}`);

      return { totalProperties: listRes.body.length, sampleTitle: singleRes.body.title };
    });

    await test('PUT & PATCH /api/v1/properties/:id support', async () => {
      const putRes = await request(
        {
          method: 'PUT',
          path: '/api/v1/properties/1',
          headers: { Authorization: `Bearer ${adminToken}` },
        },
        { price: 18500000.0 }
      );
      if (putRes.status !== 200) throw new Error(`Expected 200 on PUT property, got ${putRes.status}`);

      const patchRes = await request(
        {
          method: 'PATCH',
          path: '/api/v1/properties/1',
          headers: { Authorization: `Bearer ${adminToken}` },
        },
        { price: 18500000.0 }
      );
      if (patchRes.status !== 200) throw new Error(`Expected 200 on PATCH property, got ${patchRes.status}`);

      return { putStatus: putRes.status, patchStatus: patchRes.status };
    });

    // -------------------------------------------------------------------------
    // 7. NESTED PROPERTY PHOTOS (PDF LAB 05 EP-17)
    // -------------------------------------------------------------------------
    await test('POST /api/v1/properties/:id/photos (Agent / Admin only)', async () => {
      const photoPayload = {
        photoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
        isPrimary: true,
      };

      // Client should receive 403 Forbidden
      const clientAttempt = await request(
        {
          method: 'POST',
          path: '/api/v1/properties/1/photos',
          headers: { Authorization: `Bearer ${clientToken}` },
        },
        photoPayload
      );
      if (clientAttempt.status !== 403) {
        throw new Error(`Expected 403 Forbidden for client photo upload, got ${clientAttempt.status}`);
      }

      // Admin should receive 201 Created
      const adminAttempt = await request(
        {
          method: 'POST',
          path: '/api/v1/properties/1/photos',
          headers: { Authorization: `Bearer ${adminToken}` },
        },
        photoPayload
      );
      if (adminAttempt.status !== 201) {
        throw new Error(`Expected 201 Created for admin photo upload, got ${adminAttempt.status}`);
      }
      if (!adminAttempt.body.photoId || adminAttempt.body.propertyId !== 1) {
        throw new Error(`Photo response structure invalid: ${JSON.stringify(adminAttempt.body)}`);
      }

      return { photoId: adminAttempt.body.photoId, forbiddenVerified: true };
    });

    // -------------------------------------------------------------------------
    // 8. NESTED PROPERTY INQUIRIES (PDF LAB 05 EP-18)
    // -------------------------------------------------------------------------
    await test('POST /api/v1/properties/:id/inquiries creates nested inquiry', async () => {
      const inquiryPayload = {
        subject: 'Phase 1 Contract Verification Inquiry',
        message: 'Verifying nested POST /api/v1/properties/:id/inquiries route compliance.',
        contactNumber: '+63 917 555 0199',
      };

      const res = await request(
        {
          method: 'POST',
          path: '/api/v1/properties/1/inquiries',
          headers: { Authorization: `Bearer ${clientToken}` },
        },
        inquiryPayload
      );
      if (res.status !== 201) {
        throw new Error(`Expected 201 Created, got ${res.status}: ${JSON.stringify(res.body)}`);
      }
      if (res.body.propertyId !== 1 || res.body.clientId !== 4) {
        throw new Error(`Inquiry entity linkage failed: ${JSON.stringify(res.body)}`);
      }

      return { inquiryId: res.body.id, status: res.body.status };
    });

    // -------------------------------------------------------------------------
    // 9. TRANSACTIONS RESOURCE (PDF LAB 05 EP-19)
    // -------------------------------------------------------------------------
    await test('GET /api/v1/transactions returns transaction history (Auth only)', async () => {
      // Unauthenticated -> 401
      const noAuth = await request({ method: 'GET', path: '/api/v1/transactions' });
      if (noAuth.status !== 401) throw new Error(`Expected 401, got ${noAuth.status}`);

      // Authenticated Admin -> 200
      const adminRes = await request({
        method: 'GET',
        path: '/api/v1/transactions',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (adminRes.status !== 200) throw new Error(`Expected 200, got ${adminRes.status}`);
      if (!Array.isArray(adminRes.body)) throw new Error('Expected array of transactions');

      return { unauthenticated401: true, authenticated200: true, transactionsLength: adminRes.body.length };
    });

    // -------------------------------------------------------------------------
    // 10. SECURITY & INPUT VALIDATION GUARDS
    // -------------------------------------------------------------------------
    await test('Security: Non-whitelisted request payload is rejected with 400 Bad Request', async () => {
      const res = await request(
        {
          method: 'POST',
          path: '/api/v1/properties',
          headers: { Authorization: `Bearer ${adminToken}` },
        },
        {
          title: 'Payload Validation Test',
          price: 5000000,
          maliciousInjectedField: '<script>alert("hack")</script>',
        }
      );
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request for forbidden field, got ${res.status}`);
      }
      return { status: res.status, error: res.body.message };
    });

  } catch (fatalErr) {
    console.error('Fatal execution error:', fatalErr);
  }

  console.log('\n=== PHASE 1 TEST SUITE SUMMARY ===');
  console.log(`Total Contract & Security Tests: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);

  const evidence = {
    timestamp: new Date().toISOString(),
    totalTests: totalCount,
    passedTests: passedCount,
    failedTests: totalCount - passedCount,
    tests: testResults,
  };

  const evidenceDir = path.join(__dirname, 'documentation', 'evidence');
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
  const outputPath = path.join(evidenceDir, 'phase_1_api_test_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(evidence, null, 2), 'utf-8');
  console.log(`Evidence report saved to: ${outputPath}\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runPhase1Suite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
