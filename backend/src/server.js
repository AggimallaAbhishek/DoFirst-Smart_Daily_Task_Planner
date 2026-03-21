const { resolveConfig } = require('./config/env');
const { loadRuntimeSecrets } = require('./config/runtimeSecrets');
const { initializeSentry } = require('./config/sentry');
const { createPool } = require('./db/pool');
const { createApp } = require('./app/createApp');
const { createLogger } = require('./utils/logger');

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
