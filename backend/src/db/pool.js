const { Pool } = require('pg');

const aliasSslModes = new Set(['prefer', 'require', 'verify-ca']);

function normalizeDatabaseUrl(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get('sslmode');
    const hasLibpqCompat = url.searchParams.has('uselibpqcompat');

    if (sslMode && aliasSslModes.has(sslMode) && !hasLibpqCompat) {
      url.searchParams.set('uselibpqcompat', 'true');
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

function createPool(config) {
  const connectionString = normalizeDatabaseUrl(config.databaseUrl);

  return new Pool({
    connectionString,
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
