const { Pool } = require('pg');

function createPool(config) {
  return new Pool({
    connectionString: config.databaseUrl,
    ssl: config.isProduction
      ? {
          rejectUnauthorized: false
        }
      : false
  });
}

module.exports = {
  createPool
};
