const { spawn, fork, execSync } = require('child_process');
const path = require('path');
const mysql = require(path.resolve(__dirname, '../backend/node_modules/mysql2/promise'));
const fs = require('fs');

async function main() {
  console.log('=== STARTING CONTROLLED PLAYWRIGHT ACCEPTANCE AUDIT ===');
  console.log('Target Sandbox: estatecore_test_restore (Strictly Isolated)');

  // 1. Double check live DB baseline before starting
  const liveConn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
    database: 'estatecore_db'
  });
  const [liveTables] = await liveConn.query('SHOW TABLES');
  const [liveProps] = await liveConn.query('SELECT COUNT(*) as count FROM properties');
  console.log(`Live DB baseline check: ${liveTables.length} tables, ${liveProps[0].count} properties.`);
  await liveConn.end();

  // 2. Start Backend Server on Port 3000 targeting estatecore_test_restore
  console.log('\n[1/4] Starting backend on port 3000 pointing to estatecore_test_restore...');
  const backendEnv = {
    ...process.env,
    PORT: '3000',
    DB_HOST: '127.0.0.1',
    DB_PORT: '3307',
    DB_USERNAME: 'estatecore_user',
    DB_PASSWORD: 'estatecore_secure_pass_2026',
    DB_NAME: 'estatecore_test_restore',
    JWT_SECRET: 'estatecore_super_secret_jwt_key_2026_academic_defense_key',
    NODE_ENV: 'test',
  };

  const backendProc = fork(path.resolve(__dirname, '../backend/dist/main.js'), [], {
    env: backendEnv,
    cwd: path.resolve(__dirname, '../backend'),
    stdio: 'pipe',
  });

  // Wait for backend to be online
  let backendOnline = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://localhost:3000/api/v1/properties');
      if (res.status === 200) {
        backendOnline = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  if (!backendOnline) {
    throw new Error('Backend server failed to start on port 3000');
  }
  console.log('  -> Backend server online on http://localhost:3000/api/v1');

  // 3. Start Frontend Vite Dev Server on Port 5173
  console.log('\n[2/4] Starting frontend Vite server on port 5173...');
  const frontendProc = spawn('cmd.exe', ['/c', 'npm.cmd run dev'], {
    cwd: path.resolve(__dirname, '../frontend'),
    stdio: 'pipe',
  });

  let frontendOnline = false;
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch('http://localhost:5173/');
      if (res.status === 200) {
        frontendOnline = true;
        break;
      }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 500));
  }
  if (!frontendOnline) {
    throw new Error('Frontend server failed to start on port 5173');
  }
  console.log('  -> Frontend Vite server online on http://localhost:5173');

  let playwrightResult = null;
  try {
    // 4. Run Playwright Suite
    console.log('\n[3/4] Executing test_playwright.js browser automation...');
    execSync('node test_playwright.js', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    playwrightResult = 'PASSED';
  } catch (err) {
    console.error('Playwright execution error:', err.message);
    playwrightResult = 'FAILED';
  } finally {
    // 5. Clean shutdown of servers
    console.log('\n[4/4] Shutting down frontend and backend processes...');
    try { execSync(`taskkill /F /T /PID ${backendProc.pid}`, { stdio: 'ignore' }); } catch (e) {}
    try { execSync(`taskkill /F /T /PID ${frontendProc.pid}`, { stdio: 'ignore' }); } catch (e) {}

    // Clean up any test properties created in sandbox
    const sandboxConn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'estatecore_user',
      password: 'estatecore_secure_pass_2026',
      database: 'estatecore_test_restore',
    });
    const [delResult] = await sandboxConn.query(
      "DELETE FROM properties WHERE title LIKE 'Regency Villa %' AND id > 18"
    );
    if (delResult.affectedRows > 0) {
      console.log(`  -> Cleaned up ${delResult.affectedRows} Playwright test properties from sandbox.`);
    }
    await sandboxConn.end();

    // Verify live DB again
    const liveConn2 = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'estatecore_user',
      password: 'estatecore_secure_pass_2026',
      database: 'estatecore_db'
    });
    const [liveProps2] = await liveConn2.query('SELECT COUNT(*) as count FROM properties');
    console.log(`Live DB post-test check: ${liveProps2[0].count} properties (Identical to baseline: ${liveProps[0].count === liveProps2[0].count}).`);
    await liveConn2.end();
  }

  console.log(`\nPlaywright Acceptance Run Finished: ${playwrightResult}`);
  if (playwrightResult !== 'PASSED') {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running Playwright acceptance:', err);
  process.exit(1);
});
