const { Pool } = require('pg');

const aliasSslModes = new Set(['prefer', 'require', 'verify-ca']);
const sslParamKeys = new Set(['sslmode', 'sslcert', 'sslkey', 'sslrootcert']);

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

function hasSslDirectiveInConnectionString(connectionString) {
  try {
    const url = new URL(connectionString);
    return Array.from(sslParamKeys).some((key) => url.searchParams.has(key));
  } catch {
    return false;
  }
}

function createPool(config) {
  const connectionString = normalizeDatabaseUrl(config.databaseUrl);
  const hasSslDirective = hasSslDirectiveInConnectionString(connectionString);
  const ssl =
    config.isProduction && !hasSslDirective
      ? {
          rejectUnauthorized: config.dbSslRejectUnauthorized
        }
      : false;

  return new Pool({
    connectionString,
    ssl
  });
}

module.exports = {
  createPool
};
