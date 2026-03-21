const { resolveConfig } = require('../../../src/config/env');
const { createPool } = require('../../../src/db/pool');
const { runMigrations } = require('../../../src/db/migrate');
const { createLogger } = require('../../../src/utils/logger');

let pool;
let migrated = false;

function createTestConfig() {
  return resolveConfig({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL:
      process.env.TEST_DATABASE_URL ||
      process.env.DATABASE_URL ||
      'postgresql://planner:planner@localhost:5433/smart_daily_planner',
    JWT_SECRET: process.env.JWT_SECRET || 'test-secret'
  });
}

async function setupTestDatabase() {
  if (!pool) {
    pool = createPool(createTestConfig());
  }

  if (!migrated) {
    const logger = createLogger('error');
    await runMigrations(pool, logger);
    migrated = true;
  }

  return pool;
}

async function resetTestDatabase() {
  if (!pool) {
    return;
  }

  await pool.query('TRUNCATE TABLE tasks, users RESTART IDENTITY CASCADE');
}

async function closeTestDatabase() {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = undefined;
  migrated = false;
}

module.exports = {
  closeTestDatabase,
  createTestConfig,
  resetTestDatabase,
  setupTestDatabase
};
