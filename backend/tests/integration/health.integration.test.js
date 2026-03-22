const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const {
  closeTestDatabase,
  setupTestDatabase
} = require('./helpers/testDatabase');

describe('health route', () => {
  afterEach(async () => {
    await closeTestDatabase();
  });

  test('returns connected status when the database is healthy', async () => {
    const pool = await setupTestDatabase();
    const app = createTestApp(pool);

    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.database).toBe('connected');
  });

  test('returns 503 when the database check fails', async () => {
    const app = createTestApp({
      query: jest.fn().mockRejectedValue(new Error('db down'))
    });

    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(503);
    expect(response.body.database).toBe('unavailable');
    expect(response.body.status).toBe('degraded');
  });

  test('returns 200 from liveness route even when db checks fail', async () => {
    const app = createTestApp({
      query: jest.fn().mockRejectedValue(new Error('db down'))
    });

    const response = await request(app).get('/health/live');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});
