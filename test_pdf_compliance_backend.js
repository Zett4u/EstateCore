const http = require('http');

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

async function runComplianceProbes() {
  console.log('=== STARTING ESTATECORE BACKEND PDF COMPLIANCE PROBE ===\n');

  const results = {
    timestamp: new Date().toISOString(),
    apiBasePath: null,
    jwtAudit: null,
    securityChecks: {},
    endpointAudit: [],
  };

  // 1. Audit API Base Paths (/api vs /api/v1)
  console.log('--- 1. AUDITING API BASE PATHS ---');
  const checkApi = await request({ method: 'GET', path: '/api/properties' });
  const checkApiV1 = await request({ method: 'GET', path: '/api/v1/properties' });
  console.log(`GET /api/properties -> Status ${checkApi.status}`);
  console.log(`GET /api/v1/properties -> Status ${checkApiV1.status}`);

  results.apiBasePath = {
    '/api': checkApi.status === 200 ? 'ACTIVE' : 'INACTIVE',
    '/api/v1': checkApiV1.status === 200 ? 'ACTIVE' : 'INACTIVE (404 Not Found)',
  };

  // 2. Audit Authentication & JWT Expiration
  console.log('\n--- 2. AUDITING AUTHENTICATION & JWT CONFIGURATION ---');
  const loginRes = await request(
    { method: 'POST', path: '/api/auth/login' },
    { email: 'admin@estatecore.local', password: 'Password123!' }
  );

  let adminToken = null;
  if (loginRes.status === 200 && loginRes.body.accessToken) {
    adminToken = loginRes.body.accessToken;
    const decoded = parseJwt(adminToken);
    const expirySeconds = decoded.exp - decoded.iat;
    console.log(`Login successful. Token decoded:`, decoded);
    console.log(`JWT Expiration Duration: ${expirySeconds}s (${expirySeconds / 3600} hours)`);

    results.jwtAudit = {
      sub: decoded.sub,
      role: decoded.role,
      issuedAt: decoded.iat,
      expiresAt: decoded.exp,
      durationSeconds: expirySeconds,
      pdfRequirementSeconds: 3600,
      matchesPdfRequirement: expirySeconds === 3600,
      discrepancyNote:
        expirySeconds === 86400
          ? 'Token expires in 24 hours (86400s). PDF Lab 06 Page 2 specifies 1 hour (3600s).'
          : `Custom expiry: ${expirySeconds}s`,
    };
  } else {
    console.error('Failed to log in as admin:', loginRes);
  }

  // Login as Client for RBAC probes
  const clientLoginRes = await request(
    { method: 'POST', path: '/api/auth/login' },
    { email: 'juan.delacruz@client.local', password: 'Password123!' }
  );
  const clientToken = clientLoginRes.body?.accessToken;

  // 3. Audit 401 Unauthorized vs 403 Forbidden
  console.log('\n--- 3. AUDITING 401 VS 403 STATUS CODES ---');
  // 401: No token on protected route
  const resNoToken = await request({ method: 'GET', path: '/api/users' });
  console.log(`GET /api/users (No token) -> Status ${resNoToken.status} (Expected 401)`);

  // 403: Client token on Admin-only route
  const resClientForbidden = await request({
    method: 'GET',
    path: '/api/users',
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  console.log(`GET /api/users (Client token) -> Status ${resClientForbidden.status} (Expected 403)`);

  results.securityChecks['401_unauthorized'] = {
    status: resNoToken.status,
    correct: resNoToken.status === 401,
    message: resNoToken.body.message,
  };
  results.securityChecks['403_forbidden'] = {
    status: resClientForbidden.status,
    correct: resClientForbidden.status === 403,
    message: resClientForbidden.body.message,
  };

  // 4. Audit Input Validation & Injection Resistance
  console.log('\n--- 4. AUDITING VALIDATION PIPE & INJECTION DEFENSE ---');
  // Non-whitelisted field rejection
  const invalidPayloadRes = await request(
    {
      method: 'POST',
      path: '/api/properties',
      headers: { Authorization: `Bearer ${adminToken}` },
    },
    {
      title: 'Valid Title Here',
      price: 5000000,
      maliciousHackerField: '<script>alert(1)</script>',
      hackedRole: 'ADMIN_OVERRIDE',
    }
  );
  console.log(
    `POST /api/properties (with forbidden fields) -> Status ${invalidPayloadRes.status} (Expected 400 Bad Request)`
  );
  results.securityChecks['input_whitelist_validation'] = {
    status: invalidPayloadRes.status,
    correct: invalidPayloadRes.status === 400,
    message: invalidPayloadRes.body.message,
  };

  // SQL Injection probe via parameterized query filter
  const sqlInjectionRes = await request({
    method: 'GET',
    path: `/api/properties?search=${encodeURIComponent("' OR 1=1 --")}`,
  });
  console.log(`GET /api/properties with SQL injection payload -> Status ${sqlInjectionRes.status}`);
  results.securityChecks['sql_injection_defense'] = {
    status: sqlInjectionRes.status,
    defended: sqlInjectionRes.status === 200 && Array.isArray(sqlInjectionRes.body),
    returnedCount: Array.isArray(sqlInjectionRes.body) ? sqlInjectionRes.body.length : 0,
  };

  // 5. Audit All 19 Required Endpoints against PDF Lab 05
  console.log('\n--- 5. AUDITING ALL 19 PDF ENDPOINTS (LAB 05) ---');
  const endpointCatalog = [
    { id: 'EP-01', method: 'POST', path: '/api/v1/auth/register', altPath: '/api/auth/register', auth: 'Public' },
    { id: 'EP-02', method: 'POST', path: '/api/v1/auth/login', altPath: '/api/auth/login', auth: 'Public' },
    { id: 'EP-03', method: 'POST', path: '/api/v1/auth/logout', altPath: '/api/auth/logout', auth: 'Authenticated' },
    { id: 'EP-04', method: 'GET', path: '/api/v1/users', altPath: '/api/users', auth: 'Admin' },
    { id: 'EP-05', method: 'GET', path: '/api/v1/users/1', altPath: '/api/users/1', auth: 'Admin / Self' },
    { id: 'EP-06', method: 'PUT', path: '/api/v1/users/1', altPath: '/api/users/1', auth: 'Admin / Self' },
    { id: 'EP-07', method: 'DELETE', path: '/api/v1/users/999', altPath: '/api/users/999', auth: 'Admin' },
    { id: 'EP-08', method: 'GET', path: '/api/v1/agents', altPath: '/api/agents', auth: 'Public / Auth' },
    { id: 'EP-09', method: 'GET', path: '/api/v1/agents/1', altPath: '/api/agents/1', auth: 'Public / Auth' },
    { id: 'EP-10', method: 'POST', path: '/api/v1/agents', altPath: '/api/agents', auth: 'Admin / Agent' },
    { id: 'EP-11', method: 'PUT', path: '/api/v1/agents/1', altPath: '/api/agents/1', auth: 'Admin / Agent' },
    { id: 'EP-12', method: 'GET', path: '/api/v1/properties', altPath: '/api/properties', auth: 'Public' },
    { id: 'EP-13', method: 'GET', path: '/api/v1/properties/1', altPath: '/api/properties/1', auth: 'Public' },
    { id: 'EP-14', method: 'POST', path: '/api/v1/properties', altPath: '/api/properties', auth: 'Agent / Admin' },
    { id: 'EP-15', method: 'PUT', path: '/api/v1/properties/1', altPath: '/api/properties/1', auth: 'Agent / Admin' },
    { id: 'EP-16', method: 'DELETE', path: '/api/v1/properties/999', altPath: '/api/properties/999', auth: 'Owner / Admin' },
    { id: 'EP-17', method: 'POST', path: '/api/v1/properties/1/photos', altPath: '/api/properties/1/photos', auth: 'Agent / Admin' },
    { id: 'EP-18', method: 'POST', path: '/api/v1/properties/1/inquiries', altPath: '/api/properties/1/inquiries', auth: 'Auth Client' },
    { id: 'EP-19', method: 'GET', path: '/api/v1/transactions', altPath: '/api/transactions', auth: 'Admin / Agent' },
  ];

  for (const ep of endpointCatalog) {
    const authHeader = ep.auth.includes('Admin')
      ? { Authorization: `Bearer ${adminToken}` }
      : ep.auth.includes('Client') || ep.auth.includes('Self') || ep.auth.includes('Authenticated')
      ? { Authorization: `Bearer ${clientToken}` }
      : {};

    // Probe required PDF path (/api/v1/...)
    const v1Res = await request({
      method: ep.method,
      path: ep.path,
      headers: authHeader,
    });

    // Probe existing implementation path (/api/...)
    const altRes = await request({
      method: ep.method,
      path: ep.altPath,
      headers: authHeader,
    });

    const isImplementedOnV1 = v1Res.status !== 404;
    const isImplementedOnAlt = altRes.status !== 404;

    console.log(
      `[${ep.id}] ${ep.method.padEnd(6)} ${ep.path.padEnd(35)} -> v1: ${v1Res.status} | /api: ${altRes.status}`
    );

    results.endpointAudit.push({
      id: ep.id,
      method: ep.method,
      requiredPath: ep.path,
      existingPath: ep.altPath,
      authRequirement: ep.auth,
      v1Status: v1Res.status,
      altStatus: altRes.status,
      implementedInV1: isImplementedOnV1,
      implementedInExistingApi: isImplementedOnAlt,
      assessment: isImplementedOnV1
        ? 'IMPLEMENTED'
        : isImplementedOnAlt
        ? 'IMPLEMENTED_WITH_PATH_DISCREPANCY'
        : 'MISSING',
    });
  }

  // 6. Check Rate Limiting Probe (Brute-force login probe)
  console.log('\n--- 6. AUDITING RATE LIMITING & ACCOUNT LOCKOUT ---');
  let rateLimited = false;
  for (let i = 0; i < 7; i++) {
    const probe = await request(
      { method: 'POST', path: '/api/auth/login' },
      { email: 'admin@estatecore.com', password: 'WrongPasswordProbe!' }
    );
    if (probe.status === 429) {
      rateLimited = true;
      break;
    }
  }
  console.log(`Rate Limiting Active: ${rateLimited ? 'YES (HTTP 429)' : 'NO (Unthrottled requests allowed)'}`);
  results.securityChecks['rate_limiting'] = {
    implemented: rateLimited,
    assessment: rateLimited ? 'PASS' : 'MISSING (No ThrottlerGuard on /auth/login)',
  };

  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'documentation', 'evidence', 'pdf_compliance_evidence.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nCompliance test data saved to: ${reportPath}`);
}

runComplianceProbes().catch((err) => {
  console.error('Fatal probe error:', err);
  process.exit(1);
});
