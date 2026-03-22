const dotenv = require('dotenv');

dotenv.config();

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parsePositiveInteger(value, fallback) {
  const parsed = parseInteger(value, fallback);
  return parsed > 0 ? parsed : fallback;
}

function parseNonNegativeInteger(value, fallback) {
  const parsed = parseInteger(value, fallback);
  return parsed >= 0 ? parsed : fallback;
}

function parseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseTrustProxy(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'false') {
      return false;
    }

    if (normalized === 'true') {
      return true;
    }
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isNaN(parsed) && parsed >= 0) {
    return parsed;
  }

  return value;
}

function toAllowedOrigins(value, fallbackOrigin) {
  const source = value || fallbackOrigin || '';

  return source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function resolveConfig(source = process.env) {
  const nodeEnv = source.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';
  const defaultFrontendOrigin = source.FRONTEND_ORIGIN || (isProduction ? '' : 'http://localhost:5173');
  const defaultAllowedOrigins = isProduction
    ? defaultFrontendOrigin
    : [defaultFrontendOrigin, 'http://127.0.0.1:5173'].filter(Boolean).join(',');

  const config = {
    nodeEnv,
    isProduction,
    port: parsePositiveInteger(source.PORT, 4301),
    databaseUrl:
      source.DATABASE_URL || 'postgresql://planner:planner@localhost:5433/smart_daily_planner',
    jwtSecret: source.JWT_SECRET || (isProduction ? '' : 'change-me'),
    jwtExpiresIn: source.JWT_EXPIRES_IN || '24h',
    frontendOrigin: defaultFrontendOrigin,
    allowedOrigins: toAllowedOrigins(source.ALLOWED_ORIGINS, defaultAllowedOrigins),
    logLevel: source.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    authRateLimitMax: parsePositiveInteger(source.AUTH_RATE_LIMIT_MAX, 5),
    apiRateLimitMax: parsePositiveInteger(source.API_RATE_LIMIT_MAX, 100),
    rateLimitWindowMs: parsePositiveInteger(source.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    requestTimeoutMs: parsePositiveInteger(source.REQUEST_TIMEOUT_MS, 30 * 1000),
    slowRequestThresholdMs: parsePositiveInteger(source.SLOW_REQUEST_THRESHOLD_MS, 1000),
    trustProxy: parseTrustProxy(source.TRUST_PROXY, isProduction ? 1 : false),
    dbSslRejectUnauthorized: parseBoolean(source.DB_SSL_REJECT_UNAUTHORIZED, false),
    dbPoolMax: parsePositiveInteger(source.DB_POOL_MAX, 10),
    dbIdleTimeoutMs: parsePositiveInteger(source.DB_IDLE_TIMEOUT_MS, 30 * 1000),
    dbConnectionTimeoutMs: parsePositiveInteger(source.DB_CONNECTION_TIMEOUT_MS, 10 * 1000),
    dbQueryTimeoutMs: parsePositiveInteger(source.DB_QUERY_TIMEOUT_MS, 10 * 1000),
    dbConnectMaxRetries: parsePositiveInteger(source.DB_CONNECT_MAX_RETRIES, 6),
    dbConnectRetryDelayMs: parsePositiveInteger(source.DB_CONNECT_RETRY_DELAY_MS, 3000),
    dbStartupRequired: parseBoolean(source.DB_STARTUP_REQUIRED, true),
    dbConnectStatementTimeoutMs: parseNonNegativeInteger(source.DB_STATEMENT_TIMEOUT_MS, 12 * 1000),
    awsRegion: source.AWS_REGION || 'ap-south-1',
    awsSecretsManagerSecretId: source.AWS_SECRETS_MANAGER_SECRET_ID || '',
    sentryDsn: source.SENTRY_DSN || '',
    googleOauthClientId: source.GOOGLE_OAUTH_CLIENT_ID || '',
    googleOauthClientSecret: source.GOOGLE_OAUTH_CLIENT_SECRET || '',
    googleOauthRedirectUri: source.GOOGLE_OAUTH_REDIRECT_URI || 'postmessage'
  };

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL must be defined.');
  }

  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET must be defined.');
  }

  if (config.port > 65535) {
    throw new Error('PORT must be less than or equal to 65535.');
  }

  if (config.isProduction && config.allowedOrigins.length === 0) {
    throw new Error('ALLOWED_ORIGINS or FRONTEND_ORIGIN must be defined in production.');
  }

  return config;
}

module.exports = {
  resolveConfig
};
