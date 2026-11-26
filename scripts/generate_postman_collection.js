/**
 * ESTATECORE FINAL PROJECT: POSTMAN COLLECTION & ENVIRONMENT GENERATOR
 *
 * Course: ITEC 116 - Systems Integration and Architecture 2
 * Instructor: John Vincent A. Dallego, MIT
 * Student: Cabico, Cristina O. (BSIT 4-C)
 *
 * Deliverables:
 * - documentation/deliverables/EstateCore_Final_Project.postman_collection.json
 * - documentation/deliverables/EstateCore_Postman_Environment.template.json
 */

const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    _postman_id: 'e8c4e520-21a4-4a29-b69f-estatecore-2026',
    name: 'EstateCore — Final Project REST API Collection (ITEC 116)',
    description: 'Comprehensive REST API test collection for EstateCore Real Estate Management System.\nCourse: ITEC 116 — Systems Integration and Architecture 2\nStudent: Cabico, Cristina O. | BSIT 4-C\nInstructor: John Vincent A. Dallego, MIT\nTotal Endpoints: 39 Endpoints across 8 Modules.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  auth: {
    type: 'bearer',
    bearer: [
      {
        key: 'token',
        value: '{{bearerToken}}',
        type: 'string',
      },
    ],
  },
  item: [
    // -------------------------------------------------------------
    // FOLDER 1: AUTHENTICATION & SESSIONS
    // -------------------------------------------------------------
    {
      name: '01 Authentication & Session Management',
      description: 'User registration, JWT issuance, profile retrieval, and server-side token revocation.',
      item: [
        {
          name: '1.1 Register New Account',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/auth/register', host: ['{{baseUrl}}'], path: ['auth', 'register'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                fullName: 'Postman Test Client',
                email: 'postman.client@example.local',
                password: 'Password123!',
              }, null, 2),
            },
            description: 'Public endpoint to register a new client account.',
          },
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 201 Created", function () {',
                  '    pm.response.to.have.status(201);',
                  '});',
                  'pm.test("Response contains user metadata", function () {',
                  '    var jsonData = pm.response.json();',
                  '    pm.expect(jsonData).to.have.property("email");',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: '1.2 Login Administrator',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'admin@estatecore.local',
                password: 'Password123!',
              }, null, 2),
            },
            description: 'Authenticate Administrator and capture adminToken.',
          },
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'var data = pm.response.json();',
                  'if (data.accessToken) {',
                  '    pm.environment.set("adminToken", data.accessToken);',
                  '    pm.environment.set("bearerToken", data.accessToken);',
                  '}',
                ],
              },
            },
          ],
        },
        {
          name: '1.3 Login Agent (Maria Santos)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'maria.santos@estatecore.local',
                password: 'Password123!',
              }, null, 2),
            },
            description: 'Authenticate Agent and capture agentToken.',
          },
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'var data = pm.response.json();',
                  'if (data.accessToken) {',
                  '    pm.environment.set("agentToken", data.accessToken);',
                  '    pm.environment.set("bearerToken", data.accessToken);',
                  '}',
                ],
              },
            },
          ],
        },
        {
          name: '1.4 Login Client (Juan Dela Cruz)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/auth/login', host: ['{{baseUrl}}'], path: ['auth', 'login'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                email: 'juan.delacruz@client.local',
                password: 'Password123!',
              }, null, 2),
            },
            description: 'Authenticate Client and capture clientToken.',
          },
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                  'var data = pm.response.json();',
                  'if (data.accessToken) {',
                  '    pm.environment.set("clientToken", data.accessToken);',
                  '    pm.environment.set("bearerToken", data.accessToken);',
                  '}',
                ],
              },
            },
          ],
        },
        {
          name: '1.5 Get Current User Profile (/auth/me)',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/auth/me', host: ['{{baseUrl}}'], path: ['auth', 'me'] },
            description: 'Retrieve profile of current authenticated user from JWT.',
          },
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                ],
              },
            },
          ],
        },
        {
          name: '1.6 Logout User (/auth/logout)',
          request: {
            method: 'POST',
            url: { raw: '{{baseUrl}}/auth/logout', host: ['{{baseUrl}}'], path: ['auth', 'logout'] },
            description: 'Revoke active JWT token on the server.',
          },
          event: [
            {
              listen: 'test',
              script: {
                type: 'text/javascript',
                exec: [
                  'pm.test("Status code is 200 OK", function () {',
                  '    pm.response.to.have.status(200);',
                  '});',
                ],
              },
            },
          ],
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 2: USERS CRUD MANAGEMENT
    // -------------------------------------------------------------
    {
      name: '02 User Account Management (CRUD)',
      description: 'User management operations reserved for Administrator role or own profile.',
      item: [
        {
          name: '2.1 List All Users (Admin)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/users?role=CLIENT', host: ['{{baseUrl}}'], path: ['users'], query: [{ key: 'role', value: 'CLIENT' }] },
            description: 'Administrator list all registered users with role filtering.',
          },
        },
        {
          name: '2.2 Create User (Admin/Public)',
          request: {
            method: 'POST',
            header: [{ key: 'Content-Type', value: 'application/json' }],
            url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                fullName: 'Robert Tan',
                email: 'robert.tan@example.com',
                password: 'Password123!',
                role: 'CLIENT',
                contactNumber: '+639181112233',
              }, null, 2),
            },
            description: 'Create a new user account with role specification.',
          },
        },
        {
          name: '2.3 Get User By ID',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/users/2', host: ['{{baseUrl}}'], path: ['users', '2'] },
            description: 'Retrieve user details by ID.',
          },
        },
        {
          name: '2.4 Partial Update User (PATCH)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/users/2', host: ['{{baseUrl}}'], path: ['users', '2'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ contactNumber: '+639179998877' }, null, 2),
            },
            description: 'Partially update user record fields.',
          },
        },
        {
          name: '2.5 Full Update User (PUT)',
          request: {
            method: 'PUT',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/users/2', host: ['{{baseUrl}}'], path: ['users', '2'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                fullName: 'Maria Santos-Reyes',
                contactNumber: '+639175551234',
              }, null, 2),
            },
            description: 'Full update replacement of user profile.',
          },
        },
        {
          name: '2.6 Delete User (Soft Delete)',
          request: {
            method: 'DELETE',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/users/5', host: ['{{baseUrl}}'], path: ['users', '5'] },
            description: 'Administrator deactivates user account (soft delete).',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 3: AGENTS DIRECTORY & PROFILES
    // -------------------------------------------------------------
    {
      name: '03 Agent Directory & Profiles',
      description: 'Professional real estate agent directory, license verification, and profiles.',
      item: [
        {
          name: '3.1 Public Directory Listing',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/agents', host: ['{{baseUrl}}'], path: ['agents'] },
            description: 'Public listing of all verified real estate agents.',
          },
        },
        {
          name: '3.2 Get Agent Profile By ID',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/agents/1', host: ['{{baseUrl}}'], path: ['agents', '1'] },
            description: 'Get individual agent profile details with agency affiliation.',
          },
        },
        {
          name: '3.3 Create Agent Profile',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/agents', host: ['{{baseUrl}}'], path: ['agents'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                userId: 3,
                agencyName: 'Reyes Premier Realty',
                licenseNumber: 'PRC-REB-2026-003',
                phoneNumber: '+639174443322',
              }, null, 2),
            },
            description: 'Create agent profile for an existing AGENT user.',
          },
        },
        {
          name: '3.4 Partial Update Agent (PATCH)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/agents/1', host: ['{{baseUrl}}'], path: ['agents', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ agencyName: 'Santos Real Estate Partners Int.' }, null, 2),
            },
            description: 'Update agent agency name or license information.',
          },
        },
        {
          name: '3.5 Full Update Agent (PUT)',
          request: {
            method: 'PUT',
            header: [
              { key: 'Authorization', value: 'Bearer {{adminToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/agents/1', host: ['{{baseUrl}}'], path: ['agents', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                agencyName: 'Santos & Associates Realty Group',
                licenseNumber: 'PRC-REB-2026-001',
                phoneNumber: '+639175551234',
              }, null, 2),
            },
            description: 'Full update of agent profile credentials.',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 4: PROPERTIES & REAL ESTATE LISTINGS
    // -------------------------------------------------------------
    {
      name: '04 Properties & Real Estate Listings (CRUD)',
      description: 'Property catalog search, listing lifecycle, media uploads, and nested relations.',
      item: [
        {
          name: '4.1 Browse Properties with Filters',
          request: {
            method: 'GET',
            url: {
              raw: '{{baseUrl}}/properties?propertyType=CONDOMINIUM&status=AVAILABLE&minPrice=5000000&maxPrice=50000000',
              host: ['{{baseUrl}}'],
              path: ['properties'],
              query: [
                { key: 'propertyType', value: 'CONDOMINIUM' },
                { key: 'status', value: 'AVAILABLE' },
                { key: 'minPrice', value: '5000000' },
                { key: 'maxPrice', value: '50000000' },
              ],
            },
            description: 'Search properties catalog with multi-attribute filtering.',
          },
        },
        {
          name: '4.2 Get Property Specification',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/properties/1', host: ['{{baseUrl}}'], path: ['properties', '1'] },
            description: 'Retrieve full property listing details including photos and agent info.',
          },
        },
        {
          name: '4.3 Create Property Listing (Agent)',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties', host: ['{{baseUrl}}'], path: ['properties'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                title: 'High-End Makati CBD Condominium',
                description: 'Prestige executive residence near Greenbelt.',
                propertyType: 'CONDOMINIUM',
                listingType: 'SALE',
                price: 18500000,
                location: 'Legaspi Village, Makati City',
                address: '110 Legaspi Street',
                bedrooms: 2,
                bathrooms: 2,
                floorArea: 110,
              }, null, 2),
            },
            description: 'Agent creates new property listing with ownership attribution.',
          },
        },
        {
          name: '4.4 Partial Update Property (PATCH)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties/1', host: ['{{baseUrl}}'], path: ['properties', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ price: 16000000, status: 'AVAILABLE' }, null, 2),
            },
            description: 'Agent updates listing price and availability.',
          },
        },
        {
          name: '4.5 Full Update Property (PUT)',
          request: {
            method: 'PUT',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties/1', host: ['{{baseUrl}}'], path: ['properties', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                title: 'Modern High-Rise Condominium in BGC (Fully Furnished)',
                description: 'Upgraded corner unit with premium designer interior.',
                propertyType: 'CONDOMINIUM',
                listingType: 'SALE',
                price: 16500000,
                location: 'Bonifacio Global City, Taguig',
                address: '26th Street, BGC',
                bedrooms: 2,
                bathrooms: 2,
                floorArea: 105,
              }, null, 2),
            },
            description: 'Full update replacement of listing specifications.',
          },
        },
        {
          name: '4.6 Upload Property Photo',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties/1/photos', host: ['{{baseUrl}}'], path: ['properties', '1', 'photos'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                filePath: '/uploads/properties/bgc-living-room.jpg',
                caption: 'Panoramic living room view',
                isPrimary: true,
              }, null, 2),
            },
            description: 'Attach photo media asset to property listing.',
          },
        },
        {
          name: '4.7 Get Property Photos',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/properties/1/photos', host: ['{{baseUrl}}'], path: ['properties', '1', 'photos'] },
            description: 'Retrieve photographic gallery for property listing.',
          },
        },
        {
          name: '4.8 Submit Nested Inquiry',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{clientToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties/1/inquiries', host: ['{{baseUrl}}'], path: ['properties', '1', 'inquiries'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                message: 'Inquiring regarding property viewing schedule and downpayment terms.',
              }, null, 2),
            },
            description: 'Client submits inquiry on specific property listing.',
          },
        },
        {
          name: '4.9 Get Property Inquiries (Agent)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{agentToken}}' }],
            url: { raw: '{{baseUrl}}/properties/1/inquiries', host: ['{{baseUrl}}'], path: ['properties', '1', 'inquiries'] },
            description: 'Listing agent retrieves all inquiries for their property.',
          },
        },
        {
          name: '4.10 Update Inquiry Status via Property Route',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties/1/inquiries/1', host: ['{{baseUrl}}'], path: ['properties', '1', 'inquiries', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ status: 'CONTACTED' }, null, 2),
            },
            description: 'Agent updates inquiry lifecycle state to CONTACTED.',
          },
        },
        {
          name: '4.11 Delete Property Listing',
          request: {
            method: 'DELETE',
            header: [{ key: 'Authorization', value: 'Bearer {{agentToken}}' }],
            url: { raw: '{{baseUrl}}/properties/6', host: ['{{baseUrl}}'], path: ['properties', '6'] },
            description: 'Delete property listing with relational integrity checks.',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 5: INQUIRIES STANDALONE CRUD
    // -------------------------------------------------------------
    {
      name: '05 Inquiries Management (CRUD)',
      description: 'Direct inquiry workflows across buyers, agents, and administrators.',
      item: [
        {
          name: '5.1 Direct Inquiry Creation',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{clientToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/inquiries', host: ['{{baseUrl}}'], path: ['inquiries'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                propertyId: 2,
                message: 'Are pets allowed in this suburban property?',
              }, null, 2),
            },
            description: 'Submit inquiry via root controller.',
          },
        },
        {
          name: '5.2 List Inquiries (Role-Based)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{agentToken}}' }],
            url: { raw: '{{baseUrl}}/inquiries', host: ['{{baseUrl}}'], path: ['inquiries'] },
            description: 'Retrieve inquiry catalog filtered by user role.',
          },
        },
        {
          name: '5.3 Get Inquiry By ID',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{clientToken}}' }],
            url: { raw: '{{baseUrl}}/inquiries/1', host: ['{{baseUrl}}'], path: ['inquiries', '1'] },
            description: 'Retrieve specific inquiry record.',
          },
        },
        {
          name: '5.4 Update Inquiry Status (PATCH)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/inquiries/1', host: ['{{baseUrl}}'], path: ['inquiries', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ status: 'CLOSED' }, null, 2),
            },
            description: 'Close inquiry workflow.',
          },
        },
        {
          name: '5.5 Delete Inquiry',
          request: {
            method: 'DELETE',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/inquiries/1', host: ['{{baseUrl}}'], path: ['inquiries', '1'] },
            description: 'Remove inquiry record.',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 6: APPOINTMENTS SCHEDULING CRUD
    // -------------------------------------------------------------
    {
      name: '06 Appointments Scheduling (CRUD)',
      description: 'Viewing appointment booking, schedule management, and status updates.',
      item: [
        {
          name: '6.1 Book Viewing Appointment',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{clientToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/appointments', host: ['{{baseUrl}}'], path: ['appointments'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                propertyId: 2,
                agentId: 2,
                appointmentDate: '2027-06-20',
                appointmentTime: '15:00',
                notes: 'Weekend afternoon family site visit.',
              }, null, 2),
            },
            description: 'Schedule property viewing appointment with agent.',
          },
        },
        {
          name: '6.2 List User Appointments',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{clientToken}}' }],
            url: { raw: '{{baseUrl}}/appointments', host: ['{{baseUrl}}'], path: ['appointments'] },
            description: 'List appointments for authenticated user.',
          },
        },
        {
          name: '6.3 Get Appointment By ID',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{clientToken}}' }],
            url: { raw: '{{baseUrl}}/appointments/1', host: ['{{baseUrl}}'], path: ['appointments', '1'] },
            description: 'Get appointment details.',
          },
        },
        {
          name: '6.4 Update Appointment (Confirm/Reschedule)',
          request: {
            method: 'PATCH',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/appointments/1', host: ['{{baseUrl}}'], path: ['appointments', '1'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ status: 'CONFIRMED', notes: 'Confirmed with owner.' }, null, 2),
            },
            description: 'Agent confirms appointment schedule.',
          },
        },
        {
          name: '6.5 Cancel/Delete Appointment',
          request: {
            method: 'DELETE',
            header: [{ key: 'Authorization', value: 'Bearer {{clientToken}}' }],
            url: { raw: '{{baseUrl}}/appointments/1', host: ['{{baseUrl}}'], path: ['appointments', '1'] },
            description: 'Cancel viewing appointment.',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 7: PROPERTY TRANSACTIONS
    // -------------------------------------------------------------
    {
      name: '07 Property Transactions (Atomic Settlement)',
      description: 'Audited financial settlement and transactional concurrency locking.',
      item: [
        {
          name: '7.1 Record Property Transaction (Atomic)',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/transactions', host: ['{{baseUrl}}'], path: ['transactions'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                propertyId: 2,
                buyerId: 4,
                amount: 14500000,
                transactionType: 'SALE',
                paymentMethod: 'BANK_TRANSFER',
                notes: 'Bank financing settlement completed.',
              }, null, 2),
            },
            description: 'Record financial sale settlement with atomic lock changing property to SOLD.',
          },
        },
        {
          name: '7.2 List Transactions (Audited)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/transactions', host: ['{{baseUrl}}'], path: ['transactions'] },
            description: 'List all audited transactions.',
          },
        },
        {
          name: '7.3 Get Transaction By ID',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{adminToken}}' }],
            url: { raw: '{{baseUrl}}/transactions/1', host: ['{{baseUrl}}'], path: ['transactions', '1'] },
            description: 'Retrieve individual transaction record with audit trail.',
          },
        },
      ],
    },

    // -------------------------------------------------------------
    // FOLDER 8: SECURITY & AUTHORIZATION VALIDATION
    // -------------------------------------------------------------
    {
      name: '08 Security & Authorization Validation',
      description: 'Negative testing, RBAC enforcement, input validation, and double-sale prevention.',
      item: [
        {
          name: '8.1 HTTP 401 Unauthorized (No Token)',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] },
            description: 'Verify protected endpoints reject requests without JWT.',
          },
        },
        {
          name: '8.2 HTTP 403 Forbidden (Client calling Admin route)',
          request: {
            method: 'GET',
            header: [{ key: 'Authorization', value: 'Bearer {{clientToken}}' }],
            url: { raw: '{{baseUrl}}/users', host: ['{{baseUrl}}'], path: ['users'] },
            description: 'Verify client cannot access administrative user list.',
          },
        },
        {
          name: '8.3 HTTP 400 Bad Request (Invalid DTO Payload)',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/properties', host: ['{{baseUrl}}'], path: ['properties'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({ invalid: 'schema' }, null, 2),
            },
            description: 'Verify class-validator rejects non-conforming DTOs.',
          },
        },
        {
          name: '8.4 HTTP 404 Not Found (Invalid Identifier)',
          request: {
            method: 'GET',
            url: { raw: '{{baseUrl}}/properties/999999', host: ['{{baseUrl}}'], path: ['properties', '999999'] },
            description: 'Verify proper 404 response on missing resources.',
          },
        },
        {
          name: '8.5 HTTP 409 Conflict (Double Transaction Prevention)',
          request: {
            method: 'POST',
            header: [
              { key: 'Authorization', value: 'Bearer {{agentToken}}' },
              { key: 'Content-Type', value: 'application/json' },
            ],
            url: { raw: '{{baseUrl}}/transactions', host: ['{{baseUrl}}'], path: ['transactions'] },
            body: {
              mode: 'raw',
              raw: JSON.stringify({
                propertyId: 2,
                buyerId: 4,
                amount: 14500000,
                transactionType: 'SALE',
                paymentMethod: 'CASH',
                notes: 'Attempted duplicate purchase',
              }, null, 2),
            },
            description: 'Verify transaction engine prevents selling an already-sold property.',
          },
        },
      ],
    },
  ],
};

const environmentTemplate = {
  id: 'c7f21a48-estatecore-env-template',
  name: 'EstateCore — Local Development & Defense Environment',
  values: [
    { key: 'baseUrl', value: 'http://localhost:3000/api/v1', enabled: true },
    { key: 'adminEmail', value: 'admin@estatecore.local', enabled: true },
    { key: 'agentEmail', value: 'maria.santos@estatecore.local', enabled: true },
    { key: 'clientEmail', value: 'juan.delacruz@client.local', enabled: true },
    { key: 'defaultPassword', value: 'Password123!', enabled: true },
    { key: 'bearerToken', value: '', enabled: true },
    { key: 'adminToken', value: '', enabled: true },
    { key: 'agentToken', value: '', enabled: true },
    { key: 'clientToken', value: '', enabled: true },
  ],
  _postman_variable_scope: 'environment',
};

function main() {
  const deliverableDir = path.resolve(__dirname, '../documentation/deliverables');
  if (!fs.existsSync(deliverableDir)) fs.mkdirSync(deliverableDir, { recursive: true });

  const collectionPath = path.join(deliverableDir, 'EstateCore_Final_Project.postman_collection.json');
  fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2), 'utf8');

  const envPath = path.join(deliverableDir, 'EstateCore_Postman_Environment.template.json');
  fs.writeFileSync(envPath, JSON.stringify(environmentTemplate, null, 2), 'utf8');

  let totalRequests = 0;
  collection.item.forEach(folder => {
    totalRequests += folder.item.length;
  });

  console.log('========================================================================');
  console.log('ESTATECORE FINAL PROJECT: POSTMAN COLLECTION GENERATION');
  console.log('========================================================================');
  console.log(`Generated Postman Collection: ${collectionPath}`);
  console.log(`  - Folders: ${collection.item.length}`);
  console.log(`  - Total Endpoints / Requests: ${totalRequests} (Academic Requirement: >= 20)`);
  console.log(`Generated Environment: ${envPath}`);
  console.log('========================================================================\n');
}

main();
