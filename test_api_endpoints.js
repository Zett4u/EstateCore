const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data, raw: data });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING ESTATECORE 22+ ENDPOINT LIVE VERIFICATION ===\n');
  const results = [];

  function record(name, endpoint, method, expectedStatus, actualStatus, pass, details) {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${method} ${endpoint} (Status: ${actualStatus}) - ${name}`);
    results.push({ name, endpoint, method, expectedStatus, actualStatus, pass, details });
  }

  // 1. Unauthenticated rejection
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
    });
    record('Protected Route Rejection (No Token)', '/api/auth/me', 'GET', 401, res.status, res.status === 401, res.data);
  } catch (err) {
    console.error(err);
  }

  // 2. Auth: Register new Client
  let testClientToken = '';
  let registeredUserId = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      fullName: 'Test Registered Buyer',
      email: `testbuyer_${Date.now()}@test.local`,
      password: 'Password123!',
    });
    testClientToken = res.data?.accessToken;
    registeredUserId = res.data?.user?.id;
    record('Register New Client', '/api/auth/register', 'POST', 201, res.status, res.status === 201, { userId: registeredUserId, role: res.data?.user?.role });
  } catch (err) {
    console.error(err);
  }

  // 3. Auth: Login as Admin
  let adminToken = '';
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'admin@estatecore.local',
      password: 'Password123!',
    });
    adminToken = res.data?.accessToken;
    record('Login as Administrator', '/api/auth/login', 'POST', 200, res.status, res.status === 200, { email: res.data?.user?.email, role: res.data?.user?.role });
  } catch (err) {
    console.error(err);
  }

  // 4. Auth: Login as Agent
  let agentToken = '';
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'maria.santos@estatecore.local',
      password: 'Password123!',
    });
    agentToken = res.data?.accessToken;
    record('Login as Agent', '/api/auth/login', 'POST', 200, res.status, res.status === 200, { email: res.data?.user?.email, role: res.data?.user?.role });
  } catch (err) {
    console.error(err);
  }

  // 5. Auth: Login as Client
  let clientToken = '';
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'juan.delacruz@client.local',
      password: 'Password123!',
    });
    clientToken = res.data?.accessToken;
    record('Login as Client', '/api/auth/login', 'POST', 200, res.status, res.status === 200, { email: res.data?.user?.email, role: res.data?.user?.role });
  } catch (err) {
    console.error(err);
  }

  // 6. Auth: GET /api/auth/me
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Current User Profile (/me)', '/api/auth/me', 'GET', 200, res.status, res.status === 200, res.data);
  } catch (err) {
    console.error(err);
  }

  // 7. Users: GET /api/users (Admin only)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('List Users (Admin)', '/api/users', 'GET', 200, res.status, res.status === 200, { count: res.data.length });
  } catch (err) {
    console.error(err);
  }

  // 8. Users: Forbidden test (Client trying to GET /api/users)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    record('RolesGuard Forbidden Check', '/api/users', 'GET', 403, res.status, res.status === 403, res.data);
  } catch (err) {
    console.error(err);
  }

  // 9. Users: GET /api/users/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/1',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Get User by ID', '/api/users/1', 'GET', 200, res.status, res.status === 200, { fullName: res.data.fullName, role: res.data.role });
  } catch (err) {
    console.error(err);
  }

  // 10. Users: PATCH /api/users/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/users/${registeredUserId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      fullName: 'Updated Test Buyer Name',
    });
    record('Update User Details', `/api/users/${registeredUserId}`, 'PATCH', 200, res.status, res.status === 200, { fullName: res.data.fullName });
  } catch (err) {
    console.error(err);
  }

  // 11. Users: DELETE /api/users/:id (safe deactivation)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/users/${registeredUserId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Deactivate User', `/api/users/${registeredUserId}`, 'DELETE', 200, res.status, res.status === 200, res.data);
  } catch (err) {
    console.error(err);
  }

  // 12. Properties: GET /api/properties (Filterable)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/properties?propertyType=CONDOMINIUM&listingType=SALE',
      method: 'GET',
    });
    record('List Filtered Properties', '/api/properties?propertyType=CONDOMINIUM&listingType=SALE', 'GET', 200, res.status, res.status === 200, { count: res.data.length });
  } catch (err) {
    console.error(err);
  }

  // 13. Properties: GET /api/properties/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/properties/1',
      method: 'GET',
    });
    record('Get Property Details', '/api/properties/1', 'GET', 200, res.status, res.status === 200, { title: res.data.title, price: res.data.price });
  } catch (err) {
    console.error(err);
  }

  // 14. Properties: POST /api/properties (Agent creates listing)
  let createdPropId = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/properties',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
    }, {
      title: 'Modern Sunset Penthouse with Balcony',
      description: 'Exclusive 3-bedroom luxury penthouse overlooking Manila Bay sunset.',
      propertyType: 'CONDOMINIUM',
      listingType: 'SALE',
      price: 32000000,
      location: 'Pasay City, Metro Manila',
      address: 'Seaside Boulevard, Mall of Asia Complex',
      bedrooms: 3,
      bathrooms: 3,
      floorArea: 210,
      lotArea: 0,
      status: 'AVAILABLE',
    });
    createdPropId = res.data.id;
    record('Create Property Listing', '/api/properties', 'POST', 201, res.status, res.status === 201, { id: createdPropId, title: res.data.title });
  } catch (err) {
    console.error(err);
  }

  // 15. Properties: PATCH /api/properties/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/properties/${createdPropId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
    }, {
      price: 31500000,
      status: 'RESERVED',
    });
    record('Update Property Listing', `/api/properties/${createdPropId}`, 'PATCH', 200, res.status, res.status === 200, { price: res.data.price, status: res.data.status });
  } catch (err) {
    console.error(err);
  }

  // 16. Inquiries: POST /api/inquiries (Client submits inquiry)
  let createdInquiryId = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/inquiries',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
    }, {
      propertyId: 1,
      subject: 'Inquiry on Downpayment Schemes',
      message: 'Hello, what are the bank amortization terms for a 20% downpayment on this unit?',
      contactNumber: '+63 918 123 4567',
    });
    createdInquiryId = res.data.id;
    record('Submit Property Inquiry', '/api/inquiries', 'POST', 201, res.status, res.status === 201, { id: createdInquiryId, status: res.data.status });
  } catch (err) {
    console.error(err);
  }

  // 17. Inquiries: GET /api/inquiries
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/inquiries',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('List Inquiries', '/api/inquiries', 'GET', 200, res.status, res.status === 200, { count: res.data.length });
  } catch (err) {
    console.error(err);
  }

  // 18. Inquiries: GET /api/inquiries/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/inquiries/${createdInquiryId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    record('Get Inquiry Details', `/api/inquiries/${createdInquiryId}`, 'GET', 200, res.status, res.status === 200, { subject: res.data.subject });
  } catch (err) {
    console.error(err);
  }

  // 19. Inquiries: PATCH /api/inquiries/:id (Agent updates status)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/inquiries/${createdInquiryId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
    }, {
      status: 'QUALIFIED',
    });
    record('Update Inquiry Status', `/api/inquiries/${createdInquiryId}`, 'PATCH', 200, res.status, res.status === 200, { status: res.data.status });
  } catch (err) {
    console.error(err);
  }

  // 20. Appointments: POST /api/appointments (Client schedules viewing)
  let createdApptId = null;
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/appointments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      },
    }, {
      propertyId: 1,
      appointmentDate: '2026-12-15',
      appointmentTime: '15:00',
      notes: 'Client request weekend afternoon on-site visit.',
    });
    createdApptId = res.data.id;
    record('Schedule Viewing Appointment', '/api/appointments', 'POST', 201, res.status, res.status === 201, { id: createdApptId, date: res.data.appointmentDate });
  } catch (err) {
    console.error(err);
  }

  // 21. Appointments: GET /api/appointments
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/appointments',
      method: 'GET',
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    record('List Appointments', '/api/appointments', 'GET', 200, res.status, res.status === 200, { count: res.data.length });
  } catch (err) {
    console.error(err);
  }

  // 22. Appointments: GET /api/appointments/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/appointments/${createdApptId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    record('Get Appointment Details', `/api/appointments/${createdApptId}`, 'GET', 200, res.status, res.status === 200, { time: res.data.appointmentTime });
  } catch (err) {
    console.error(err);
  }

  // 23. Appointments: PATCH /api/appointments/:id (Agent confirms appointment)
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/appointments/${createdApptId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${agentToken}`,
      },
    }, {
      status: 'CONFIRMED',
      notes: 'Confirmed by Agent Maria Santos. Key retrieved from concierge.',
    });
    record('Update Appointment Status', `/api/appointments/${createdApptId}`, 'PATCH', 200, res.status, res.status === 200, { status: res.data.status });
  } catch (err) {
    console.error(err);
  }

  // 24. Appointments: DELETE /api/appointments/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/appointments/${createdApptId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    record('Cancel/Delete Appointment', `/api/appointments/${createdApptId}`, 'DELETE', 200, res.status, res.status === 200, res.data);
  } catch (err) {
    console.error(err);
  }

  // 25. Inquiries: DELETE /api/inquiries/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/inquiries/${createdInquiryId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    record('Delete Inquiry', `/api/inquiries/${createdInquiryId}`, 'DELETE', 200, res.status, res.status === 200, res.data);
  } catch (err) {
    console.error(err);
  }

  // 26. Properties: DELETE /api/properties/:id
  try {
    const res = await request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/properties/${createdPropId}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${agentToken}` },
    });
    record('Delete Property Listing', `/api/properties/${createdPropId}`, 'DELETE', 200, res.status, res.status === 200, res.data);
  } catch (err) {
    console.error(err);
  }

  const passedCount = results.filter(r => r.pass).length;
  console.log(`\n=== VERIFICATION SUMMARY: ${passedCount}/${results.length} TESTS PASSED ===\n`);

  const fs = require('fs');
  fs.writeFileSync('documentation/evidence/api_test_results.json', JSON.stringify(results, null, 2));
  console.log('Saved verification results to documentation/evidence/api_test_results.json');
}

runTests().catch(console.error);
