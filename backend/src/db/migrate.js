const fs = require('fs/promises');
const path = require('path');
const { resolveConfig } = require('../config/env');
const { loadRuntimeSecrets } = require('../config/runtimeSecrets');
const { createPool } = require('./pool');
const { createLogger } = require('../utils/logger');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

async function runMigrations(pool, logger) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureMigrationsTable(client);

    const migrationDirectory = path.join(__dirname, 'migrations');
    const filenames = (await fs.readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort();

    for (const filename of filenames) {
      const existing = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1',
        [filename]
      );

      if (existing.rowCount > 0) {
        continue;
      }

      const migrationPath = path.join(migrationDirectory, filename);
      const sql = await fs.readFile(migrationPath, 'utf8');

      logger.info('Applying database migration.', { filename });
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  let config = resolveConfig();
  const logger = createLogger(config.logLevel);
  const secretOverrides = await loadRuntimeSecrets(config, logger);

  if (Object.keys(secretOverrides).length > 0) {
    config = resolveConfig({
      ...process.env,
      ...secretOverrides
    });
  }

  const pool = createPool(config);

  try {
    await runMigrations(pool, logger);
    logger.info('Database migrations completed successfully.');
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  runMigrations
};
