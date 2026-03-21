const request = require('supertest');
const { createTestApp } = require('./helpers/testApp');
const {
  closeTestDatabase,
  resetTestDatabase,
  setupTestDatabase
} = require('./helpers/testDatabase');

describe('auth routes', () => {
  let app;
  let pool;

  beforeAll(async () => {
    pool = await setupTestDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
    app = createTestApp(pool);
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  test('registers and logs in a user', async () => {
    const registerResponse = await request(app).post('/api/auth/register').send({
      email: 'person@example.com',
      password: 'Password123'
    });

    expect(registerResponse.statusCode).toBe(201);
    expect(registerResponse.body.user.email).toBe('person@example.com');

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'person@example.com',
      password: 'Password123'
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.token).toEqual(expect.any(String));
  });

  test('rate limits repeated failed logins', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'person@example.com',
      password: 'Password123'
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await request(app).post('/api/auth/login').send({
        email: 'person@example.com',
        password: 'wrong-password'
      });

      expect([401, 429]).toContain(response.statusCode);
    }

    const blockedResponse = await request(app).post('/api/auth/login').send({
      email: 'person@example.com',
      password: 'wrong-password'
    });

    expect(blockedResponse.statusCode).toBe(429);
  });

  test('returns configuration error when google sign-in is disabled', async () => {
    const response = await request(app).post('/api/auth/google').send({
      code: '4/0AdQt8qh-example-auth-code-with-sufficient-length'
    });

    expect(response.statusCode).toBe(503);
    expect(response.body.error).toBe('Internal server error.');
  });
});
