const { createApp } = require('../src/app/createApp');
const { resolveConfig } = require('../src/config/env');
const { loadRuntimeSecrets } = require('../src/config/runtimeSecrets');
const { initializeSentry } = require('../src/config/sentry');
const { createPool } = require('../src/db/pool');
const { createLogger } = require('../src/utils/logger');

let appPromise;

async function initializeApp() {
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

  logger.info('Initializing backend API runtime for Vercel.', {
    nodeEnv: config.nodeEnv
  });

  return createApp({
    config,
    logger,
    pool,
    startedAt: Date.now()
  });
}

async function getApp() {
  if (!appPromise) {
    appPromise = initializeApp();
  }

  return appPromise;
}

module.exports = async function handler(request, response) {
  try {
    const app = await getApp();
    return app(request, response);
  } catch (error) {
    response.statusCode = 500;
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        error: 'Failed to initialize API runtime.',
        detail: process.env.NODE_ENV === 'production' ? undefined : error.message
      })
    );
    return undefined;
  }
};
