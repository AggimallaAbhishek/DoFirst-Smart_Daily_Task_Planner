const request = require('supertest');
const { createApp } = require('../../src/app/createApp');

describe('application routes', () => {
  const config = {
    allowedOrigins: ['http://localhost:5173'],
    authRateLimitMax: 5,
    apiRateLimitMax: 100,
    rateLimitWindowMs: 15 * 60 * 1000,
    requestTimeoutMs: 30 * 1000,
    slowRequestThresholdMs: 1000,
    jwtSecret: 'test-secret',
    jwtExpiresIn: '24h'
  };
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  };

  test('returns 404 for unknown routes', async () => {
    const app = createApp({
      config,
      logger,
      pool: {
        query: jest.fn().mockResolvedValue({ rows: [] })
      }
    });

    const response = await request(app).get('/missing');

    expect(response.statusCode).toBe(404);
  });

  test('rejects disallowed cors origins', async () => {
    const app = createApp({
      config,
      logger,
      pool: {
        query: jest.fn().mockResolvedValue({ rows: [] })
      }
    });

    const response = await request(app).get('/health').set('Origin', 'https://malicious.example');

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toBe('Origin is not allowed by CORS policy.');
  });

  test('returns liveness endpoint without requiring database calls', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    const app = createApp({
      config,
      logger,
      pool: { query }
    });

    const response = await request(app).get('/health/live');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(query).not.toHaveBeenCalled();
  });

  test('allows native app loopback origins used by Capacitor', async () => {
    const app = createApp({
      config,
      logger,
      pool: {
        query: jest.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] })
      }
    });

    const response = await request(app).get('/health').set('Origin', 'http://localhost:8080');

    expect(response.statusCode).toBe(200);
  });
});
