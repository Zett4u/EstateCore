const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EVIDENCE_DIR = path.join(__dirname, 'documentation', 'evidence', 'acceptance');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runAcceptanceSuite() {
  console.log('=== STARTING ESTATECORE FRONTEND ROUTING & AUTHENTICATION ACCEPTANCE SUITE ===\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  const consoleErrors = [];
  const consoleWarnings = [];
  const failedRequests = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(`[Console Error]: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(`[Console Warning]: ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(`[Page Crash / Unhandled Error]: ${err.message}\n${err.stack}`);
  });

  page.on('response', (response) => {
    const status = response.status();
    const url = response.url();
    // Exclude deliberate 401 checks in Scenario 7
    if (status >= 400 && !url.includes('/auth/me')) {
      failedRequests.push({ url, status, statusText: response.statusText() });
    }
  });

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  const testResults = [];
  let passedCount = 0;
  let totalCount = 0;

  async function testScenario(scenarioNumber, title, fn) {
    totalCount++;
    const stepLabel = `SCENARIO ${scenarioNumber}: ${title}`;
    process.stdout.write(`[${stepLabel}] ... `);
    const startTime = Date.now();
    try {
      await fn();
      passedCount++;
      const duration = Date.now() - startTime;
      console.log(`PASSED (${duration}ms)`);
      testResults.push({
        scenario: scenarioNumber,
        title,
        status: 'PASS',
        durationMs: duration,
        error: null,
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(`FAILED (${duration}ms)`);
      console.error(`       Error: ${err.message}`);
      testResults.push({
        scenario: scenarioNumber,
        title,
        status: 'FAIL',
        durationMs: duration,
        error: err.message,
      });
    }
  }

  // Helper to clear localStorage
  async function clearAuth() {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.evaluate(() => localStorage.clear());
  }

  // Helper to login
  async function loginAs(roleOrEmail, password = 'Password123!') {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    if (roleOrEmail.toLowerCase() === 'client') {
      await page.click('button:has-text("Client")');
    } else if (roleOrEmail.toLowerCase() === 'agent') {
      await page.click('button:has-text("Agent")');
    } else if (roleOrEmail.toLowerCase() === 'admin') {
      await page.click('button:has-text("Admin")');
    } else {
      await page.fill('input[type="email"]', roleOrEmail);
      await page.fill('input[type="password"]', password);
    }
    await page.click('button:has-text("Sign In to Portal")');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Guest opens /properties directly
    // -------------------------------------------------------------------------
    await testScenario(1, 'Guest opens /properties directly (Public navigation, no sidebar)', async () => {
      await clearAuth();
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });

      // Verify Public Layout components
      const publicHeader = await page.waitForSelector('header:has-text("EstateCore")', { timeout: 5000 });
      if (!publicHeader) throw new Error('Public header not found');

      const hasSignIn = await page.locator('header a[href="/login"]').count();
      const hasGetStarted = await page.locator('header a[href="/register"]').count();
      if (!hasSignIn || !hasGetStarted) {
        throw new Error('Public header missing Sign In or Get Started links');
      }

      // Assert sidebar does NOT exist
      const sidebarCount = await page.locator('aside').count();
      if (sidebarCount !== 0) {
        throw new Error(`Expected 0 sidebar elements for guest, found ${sidebarCount}`);
      }

      // Assert property catalog content rendered
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');
      const cards = await page.locator('.group.bg-white.rounded-3xl').count();
      if (cards === 0) throw new Error('No property cards rendered for guest');

      // Assert management controls are NOT exposed
      const publishBtn = await page.locator('button:has-text("Publish New Listing")').count();
      if (publishBtn !== 0) throw new Error('Publish New Listing button should not appear for guest');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_guest_catalog.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 2: CLIENT opens /properties directly
    // -------------------------------------------------------------------------
    await testScenario(2, 'CLIENT opens /properties directly (Dashboard sidebar appears, no public header)', async () => {
      await loginAs('client');
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });

      // Assert Dashboard Sidebar is present
      const sidebar = await page.waitForSelector('aside >> text=Navigation Menu', { timeout: 5000 });
      if (!sidebar) throw new Error('Dashboard sidebar not rendered for CLIENT');

      // Assert Dashboard Navbar is present with CLIENT role badge
      const roleBadge = await page.waitForSelector('header >> text=CLIENT', { timeout: 5000 });
      if (!roleBadge) throw new Error('Dashboard top bar with CLIENT badge not found');

      // Assert Public navbar links (Sign In / Get Started) DO NOT exist
      const publicGetStarted = await page.locator('header >> text="Get Started"').count();
      if (publicGetStarted !== 0) throw new Error('Public "Get Started" button appeared in authenticated view');

      // Assert catalog content is rendered
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');

      // Client cannot publish listings
      const publishBtn = await page.locator('button:has-text("Publish New Listing")').count();
      if (publishBtn !== 0) throw new Error('Publish button should not appear for CLIENT');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_client_catalog_direct.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 3: CLIENT navigates to /properties from the dashboard sidebar
    // -------------------------------------------------------------------------
    await testScenario(3, 'CLIENT navigates to /properties from dashboard sidebar (persistent layout)', async () => {
      // Start from client dashboard
      await page.goto('http://localhost:5173/client', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Client Portal');

      // Click Property Catalog in sidebar
      await page.click('aside a[href="/properties"], aside >> text=Property Catalog');
      await page.waitForURL('**/properties', { timeout: 5000 });

      // Verify persistent sidebar and active highlighting
      await page.waitForSelector('aside >> text=Navigation Menu');
      const activeLink = await page.locator('aside a[href="/properties"].bg-forest-700').count();
      if (activeLink === 0) throw new Error('Property Catalog sidebar link is not highlighted as active');

      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_client_catalog_from_sidebar.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 4: AGENT opens /properties
    // -------------------------------------------------------------------------
    await testScenario(4, 'AGENT opens /properties (Agent layout, Publish action, no Admin routes)', async () => {
      await clearAuth();
      await loginAs('agent');
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });

      // Assert Dashboard Sidebar is present
      await page.waitForSelector('aside >> text=Navigation Menu');

      // Assert Dashboard Navbar has AGENT badge
      await page.waitForSelector('header >> text=AGENT');

      // Assert Agent can see "Publish New Listing"
      const publishBtn = await page.locator('button:has-text("Publish New Listing"), a[href="/properties/new"]').count();
      if (publishBtn === 0) throw new Error('AGENT should see "Publish New Listing" action');

      // Assert Agent cannot see "User Management" in sidebar
      const userMgmt = await page.locator('aside >> text=User Management').count();
      if (userMgmt !== 0) throw new Error('User Management should not appear in AGENT sidebar');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_agent_catalog.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 5: ADMIN opens /properties
    // -------------------------------------------------------------------------
    await testScenario(5, 'ADMIN opens /properties (Admin layout, User Management, Publish action)', async () => {
      await clearAuth();
      await loginAs('admin');
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });

      // Assert Dashboard Sidebar is present
      await page.waitForSelector('aside >> text=Navigation Menu');

      // Assert Dashboard Navbar has ADMIN badge
      await page.waitForSelector('header >> text=ADMIN');

      // Assert Admin can see "User Management" in sidebar
      const userMgmt = await page.locator('aside >> text=User Management').count();
      if (userMgmt === 0) throw new Error('ADMIN should see "User Management" in sidebar');

      // Assert Admin can see "Publish New Listing"
      const publishBtn = await page.locator('button:has-text("Publish New Listing"), a[href="/properties/new"]').count();
      if (publishBtn === 0) throw new Error('ADMIN should see "Publish New Listing" action');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_admin_catalog.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 6: Authenticated user refreshes /properties
    // -------------------------------------------------------------------------
    await testScenario(6, 'Authenticated user refreshes /properties (Loading handled, no guest flash, no loop)', async () => {
      // Current user is ADMIN from Scenario 5
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });
      await page.waitForSelector('aside >> text=Navigation Menu');

      // Trigger hard page reload
      await page.reload({ waitUntil: 'networkidle' });

      // Verify layout restored to DashboardLayout without redirect loop
      const currentUrl = page.url();
      if (!currentUrl.includes('/properties')) {
        throw new Error(`Unexpected redirect after refresh: ${currentUrl}`);
      }

      await page.waitForSelector('aside >> text=Navigation Menu', { timeout: 5000 });
      await page.waitForSelector('header >> text=ADMIN', { timeout: 5000 });

      // Verify Public navbar did NOT flash/stick
      const guestSignIn = await page.locator('header >> text="Sign In"').count();
      if (guestSignIn !== 0) throw new Error('Guest Sign In button visible after reload');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_client_catalog_after_reload.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 7: Session expires while browsing
    // -------------------------------------------------------------------------
    await testScenario(7, 'Session expires while browsing (Graceful fallback, protected content safeguarded)', async () => {
      // Invalidate token in localStorage
      await page.evaluate(() => {
        localStorage.setItem('estatecore_token', 'expired-or-malformed-jwt-token');
      });

      // Attempt navigating to protected route /admin
      await page.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });
      await page.waitForURL('**/login', { timeout: 5000 });

      // Verify redirected to /login
      const loginForm = await page.waitForSelector('text=Sign In to Your Account', { timeout: 5000 });
      if (!loginForm) throw new Error('Did not redirect to login form on invalid session');

      // Now verify visiting /properties directly renders public layout gracefully
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });
      const publicHeader = await page.waitForSelector('header:has-text("EstateCore")', { timeout: 5000 });
      if (!publicHeader) throw new Error('Public header not restored on expired session');

      const sidebarCount = await page.locator('aside').count();
      if (sidebarCount !== 0) throw new Error('Sidebar should be absent after session expiration');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_session_expired_safe_fallback.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 8: User signs out
    // -------------------------------------------------------------------------
    await testScenario(8, 'User signs out (Public layout appears, protected pages inaccessible)', async () => {
      // Log in as CLIENT
      await loginAs('client');
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });
      await page.waitForSelector('aside >> text=Navigation Menu');

      // Click Sign Out button
      await page.click('header button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 5000 });

      // Verify token is cleared from localStorage
      const token = await page.evaluate(() => localStorage.getItem('estatecore_token'));
      if (token) throw new Error('Token was not removed from localStorage after sign out');

      // Verify protected route /client is blocked
      await page.goto('http://localhost:5173/client', { waitUntil: 'networkidle' });
      await page.waitForURL('**/login', { timeout: 5000 });

      // Verify /properties shows public layout
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });
      await page.waitForSelector('header a[href="/login"]');
      const asideCount = await page.locator('aside').count();
      if (asideCount !== 0) throw new Error('Sidebar still present after sign out');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_signed_out_public_catalog.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 9: Property detail route (/properties/:id) across all 4 roles
    // -------------------------------------------------------------------------
    await testScenario(9, 'Property detail route (/properties/:id) layout consistency across roles', async () => {
      // 9a: Guest
      await clearAuth();
      await page.goto('http://localhost:5173/properties/1', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Back to Portfolio');
      const guestSidebar = await page.locator('aside').count();
      if (guestSidebar !== 0) throw new Error('Guest should not see sidebar on property detail');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '09a_guest_property_detail.png') });

      // 9b: CLIENT
      await loginAs('client');
      await page.goto('http://localhost:5173/properties/1', { waitUntil: 'networkidle' });
      await page.waitForSelector('aside >> text=Navigation Menu');
      await page.waitForSelector('text=Back to Portfolio');
      // Client should not see edit listing
      const clientEdit = await page.locator('button:has-text("Edit Listing")').count();
      if (clientEdit !== 0) throw new Error('CLIENT should not see Edit Listing on property detail');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '09b_client_property_detail.png') });

      // 9c: AGENT
      await clearAuth();
      await loginAs('agent');
      await page.goto('http://localhost:5173/properties/1', { waitUntil: 'networkidle' });
      await page.waitForSelector('aside >> text=Navigation Menu');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '09c_agent_property_detail.png') });

      // 9d: ADMIN
      await clearAuth();
      await loginAs('admin');
      await page.goto('http://localhost:5173/properties/1', { waitUntil: 'networkidle' });
      await page.waitForSelector('aside >> text=Navigation Menu');
      // Admin should see Edit Listing button
      const adminEdit = await page.locator('a[href="/properties/1/edit"], button:has-text("Edit Listing")').count();
      if (adminEdit === 0) throw new Error('ADMIN should see Edit Listing button on property detail');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '09d_admin_property_detail.png') });
    });

    // -------------------------------------------------------------------------
    // SCENARIO 10: Browser back and forward navigation
    // -------------------------------------------------------------------------
    await testScenario(10, 'Browser back and forward navigation preserves layout and auth context', async () => {
      // Start as CLIENT from /client
      await clearAuth();
      await loginAs('client');
      await page.goto('http://localhost:5173/client', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Client Portal');

      // Click to /properties
      await page.click('aside a[href="/properties"]');
      await page.waitForURL('**/properties', { timeout: 5000 });
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');

      // Click first property card to /properties/1
      await page.click('a[href="/properties/1"]');
      await page.waitForURL('**/properties/1', { timeout: 5000 });
      await page.waitForSelector('aside >> text=Navigation Menu');

      // Back navigation to /properties
      await page.goBack();
      await page.waitForURL('**/properties', { timeout: 5000 });
      await page.waitForSelector('aside >> text=Navigation Menu');
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');

      // Back navigation to /client
      await page.goBack();
      await page.waitForURL('**/client', { timeout: 5000 });
      await page.waitForSelector('aside >> text=Navigation Menu');
      await page.waitForSelector('text=Client Portal');

      // Forward navigation to /properties
      await page.goForward();
      await page.waitForURL('**/properties', { timeout: 5000 });
      await page.waitForSelector('aside >> text=Navigation Menu');

      // Forward navigation to /properties/1
      await page.goForward();
      await page.waitForURL('**/properties/1', { timeout: 5000 });
      await page.waitForSelector('aside >> text=Navigation Menu');

      await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_browser_history_navigation.png') });
    });

  } finally {
    await browser.close();
  }

  console.log('\n=== ACCEPTANCE TEST SUITE SUMMARY ===');
  console.log(`Total Scenarios: ${totalCount}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed: ${totalCount - passedCount}`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log(`Console Warnings: ${consoleWarnings.length}`);
  console.log(`Failed Network Requests: ${failedRequests.length}`);

  const reportPayload = {
    timestamp: new Date().toISOString(),
    totalScenarios: totalCount,
    passedScenarios: passedCount,
    failedScenarios: totalCount - passedCount,
    scenarios: testResults,
    consoleErrors,
    consoleWarnings,
    failedRequests,
  };

  const reportPath = path.join(EVIDENCE_DIR, 'acceptance_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportPayload, null, 2), 'utf-8');
  console.log(`Structured results saved to ${reportPath}\n`);

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runAcceptanceSuite().catch((err) => {
  console.error('Fatal suite execution error:', err);
  process.exit(1);
});
