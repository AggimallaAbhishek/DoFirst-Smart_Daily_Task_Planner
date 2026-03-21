const { signAccessToken, verifyAccessToken } = require('../../src/utils/jwt');

describe('jwt helpers', () => {
  const config = {
    jwtSecret: 'unit-test-secret',
    jwtExpiresIn: '24h'
  };

  test('signs and verifies access tokens', () => {
    const token = signAccessToken(
      {
        sub: 'user-1',
        email: 'person@example.com'
      },
      config
    );

    const payload = verifyAccessToken(token, config);

    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('person@example.com');
  });
});
