const dotenv = require('dotenv');

dotenv.config();

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
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
  const defaultFrontendOrigin = source.FRONTEND_ORIGIN || 'http://localhost:5173';
  const defaultAllowedOrigins = [defaultFrontendOrigin, 'http://127.0.0.1:5173'].join(',');

  const config = {
    nodeEnv,
    isProduction,
    port: parseInteger(source.PORT, 4301),
    databaseUrl:
      source.DATABASE_URL || 'postgresql://planner:planner@localhost:5433/smart_daily_planner',
    jwtSecret: source.JWT_SECRET || (isProduction ? '' : 'change-me'),
    jwtExpiresIn: source.JWT_EXPIRES_IN || '24h',
    frontendOrigin: defaultFrontendOrigin,
    allowedOrigins: toAllowedOrigins(source.ALLOWED_ORIGINS, defaultAllowedOrigins),
    logLevel: source.LOG_LEVEL || 'debug',
    authRateLimitMax: parseInteger(source.AUTH_RATE_LIMIT_MAX, 5),
    apiRateLimitMax: parseInteger(source.API_RATE_LIMIT_MAX, 100),
    rateLimitWindowMs: parseInteger(source.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    awsRegion: source.AWS_REGION || 'ap-south-1',
    awsSecretsManagerSecretId: source.AWS_SECRETS_MANAGER_SECRET_ID || '',
    sentryDsn: source.SENTRY_DSN || ''
  };

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL must be defined.');
  }

  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET must be defined.');
  }

  return config;
}

module.exports = {
  resolveConfig
};
