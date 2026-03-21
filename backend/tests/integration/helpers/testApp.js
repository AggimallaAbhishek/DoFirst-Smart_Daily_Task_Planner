const { createApp } = require('../../../src/app/createApp');
const { createLogger } = require('../../../src/utils/logger');
const { createTestConfig } = require('./testDatabase');

function createTestApp(pool) {
  const config = createTestConfig();
  const logger = createLogger('error');

  return createApp({
    config,
    logger,
    pool,
    startedAt: Date.now()
  });
}

module.exports = {
  createTestApp
};
