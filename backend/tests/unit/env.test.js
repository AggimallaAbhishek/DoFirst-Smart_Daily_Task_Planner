const { resolveConfig } = require('../../src/config/env');

describe('resolveConfig', () => {
  test('uses safe development defaults', () => {
    const config = resolveConfig({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://planner:planner@localhost:5433/smart_daily_planner',
      JWT_SECRET: 'dev-secret'
    });

    expect(config.port).toBe(4301);
    expect(config.logLevel).toBe('debug');
    expect(config.allowedOrigins).toEqual([
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost',
      'https://localhost',
      'capacitor://localhost',
      'ionic://localhost'
    ]);
    expect(config.trustProxy).toBe(false);
    expect(config.dbSslRejectUnauthorized).toBe(false);
    expect(config.googleOauthRedirectUri).toBe('postmessage');
  });

  test('uses native app origins in production when web origins are missing', () => {
    const config = resolveConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      JWT_SECRET: 'prod-secret',
      FRONTEND_ORIGIN: '',
      ALLOWED_ORIGINS: ''
    });

    expect(config.allowedOrigins).toEqual([
      'http://localhost',
      'https://localhost',
      'capacitor://localhost',
      'ionic://localhost'
    ]);
  });

  test('parses trust proxy and production defaults', () => {
    const config = resolveConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      JWT_SECRET: 'prod-secret',
      FRONTEND_ORIGIN: 'https://app.example.com',
      TRUST_PROXY: '2',
      DB_SSL_REJECT_UNAUTHORIZED: 'true',
      ENABLE_NATIVE_APP_ORIGINS: 'false'
    });

    expect(config.logLevel).toBe('info');
    expect(config.allowedOrigins).toEqual(['https://app.example.com']);
    expect(config.trustProxy).toBe(2);
    expect(config.dbSslRejectUnauthorized).toBe(true);
    expect(config.googleOauthRedirectUri).toBe('postmessage');
  });

  test('supports custom google oauth redirect uri', () => {
    const config = resolveConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      JWT_SECRET: 'prod-secret',
      FRONTEND_ORIGIN: 'https://app.example.com',
      GOOGLE_OAUTH_REDIRECT_URI: 'https://app.example.com/auth/google/callback'
    });

    expect(config.googleOauthRedirectUri).toBe('https://app.example.com/auth/google/callback');
  });

  test('supports disabling native app origins', () => {
    const config = resolveConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/app',
      JWT_SECRET: 'prod-secret',
      ALLOWED_ORIGINS: 'https://app.example.com',
      ENABLE_NATIVE_APP_ORIGINS: 'false'
    });

    expect(config.allowedOrigins).toEqual(['https://app.example.com']);
  });
});
