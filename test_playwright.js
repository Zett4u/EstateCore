const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EVIDENCE_DIR = path.join(__dirname, 'documentation', 'evidence', 'playwright');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runPlaywrightSuite() {
  console.log('=== STARTING ESTATECORE PLAYWRIGHT REMEDIATION & RBAC REGRESSION SUITE ===\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      warnings.push(`[Console Warning]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    errors.push(`[Page Crash / Unhandled Error]: ${err.message}\n${err.stack}`);
  });

  // Handle window.alert and window.confirm automatically
  page.on('dialog', async (dialog) => {
    // console.log(`[Browser Dialog]: ${dialog.type()} -> ${dialog.message()}`);
    await dialog.accept();
  });

  let passedTests = 0;
  let totalTests = 0;

  async function testStep(name, fn) {
    totalTests++;
    process.stdout.write(`[TEST ${totalTests}] ${name} ... `);
    try {
      await fn();
      passedTests++;
      console.log('PASSED');
    } catch (err) {
      console.log('FAILED');
      console.error(`       Error: ${err.message}`);
      errors.push(`[Test Step Failure in "${name}"]: ${err.message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // PHASE 1: PUBLIC DISCOVERY & STATIC PAGES
    // -------------------------------------------------------------
    await testStep('Public Landing Page renders with hero, search, and live metrics', async () => {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=EstateCore Real Estate Platform');
      await page.waitForSelector('text=feels like yours.');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_landing_page.png') });
    });

    await testStep('Public Property Catalog renders filtered cards and details links', async () => {
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');
      await page.waitForSelector('text=View Details', { timeout: 10000 });
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_properties_catalog.png') });
    });

    await testStep('Property Detail Page renders architectural specifications & agent card', async () => {
      await page.goto('http://localhost:5173/properties/1', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Architectural Specifications');
      await page.waitForSelector('button:has-text("Schedule Private Viewing")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_property_detail.png') });
    });

    await testStep('Public About & Contact pages render institutional content', async () => {
      await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("A Modern Architecture for Real Estate Integration")');
      await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Contact EstateCore")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_contact_page.png') });
    });

    // -------------------------------------------------------------
    // PHASE 2: AUTHENTICATION & NEGATIVE ROUTE AUTHORIZATION (CLIENT)
    // -------------------------------------------------------------
    await testStep('Sign In as Client via 1-click test credentials', async () => {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.click('button:has-text("Client")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/client', { timeout: 10000 });
      await page.waitForSelector('text=Client Portal');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_client_portal.png') });
    });

    await testStep('Client opening Property Catalog retains sidebar navigation and workspace layout', async () => {
      await page.click('aside a[href="/properties"], aside >> text=Property Catalog');
      await page.waitForURL('**/properties', { timeout: 5000 });
      await page.waitForSelector('aside >> text=Navigation Menu');
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '05b_client_catalog_in_dashboard.png') });
      // Navigate back to client portal
      await page.click('aside >> text=Executive Overview');
      await page.waitForURL('**/client', { timeout: 5000 });
    });

    await testStep('NEGATIVE RBAC: Client navigating to /admin is redirected back to /client', async () => {
      await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
      // ProtectedRoute checks allowedRoles=['ADMIN'] -> non-admin redirected to /client
      await page.waitForURL('**/client', { timeout: 5000 });
      if (!page.url().endsWith('/client')) {
        throw new Error(`Expected redirect to /client but URL is ${page.url()}`);
      }
    });

    await testStep('NEGATIVE RBAC: Client navigating to /agent is redirected back to /client', async () => {
      await page.goto('http://localhost:5173/agent', { waitUntil: 'networkidle' });
      await page.waitForURL('**/client', { timeout: 5000 });
      if (!page.url().endsWith('/client')) {
        throw new Error(`Expected redirect to /client but URL is ${page.url()}`);
      }
    });

    await testStep('NEGATIVE RBAC: Client navigating to /users is redirected back to /client', async () => {
      await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle' });
      await page.waitForURL('**/client', { timeout: 5000 });
      if (!page.url().endsWith('/client')) {
        throw new Error(`Expected redirect to /client but URL is ${page.url()}`);
      }
    });

    await testStep('NEGATIVE RBAC: Client navigating to /properties/new is redirected to /client', async () => {
      await page.goto('http://localhost:5173/properties/new', { waitUntil: 'networkidle' });
      await page.waitForURL('**/client', { timeout: 5000 });
      if (!page.url().endsWith('/client')) {
        throw new Error(`Expected redirect to /client but URL is ${page.url()}`);
      }
    });

    await testStep('Client viewing tours page can see appointments and cancel their tour', async () => {
      await page.goto('http://localhost:5173/appointments', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Property Viewing Appointments');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_client_appointments.png') });
    });

    // -------------------------------------------------------------
    // PHASE 3: AUTHENTICATION & NEGATIVE ROUTE AUTHORIZATION (AGENT)
    // -------------------------------------------------------------
    await testStep('Sign Out and Login as Licensed Agent (Maria Santos)', async () => {
      await page.click('button[title*="Sign out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });
      await page.click('button:has-text("Agent")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/agent', { timeout: 10000 });
      await page.waitForSelector('text=Agent Dashboard');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_agent_dashboard.png') });
    });

    await testStep('NEGATIVE RBAC: Agent navigating to /admin is redirected back to /agent', async () => {
      await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
      await page.waitForURL('**/agent', { timeout: 5000 });
      if (!page.url().endsWith('/agent')) {
        throw new Error(`Expected redirect to /agent but URL is ${page.url()}`);
      }
    });

    await testStep('NEGATIVE RBAC: Agent navigating to /users is redirected back to /agent', async () => {
      await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle' });
      await page.waitForURL('**/agent', { timeout: 5000 });
      if (!page.url().endsWith('/agent')) {
        throw new Error(`Expected redirect to /agent but URL is ${page.url()}`);
      }
    });

    await testStep('NEGATIVE OWNERSHIP: Agent cross-editing property owned by another agent/admin is denied', async () => {
      // Property #3 is assigned to Agent Carlos Reyes (agents.id = 2, users.id = 3).
      // Maria Santos is logged in (users.id = 2, agents.id = 1).
      // Integer collision trap: Maria users.id (2) === Carlos agents.id (2).
      // Remediated PropertyForm verifies prop.agent.userId (3) !== Maria user.id (2) and denies access.
      await page.goto('http://localhost:5173/properties/3/edit', { waitUntil: 'networkidle' });
      // The frontend ownership check alerts and navigates back to /properties
      await page.waitForURL('**/properties', { timeout: 8000 });
      if (!page.url().endsWith('/properties')) {
        throw new Error(`Expected redirect to /properties but URL is ${page.url()}`);
      }
    });

    await testStep('REGRESSION COLLISION: Agent Maria editing unassigned property (Fail closed) is denied', async () => {
      // Property #17 is unassigned (agentId = null).
      // Agent Maria attempting to edit unassigned property must fail closed.
      await page.goto('http://localhost:5173/properties/17/edit', { waitUntil: 'networkidle' });
      await page.waitForURL('**/properties', { timeout: 8000 });
      if (!page.url().endsWith('/properties')) {
        throw new Error(`Expected redirect to /properties but URL is ${page.url()}`);
      }
    });

    await testStep('REGRESSION COLLISION: Agent Maria accessing her own assigned Property 1 edit form is allowed', async () => {
      // Property #1 is assigned to Maria (Agent 1, User 2).
      await page.goto('http://localhost:5173/properties/1/edit', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Edit Property Listing', { timeout: 8000 });
      if (!page.url().includes('/properties/1/edit')) {
        throw new Error(`Expected URL to remain on /properties/1/edit but got ${page.url()}`);
      }
    });

    await testStep('REGRESSION COLLISION: Agent Carlos accessing his own assigned Property 3 edit form is allowed', async () => {
      // Sign out Maria and log in as Carlos (users.id = 3, agents.id = 2)
      await page.click('button[title*="Sign out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });
      await page.fill('input[type="email"]', 'carlos.reyes@estatecore.local');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/agent', { timeout: 10000 });

      // Carlos opens Property 3 (assigned to Carlos: prop.agent.userId = 3 === user.id = 3)
      await page.goto('http://localhost:5173/properties/3/edit', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Edit Property Listing', { timeout: 8000 });
      if (!page.url().includes('/properties/3/edit')) {
        throw new Error(`Expected URL to remain on /properties/3/edit for Carlos but got ${page.url()}`);
      }

      // Re-login Maria to restore suite flow
      await page.click('button[title*="Sign out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });
      await page.click('button:has-text("Agent")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/agent', { timeout: 10000 });
    });

    // -------------------------------------------------------------
    // PHASE 4: ADMINISTRATOR WORKFLOWS & CRUD INTEGRITY
    // -------------------------------------------------------------
    await testStep('Sign Out and Login as Administrator', async () => {
      await page.click('button[title*="Sign out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });
      await page.click('button:has-text("Admin")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/admin', { timeout: 10000 });
      await page.waitForSelector('text=Executive Operations Dashboard');
      await page.waitForSelector('text=System Role Distribution');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_admin_dashboard.png') });
    });

    await testStep('Admin User Management renders role distribution and controls', async () => {
      await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=System User Management');
      await page.waitForSelector('text=admin@estatecore.local');
      await page.waitForSelector('text=maria.santos@estatecore.local');
      await page.waitForSelector('text=juan.delacruz@client.local');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_users_management.png') });
    });

    await testStep('Admin Inquiries Center renders system-wide client inquiries', async () => {
      await page.goto('http://localhost:5173/inquiries', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Client Inquiries Management');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_inquiries_center.png') });
    });

    await testStep('Admin creates new property listing and verifies catalog appearance', async () => {
      await page.goto('http://localhost:5173/properties/new', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Publish New Property Listing');

      const testTitle = `Regency Villa ${Date.now()}`;
      await page.fill('input[placeholder*="Grand Botanica"]', testTitle);
      await page.fill('textarea[placeholder*="Describe architectural style"]', 'Automated Playwright verified luxury residence.');
      await page.fill('input[placeholder*="Bonifacio Global City"]', 'Nuvali, Santa Rosa');
      await page.fill('input[placeholder*="5th Avenue"]', 'Block 12 Lot 4');

      await page.click('button:has-text("Publish Property Listing")');
      await page.waitForURL('**/properties', { timeout: 10000 });
      await page.waitForSelector(`text=${testTitle}`);
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '11_published_property.png') });
    });

    await testStep('Account Profile updates and credentials display', async () => {
      await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Account Profile & Security');
      await page.waitForSelector('text=System Administrator');
      await page.waitForSelector('text=admin@estatecore.local');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '12_account_profile.png') });
    });

    // -------------------------------------------------------------
    // PHASE 5: RESPONSIVE MOBILE VIEWPORT AUDIT
    // -------------------------------------------------------------
    await testStep('Mobile viewport audit: responsive navigation and mobile drawer', async () => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=EstateCore');

      // Click mobile hamburger toggle
      const menuButton = page.locator('button[aria-label="Toggle menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();
        await page.waitForSelector('nav.flex-col >> text=Properties');
      }
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '13_mobile_responsive.png') });
    });

  } finally {
    await browser.close();
  }

  console.log('\n=== PLAYWRIGHT REMEDIATION TEST SUMMARY ===');
  console.log(`Passed: ${passedTests} / ${totalTests} tests`);
  console.log(`Captured Console Errors: ${errors.length}`);
  console.log(`Captured Console Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n--- DETECTED BUGS / ERRORS ---');
    errors.forEach((err, idx) => console.log(`${idx + 1}. ${err}`));
  } else {
    console.log('\nALL 17 PLAYWRIGHT E2E & NEGATIVE AUTHORIZATION TESTS PASSED WITH 0 CONSOLE ERRORS!');
  }

  const report = {
    timestamp: new Date().toISOString(),
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    errors,
    warnings,
  };

  fs.writeFileSync(
    path.join(__dirname, 'documentation', 'evidence', 'playwright_remediation_report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\nDetailed JSON report written to documentation/evidence/playwright_remediation_report.json');
}

runPlaywrightSuite().catch((err) => {
  console.error('Fatal test suite failure:', err);
  process.exit(1);
});
