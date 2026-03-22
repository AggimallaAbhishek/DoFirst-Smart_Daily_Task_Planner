const { resolveConfig } = require('./config/env');
const { loadRuntimeSecrets } = require('./config/runtimeSecrets');
const { initializeSentry } = require('./config/sentry');
const { createPool } = require('./db/pool');
const { createApp } = require('./app/createApp');
const { createLogger } = require('./utils/logger');

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function ensureDatabaseConnection(pool, logger, config) {
  const attempts = config.dbConnectMaxRetries;
  const retryDelayMs = config.dbConnectRetryDelayMs;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      logger.info('Database connection established.', { attempt });
      return;
    } catch (error) {
      logger.warn('Database connection attempt failed.', {
        attempt,
        attempts,
        reason: error.message
      });

      if (attempt === attempts) {
        if (config.dbStartupRequired) {
          throw new Error(`Database unavailable after ${attempts} attempts. ${error.message}`);
        }

        logger.warn('Continuing startup without confirmed database connection.');
        return;
      }

      await wait(retryDelayMs);
    }
  }
}

async function startServer() {
  let config = resolveConfig();
  let logger = createLogger(config.logLevel);
  const secretOverrides = await loadRuntimeSecrets(config, logger);

  if (Object.keys(secretOverrides).length > 0) {
    config = resolveConfig({
      ...process.env,
      ...secretOverrides
    });
    logger = createLogger(config.logLevel);
  }

  initializeSentry(config);

  const pool = createPool(config);
  await ensureDatabaseConnection(pool, logger, config);
  const app = createApp({
    config,
    logger,
    pool,
    startedAt: Date.now()
  });
  const host = '0.0.0.0';
  const server = app.listen(config.port, host, () => {
    logger.info('Backend server listening.', {
      port: config.port,
      host,
      nodeEnv: config.nodeEnv
    });
  });

  async function shutdown(signal) {
    logger.info('Shutting down backend server.', { signal });
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  return {
    app,
    pool,
    server
  };
}

if (require.main === module) {
  startServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  startServer
};
