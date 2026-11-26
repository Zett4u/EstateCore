const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('fs');
const path = require('path');

async function compare() {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'estatecore_user',
    password: 'estatecore_secure_pass_2026',
  });

  const [liveTables] = await conn.query('SHOW TABLES FROM estatecore_db');
  const [testTables] = await conn.query('SHOW TABLES FROM estatecore_test_restore');

  const liveTableNames = liveTables.map((t) => Object.values(t)[0]);
  const testTableNames = testTables.map((t) => Object.values(t)[0]);

  const report = {
    timestamp: new Date().toISOString(),
    liveDatabase: 'estatecore_db',
    sandboxDatabase: 'estatecore_test_restore',
    sourceTables: liveTableNames,
    restoredTables: testTableNames,
    tables: {},
  };

  for (const table of liveTableNames) {
    const [[liveCount]] = await conn.query(
      `SELECT COUNT(*) as count FROM estatecore_db.${table}`,
    );
    const [[testCount]] = await conn.query(
      `SELECT COUNT(*) as count FROM estatecore_test_restore.${table}`,
    );

    const [liveCols] = await conn.query(
      `SHOW FULL COLUMNS FROM estatecore_db.${table}`,
    );
    const [testCols] = await conn.query(
      `SHOW FULL COLUMNS FROM estatecore_test_restore.${table}`,
    );

    const [liveKeys] = await conn.query(
      `SHOW INDEXES FROM estatecore_db.${table}`,
    );
    const [testKeys] = await conn.query(
      `SHOW INDEXES FROM estatecore_test_restore.${table}`,
    );

    const [liveFKs] = await conn.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'estatecore_db' AND TABLE_NAME = '${table}' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    const [testFKs] = await conn.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'estatecore_test_restore' AND TABLE_NAME = '${table}' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    report.tables[table] = {
      liveRowCount: liveCount.count,
      sandboxRowCount: testCount.count,
      rowMatch: liveCount.count === testCount.count,
      columnsCount: { live: liveCols.length, sandbox: testCols.length },
      columnMatch: liveCols.length === testCols.length,
      keysCount: { live: liveKeys.length, sandbox: testKeys.length },
      keyMatch: liveKeys.length === testKeys.length,
      foreignKeysCount: { live: liveFKs.length, sandbox: testFKs.length },
      foreignKeyMatch: liveFKs.length === testFKs.length,
      foreignKeys: testFKs,
    };
  }

  const outputDir = path.resolve(__dirname, '../documentation/evidence');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'phase2_database_comparison.json');
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('Database Backup & Restore Parity Comparison:');
  console.table(
    Object.keys(report.tables).map((t) => ({
      table: t,
      liveRows: report.tables[t].liveRowCount,
      sandboxRows: report.tables[t].sandboxRowCount,
      rowsMatch: report.tables[t].rowMatch,
      colsMatch: report.tables[t].columnMatch,
      keysMatch: report.tables[t].keyMatch,
      fkMatch: report.tables[t].foreignKeyMatch,
    })),
  );

  await conn.end();
}

compare().catch((err) => {
  console.error(err);
  process.exit(1);
});
