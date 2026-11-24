const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EVIDENCE_DIR = path.join(__dirname, 'documentation', 'evidence', 'playwright');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runTestSuite() {
  console.log('=== STARTING ESTATECORE PLAYWRIGHT E2E & BUG DISCOVERY SUITE ===\n');

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
    // 1. Landing Page
    await testStep('Verify Landing Page renders without errors and shows hero', async () => {
      await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=EstateCore Real Estate Platform');
      await page.waitForSelector('text=feels like yours.');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '01_landing_page.png'), fullPage: false });
    });

    // 2. Public Property Catalog
    await testStep('Navigate to Property Catalog (/properties) and check listings', async () => {
      await page.goto('http://localhost:5173/properties', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Curated Real Estate Portfolio")');
      await page.waitForSelector('text=View Details', { timeout: 10000 });
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '02_properties_catalog.png') });
    });

    // 3. Property Detail Page
    await testStep('Navigate to Property Detail (/properties/1) and check specifications', async () => {
      await page.goto('http://localhost:5173/properties/1', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Architectural Specifications');
      await page.waitForSelector('button:has-text("Schedule Private Viewing")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '03_property_detail.png') });
    });

    // 4. About Page
    await testStep('Navigate to About Page (/about)', async () => {
      await page.goto('http://localhost:5173/about', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("A Modern Architecture for Real Estate Integration")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '04_about_page.png') });
    });

    // 5. Contact Page
    await testStep('Navigate to Contact Page (/contact)', async () => {
      await page.goto('http://localhost:5173/contact', { waitUntil: 'networkidle' });
      await page.waitForSelector('h1:has-text("Contact EstateCore")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '05_contact_page.png') });
    });

    // 6. Sign In Page & Quick Autofill Demo
    await testStep('Navigate to /login and verify Quick Autofill buttons exist', async () => {
      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Sign In to Your Account');
      await page.waitForSelector('button:has-text("Admin")');
      await page.waitForSelector('button:has-text("Agent")');
      await page.waitForSelector('button:has-text("Client")');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '06_login_page.png') });
    });

    // 7. Login as Administrator & Verify Admin Dashboard
    await testStep('Perform Administrator Login via Autofill & verify /admin dashboard', async () => {
      await page.click('button:has-text("Admin")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/admin', { timeout: 10000 });
      await page.waitForSelector('text=Executive Operations Dashboard');
      await page.waitForSelector('text=Total Portfolio');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '07_admin_dashboard.png') });
    });

    // 8. Admin CRUD: Verify User Management Page
    await testStep('Admin User Management (/users) table renders system users', async () => {
      await page.goto('http://localhost:5173/users', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=System User Management');
      await page.waitForSelector('text=ADMIN');
      await page.waitForSelector('text=AGENT');
      await page.waitForSelector('text=CLIENT');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '08_users_management.png') });
    });

    // 9. Admin Inquiries Center
    await testStep('Admin Inquiries Center (/inquiries) renders inquiry records', async () => {
      await page.goto('http://localhost:5173/inquiries', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Client Inquiries Management');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '09_inquiries_center.png') });
    });

    // 10. Admin Appointments Viewing Tours
    await testStep('Admin Viewing Tours (/appointments) renders scheduled tours', async () => {
      await page.goto('http://localhost:5173/appointments', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Property Viewing Appointments');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '10_appointments_schedule.png') });
    });

    // 11. Property Form (New Listing)
    await testStep('Property Form (/properties/new) renders form inputs and agent selector', async () => {
      await page.goto('http://localhost:5173/properties/new', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Publish New Property Listing');
      await page.waitForSelector('input[placeholder*="Grand Botanica"]');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '11_property_form.png') });
    });

    // 12. Account Profile Settings
    await testStep('Account Profile (/profile) renders credentials and update button', async () => {
      await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Account Profile & Security');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '12_account_profile.png') });
    });

    // 13. Logout & Login as Agent
    await testStep('Logout and Login as Real Estate Agent -> check /agent workspace', async () => {
      await page.click('button[title*="Sign out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });
      await page.click('button:has-text("Agent")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/agent', { timeout: 10000 });
      await page.waitForSelector('text=Agent Dashboard');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '13_agent_dashboard.png') });
    });

    // 14. Logout & Login as Client
    await testStep('Logout and Login as Client -> check /client portal', async () => {
      await page.click('button[title*="Sign out"], button:has-text("Sign Out")');
      await page.waitForURL('**/login', { timeout: 10000 });
      await page.click('button:has-text("Client")');
      await page.click('button:has-text("Sign In to Portal")');
      await page.waitForURL('**/client', { timeout: 10000 });
      await page.waitForSelector('text=Client Portal');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '14_client_portal.png') });
    });

    // 15. Client Registration Page
    await testStep('Client Registration Page (/register) renders correctly', async () => {
      await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
      await page.waitForSelector('text=Create Client Account');
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '15_register_page.png') });
    });

  } finally {
    await browser.close();
  }

  console.log('\n=== PLAYWRIGHT TEST SUMMARY ===');
  console.log(`Passed: ${passedTests} / ${totalTests} tests`);
  console.log(`Captured Console Errors: ${errors.length}`);
  console.log(`Captured Console Warnings: ${warnings.length}`);

  if (errors.length > 0) {
    console.log('\n--- DETECTED BUGS / ERRORS ---');
    errors.forEach((err, idx) => console.log(`${idx + 1}. ${err}`));
  } else {
    console.log('\nZERO BUGS / ERRORS DETECTED ACROSS ALL PAGES AND WORKFLOWS!');
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
    path.join(__dirname, 'documentation', 'evidence', 'playwright_test_report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\nDetailed JSON report written to documentation/evidence/playwright_test_report.json');
}

runTestSuite().catch((err) => {
  console.error('Fatal test suite error:', err);
  process.exit(1);
});
