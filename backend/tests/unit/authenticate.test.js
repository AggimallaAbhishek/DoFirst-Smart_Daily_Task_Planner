const { signAccessToken } = require('../../src/utils/jwt');
const { authenticate } = require('../../src/middleware/authenticate');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };
}

describe('authenticate middleware', () => {
  const config = {
    jwtSecret: 'middleware-test-secret',
    jwtExpiresIn: '24h'
  };

  test('returns 401 when the authorization header is missing', () => {
    const request = {
      headers: {}
    };
    const response = createResponse();
    const next = jest.fn();

    authenticate(config)(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when the token is invalid', () => {
    const request = {
      headers: {
        authorization: 'Bearer invalid-token'
      }
    };
    const response = createResponse();
    const next = jest.fn();

    authenticate(config)(request, response, next);

    expect(response.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('attaches the authenticated user for valid tokens', () => {
    const token = signAccessToken(
      {
        sub: 'user-1',
        email: 'person@example.com'
      },
      config
    );

    const request = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    const response = createResponse();
    const next = jest.fn();

    authenticate(config)(request, response, next);

    expect(request.user).toEqual({
      id: 'user-1',
      email: 'person@example.com'
    });
    expect(next).toHaveBeenCalledTimes(1);
  });
});
