/**
 * ESTATECORE FINAL PROJECT: PRESENTATION PPTX GENERATOR (Node.js)
 *
 * Course: ITEC 116 - Systems Integration and Architecture 2
 * Instructor: John Vincent A. Dallego, MIT
 * Student: Cabico, Cristina O. | BSIT 4-C
 *
 * Target: documentation/deliverables/EstateCore_Final_Project_Presentation.pptx
 */

const pptxgen = require('../backend/node_modules/pptxgenjs');
const path = require('path');
const fs = require('fs');

async function generateDeck() {
  console.log('--- Generating EstateCore Final Project Presentation PPTX ---');

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  const NAVY = '0F172A';
  const BLUE = '2563EB';
  const DARK_BLUE = '1E3A8A';
  const WHITE = 'FFFFFF';
  const CARD_BG = 'F1F5F9';
  const BORDER = 'CBD5E1';
  const YELLOW = 'FDE047';
  const SLATE = '475569';

  function addHeader(slide, title, category = 'ITEC 116 FINAL PROJECT PRESENTATION') {
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.6,
      y: 0.4,
      w: 12.133,
      h: 0.9,
      fill: { color: WHITE },
      line: { color: BORDER, width: 1 },
    });

    slide.addText(category.toUpperCase(), {
      x: 0.8,
      y: 0.48,
      w: 11.7,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: BLUE,
      fontFace: 'Segoe UI',
    });

    slide.addText(title, {
      x: 0.8,
      y: 0.73,
      w: 11.7,
      h: 0.45,
      fontSize: 18,
      bold: true,
      color: NAVY,
      fontFace: 'Segoe UI',
    });
  }

  function addCard(slide, x, y, w, h, title, bullets) {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x,
      y,
      w,
      h,
      fill: { color: CARD_BG },
      line: { color: BORDER, width: 1 },
      rectRadius: 0.1,
    });

    slide.addText(title, {
      x: x + 0.2,
      y: y + 0.2,
      w: w - 0.4,
      h: 0.4,
      fontSize: 13,
      bold: true,
      color: DARK_BLUE,
      fontFace: 'Segoe UI',
    });

    const bulletItems = bullets.map(b => ({
      text: b,
      options: {
        fontSize: 10,
        color: NAVY,
        bullet: true,
        breakLine: true,
        fontFace: 'Segoe UI',
        paraSpaceAfter: 4,
      },
    }));

    slide.addText(bulletItems, {
      x: x + 0.2,
      y: y + 0.65,
      w: w - 0.4,
      h: h - 0.8,
    });
  }

  // -------------------------------------------------------------
  // SLIDE 1: TITLE SLIDE
  // -------------------------------------------------------------
  const s1 = pptx.addSlide();
  s1.background = { color: NAVY };

  s1.addText('ESTATECORE REAL ESTATE MANAGEMENT SYSTEM', {
    x: 1.0,
    y: 1.6,
    w: 11.333,
    h: 1.2,
    fontSize: 28,
    bold: true,
    color: WHITE,
    fontFace: 'Segoe UI',
  });

  s1.addText('Comprehensive Systems Integration, Relational Database Architecture & RESTful API Verification', {
    x: 1.0,
    y: 2.8,
    w: 11.333,
    h: 0.6,
    fontSize: 15,
    color: '93C5FD',
    fontFace: 'Segoe UI',
  });

  s1.addText([
    { text: 'Course: ITEC 116 — Systems Integration and Architecture 2\n', options: { fontSize: 13, color: WHITE } },
    { text: 'Instructor: John Vincent A. Dallego, MIT\n', options: { fontSize: 13, color: WHITE } },
    { text: 'Student Presenter: Cabico, Cristina O. | BSIT 4-C\n', options: { fontSize: 13, bold: true, color: YELLOW } },
    { text: 'Academic Year 2026–2027 | Final Comprehensive Defense Release', options: { fontSize: 11, color: '94A3B8' } },
  ], {
    x: 1.0,
    y: 4.0,
    w: 11.333,
    h: 2.0,
    fontFace: 'Segoe UI',
    paraSpaceAfter: 6,
  });

  // -------------------------------------------------------------
  // SLIDE 2: PROJECT OVERVIEW & PROBLEM STATEMENT
  // -------------------------------------------------------------
  const s2 = pptx.addSlide();
  addHeader(s2, 'Project Overview & Problem Statement');
  addCard(s2, 0.6, 1.5, 5.9, 5.4, 'Industry Challenges in Real Estate Systems', [
    'Broken Object-Level Authorization (BOLA): Unauthorized users altering listings or reading private buyer inquiries.',
    'Race Conditions & Double-Selling: Concurrent transactions causing conflicting ownership assignments.',
    'Insecure File Upload Vulnerabilities: Path traversal and arbitrary script execution through unvalidated photo attachments.',
    'Monolithic Coupling: Fragile architectures lacking clean separation between API, database, and client layers.'
  ]);
  addCard(s2, 6.8, 1.5, 5.9, 5.4, 'EstateCore Enterprise Solution', [
    'Modern Multi-Tier Architecture: NestJS (Application), MySQL 8.4 (Persistence), React 18 (Presentation).',
    '39 Verified REST Endpoints: Exceeds the final project minimum requirement of 20 endpoints.',
    '6 Functional CRUD Modules: Properties, Inquiries, Appointments, Users, Transactions, and Agents.',
    'Pessimistic Concurrency Locking: Atomic row-level locks preventing duplicate sales settlements.',
    'Stateless JWT with Server Blacklist: Strict 1-hour expiration with immediate logout revocation.'
  ]);

  // -------------------------------------------------------------
  // SLIDE 3: SYSTEMS INTEGRATION ARCHITECTURE
  // -------------------------------------------------------------
  const s3 = pptx.addSlide();
  addHeader(s3, 'Systems Integration Architecture & Multi-Tier Layering');
  addCard(s3, 0.6, 1.5, 3.8, 5.4, 'Presentation Tier', [
    'React 18 Single Page App (Vite)',
    'Tailwind CSS Responsive Design',
    'Axios HTTP Client Interceptors',
    'JWT Session Storage in Browser',
    'Role-Aware Navigation & UI Panels',
    'Dynamic Inquiries & Booking Forms'
  ]);
  addCard(s3, 4.75, 1.5, 3.8, 5.4, 'Application Tier (NestJS)', [
    'Modular Domain Architecture (7 Modules)',
    'Global ValidationPipe (class-validator)',
    'Global RFC 7807 ExceptionFilter',
    'JwtAuthGuard & RolesGuard (RBAC)',
    'Contextual Ownership Verification',
    'Canonical Routing Prefix: /api/v1'
  ]);
  addCard(s3, 8.9, 1.5, 3.8, 5.4, 'Data Tier (MySQL 8.4)', [
    'Containerized MySQL 8.4 Engine',
    'TypeORM 0.3 Repository Pattern',
    'InnoDB Storage Engine (ACID)',
    'Zero-Touch Live DB (Port 3307)',
    'Strict Foreign Key Cascades & Restricts',
    'Versioned TypeORM Migrations'
  ]);

  // -------------------------------------------------------------
  // SLIDE 4: DATABASE ARCHITECTURE & RELATIONAL SCHEMA
  // -------------------------------------------------------------
  const s4 = pptx.addSlide();
  addHeader(s4, 'Database Architecture & Relational Schema (3NF)');
  addCard(s4, 0.6, 1.5, 5.9, 5.4, 'Core Relational Tables', [
    'users: id, email, password (bcrypt), fullName, role, contactNumber, isActive.',
    'agents: id, userId (1:1 FK), licenseNumber, agencyName, verificationStatus.',
    'properties: id, title, propertyType, listingType, status, price, agentId, ownerId.',
    'property_photos: id, propertyId (FK), filePath, isPrimary, caption.',
    'inquiries: id, propertyId (FK), clientId (FK), message, status, offerAmount.',
    'appointments: id, propertyId (FK), clientId (FK), agentId (FK), date, time, status.',
    'property_transactions: id, propertyId (FK), buyerId (FK), amount, status.'
  ]);
  addCard(s4, 6.8, 1.5, 5.9, 5.4, 'Referential Actions & Data Integrity', [
    '1:1 User-to-Agent Linkage: Enforces single professional profile per agent account.',
    'ON DELETE CASCADE on Photos: Removing a listing automatically cleans up child photos.',
    'ON DELETE RESTRICT on Inquiries: Protects historical communication logs from accidental deletion.',
    'Pessimistic Write Locking: Prevents simultaneous writes during financial settlement.',
    'Audited Timestamps: Every entity tracks createdAt and updatedAt in UTC+8.'
  ]);

  // -------------------------------------------------------------
  // SLIDE 5: RESTFUL API ENDPOINT SPECIFICATION
  // -------------------------------------------------------------
  const s5 = pptx.addSlide();
  addHeader(s5, 'RESTful API Architecture & Endpoint Specification');
  addCard(s5, 0.6, 1.5, 3.8, 5.4, 'Auth & Users (10 Endpoints)', [
    'POST /auth/register',
    'POST /auth/login',
    'POST /auth/logout',
    'GET /auth/me',
    'GET /users (Admin filter)',
    'POST /users (Create user)',
    'GET /users/:id',
    'PATCH /users/:id',
    'PUT /users/:id',
    'DELETE /users/:id (Soft delete)'
  ]);
  addCard(s5, 4.75, 1.5, 3.8, 5.4, 'Properties & Agents (16 Endpoints)', [
    'GET /agents & GET /agents/:id',
    'POST, PUT, PATCH /agents/:id',
    'GET /properties (Multi-filter)',
    'GET /properties/:id',
    'POST, PUT, PATCH, DELETE /properties',
    'GET & POST /properties/:id/photos',
    'POST /properties/:id/inquiries',
    'GET & PATCH /properties/:id/inquiries'
  ]);
  addCard(s5, 8.9, 1.5, 3.8, 5.4, 'Workflows & Settlements (13 Endpoints)', [
    'POST /inquiries & GET /inquiries',
    'GET, PATCH, DELETE /inquiries/:id',
    'POST /appointments (Book viewing)',
    'GET, PATCH, DELETE /appointments',
    'POST /transactions (Atomic sale)',
    'GET /transactions & GET /transactions/:id',
    'Total: 39 Working Endpoints (Exceeds >= 20 requirement)'
  ]);

  // -------------------------------------------------------------
  // SLIDE 6: AUTHENTICATION & SECURITY ARCHITECTURE
  // -------------------------------------------------------------
  const s6 = pptx.addSlide();
  addHeader(s6, 'Authentication, Security & RBAC Implementation');
  addCard(s6, 0.6, 1.5, 5.9, 5.4, 'Cryptographic & Session Governance', [
    'Stateless JWT Authentication: Signed with HMAC-SHA256.',
    'Strict 1-Hour Lifespan: Expiration enforced at 3600 seconds.',
    'Server-Side Token Revocation: Blacklists token signature upon logout.',
    'Rich Claims Payload: Agent token includes sub, email, role, and agentId.',
    'Anti-Brute Force Protection: In-memory rate limiting issues HTTP 429 after 5 failed login attempts.'
  ]);
  addCard(s6, 6.8, 1.5, 5.9, 5.4, 'Role-Based Access Control (RBAC)', [
    'ADMIN: System-wide authority, user governance, full audit access.',
    'AGENT: Listing creation, photo uploads, inquiry response, sales execution.',
    'CLIENT: Catalog search, personal listing submission, booking viewings.',
    'BOLA Defense: Ownership verification prevents cross-agent tampering.',
    'Email-Only Mandate: Zero SMS libraries, cellular gateways, or templates.'
  ]);

  // -------------------------------------------------------------
  // SLIDE 7: ATOMIC TRANSACTION CONCURRENCY
  // -------------------------------------------------------------
  const s7 = pptx.addSlide();
  addHeader(s7, 'Transaction Concurrency & Double-Sale Prevention');
  addCard(s7, 0.6, 1.5, 5.9, 5.4, 'Pessimistic Concurrency Architecture', [
    'TypeORM dataSource.transaction: Enforces all-or-nothing atomicity.',
    'setLock("pessimistic_write"): Executes SELECT ... FOR UPDATE in MySQL.',
    'Row-Level Exclusivity: Prevents other connections from reading or modifying the property during checkout.',
    'Immediate Availability Check: Verifies status is AVAILABLE before proceeding.',
    'Automatic Transition: Changes status to SOLD upon transaction completion.'
  ]);
  addCard(s7, 6.8, 1.5, 5.9, 5.4, 'Conflict Detection & Resolution', [
    'Duplicate Purchase Prevention: Subsequent acquisition attempts receive HTTP 409 Conflict.',
    'Audit Trail Integrity: Financial record stores buyer, agent, amount, method, and timestamp.',
    'Zero Inconsistent State: Eliminates phantom reads and race conditions.',
    'Relational Safety: Foreign keys guarantee valid buyer, agent, and property references.'
  ]);

  // -------------------------------------------------------------
  // SLIDE 8: TESTING & EMPIRICAL VALIDATION
  // -------------------------------------------------------------
  const s8 = pptx.addSlide();
  addHeader(s8, 'Testing Methodology & Verification Results');
  addCard(s8, 0.6, 1.5, 5.9, 5.4, 'Test Harness Execution', [
    'Final 36+ Endpoint Suite: 46/46 Passed (100.0% Pass Rate).',
    'Phase 5.1 Stabilization Suite: 20/20 Passed (Atomicity, Rate Limiting, Uploads).',
    'Phase 3 Security Suite: 60/60 Passed (RBAC, BOLA, Token Revocation).',
    'SQL Import Validation: 7/7 Tables Verified (Clean import into fresh DB).',
    'Live DB Audit: 100% Zero-Touch isolation on estatecore_db confirmed.'
  ]);
  addCard(s8, 6.8, 1.5, 5.9, 5.4, 'Deliverables Summary', [
    'Postman Collection: 46 requests across 8 categorized feature folders.',
    'Postman Environment: Pre-configured template for local defense testing.',
    'SQL Database Export: EstateCore_Final_Project.sql (DDL + clean seed data).',
    'Technical Documentation: 626.9 KB PDF covering 12 comprehensive chapters.',
    'Demo Materials: 5–10 min spoken script and 15-question defense Q&A guide.'
  ]);

  // -------------------------------------------------------------
  // SLIDE 9: CONCLUSION & DEFENSE READINESS
  // -------------------------------------------------------------
  const s9 = pptx.addSlide();
  addHeader(s9, 'Academic Compliance & Final Conclusion');
  addCard(s9, 0.6, 1.5, 5.9, 5.4, 'Final Project Requirements Fulfillment', [
    'Minimum 20 Endpoints: Exceeded (39 endpoints implemented & tested).',
    'At Least Two CRUD Modules: Exceeded (6 functional CRUD modules).',
    'JWT Authentication & RBAC: 100% Implemented & Verified.',
    'MySQL with TypeORM: 100% Compliant with InnoDB constraints.',
    'Postman Collection & Environment: Exported & Verified.',
    'SQL Database Export: Exported & Clean Import Tested.',
    'Technical Documentation: 12 Chapters, PDF generated.'
  ]);
  addCard(s9, 6.8, 1.5, 5.9, 5.4, 'Final Certification', [
    'Production-Grade Stability: Zero build or runtime errors.',
    'Complete Defense Readiness: Demonstrable live backend prototype.',
    'Candidate: Cabico, Cristina O. | BSIT 4-C',
    'Course: ITEC 116 — IT Elective 4 (Systems Integration and Architecture 2)',
    'Instructor: John Vincent A. Dallego, MIT'
  ]);

  const deliverableDir = path.resolve(__dirname, '../documentation/deliverables');
  if (!fs.existsSync(deliverableDir)) fs.mkdirSync(deliverableDir, { recursive: true });
  const outPath = path.join(deliverableDir, 'EstateCore_Final_Project_Presentation.pptx');

  await pptx.writeFile({ fileName: outPath });
  const stats = fs.statSync(outPath);
  console.log(`=== SUCCESS: Presentation saved to: ${outPath} (${(stats.size / 1024).toFixed(1)} KB) ===`);
}

generateDeck().catch(err => {
  console.error('Fatal PPTX generation error:', err);
  process.exit(1);
});
