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
      createdAt: '2026-03-21T10:00:00.000Z',
      name: null,
      avatarUrl: null
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

  test('google login creates a new user when account is missing', async () => {
    const authService = createAuthService({
      authRepository: {
        findUserByEmail: jest.fn().mockResolvedValue(null),
        createUser: jest.fn().mockResolvedValue({
          id: '30a80e6f-3b6e-4e9a-bac5-c76cd8c8251f',
          email: 'google-user@example.com',
          created_at: '2026-03-21T10:30:00.000Z'
        })
      },
      googleOAuthClient: {
        getProfileFromCode: jest.fn().mockResolvedValue({
          email: 'Google-User@Example.com',
          emailVerified: true,
          name: 'Google User',
          picture: 'https://example.com/avatar.png',
          subject: 'google-sub-123'
        })
      },
      logger
    });

    const user = await authService.loginWithGoogle({
      code: 'auth-code'
    });

    expect(user).toEqual({
      id: '30a80e6f-3b6e-4e9a-bac5-c76cd8c8251f',
      email: 'google-user@example.com',
      createdAt: '2026-03-21T10:30:00.000Z',
      name: 'Google User',
      avatarUrl: 'https://example.com/avatar.png'
    });
  });

  test('google login rejects unverified email accounts', async () => {
    const authService = createAuthService({
      authRepository: {
        findUserByEmail: jest.fn()
      },
      googleOAuthClient: {
        getProfileFromCode: jest.fn().mockResolvedValue({
          email: 'person@example.com',
          emailVerified: false,
          name: 'Person',
          picture: '',
          subject: 'google-sub-456'
        })
      },
      logger
    });

    await expect(
      authService.loginWithGoogle({
        code: 'auth-code'
      })
    ).rejects.toMatchObject({
      statusCode: 401
    });
  });

  test('google login supports native id token flow for existing users', async () => {
    const authService = createAuthService({
      authRepository: {
        findUserByEmail: jest.fn().mockResolvedValue({
          id: '36b4fc2a-03f0-487f-b85f-e74856b145e5',
          email: 'native-user@example.com',
          created_at: '2026-03-21T12:00:00.000Z'
        }),
        createUser: jest.fn()
      },
      googleOAuthClient: {
        getProfileFromCode: jest.fn(),
        getProfileFromIdToken: jest.fn().mockResolvedValue({
          email: 'native-user@example.com',
          emailVerified: true,
          name: 'Native User',
          picture: 'https://example.com/native-avatar.png',
          subject: 'native-subject'
        })
      },
      logger
    });

    const user = await authService.loginWithGoogle({
      idToken: 'native-id-token'
    });

    expect(user).toEqual({
      id: '36b4fc2a-03f0-487f-b85f-e74856b145e5',
      email: 'native-user@example.com',
      createdAt: '2026-03-21T12:00:00.000Z',
      name: 'Native User',
      avatarUrl: 'https://example.com/native-avatar.png'
    });
  });
});
