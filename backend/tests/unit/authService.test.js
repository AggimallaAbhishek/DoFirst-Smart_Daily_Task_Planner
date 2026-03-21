const { createAuthService } = require('../../src/modules/auth/services/authService');

describe('authService', () => {
  const logger = {
    debug: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('register normalizes email and creates a new user', async () => {
    const authService = createAuthService({
      authRepository: {
        findUserByEmail: jest.fn().mockResolvedValue(null),
        createUser: jest.fn().mockResolvedValue({
          id: '9d9e5fd6-e786-4c66-bea8-38101f640621',
          email: 'person@example.com',
          created_at: '2026-03-21T10:00:00.000Z'
        })
      },
      logger
    });

    const user = await authService.register({
      email: ' Person@Example.com ',
      password: 'Password123'
    });

    expect(user).toEqual({
      id: '9d9e5fd6-e786-4c66-bea8-38101f640621',
      email: 'person@example.com',
      createdAt: '2026-03-21T10:00:00.000Z'
    });
  });

  test('login rejects invalid credentials', async () => {
    const authService = createAuthService({
      authRepository: {
        findUserByEmail: jest.fn().mockResolvedValue(null)
      },
      logger
    });

    await expect(
      authService.login({
        email: 'person@example.com',
        password: 'wrong-password'
      })
    ).rejects.toMatchObject({
      statusCode: 401
    });
  });
});
