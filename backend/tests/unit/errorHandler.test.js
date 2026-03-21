const { errorHandler } = require('../../src/middleware/errorHandler');

describe('errorHandler middleware', () => {
  const logger = {
    error: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the explicit error message for non-500 errors', () => {
    const middleware = errorHandler(logger);
    const request = {
      requestId: 'request-1',
      originalUrl: '/api/tasks',
      method: 'POST',
      user: {
        id: 'user-1'
      }
    };
    const response = {
      headersSent: false,
      statusCode: 200,
      payload: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      }
    };
    const next = jest.fn();
    const error = new Error('Bad request');
    error.statusCode = 400;

    middleware(error, request, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.payload.error).toBe('Bad request');
    expect(next).not.toHaveBeenCalled();
  });

  test('delegates to next when headers are already sent', () => {
    const middleware = errorHandler(logger);
    const response = {
      headersSent: true
    };
    const next = jest.fn();

    middleware(new Error('late error'), {}, response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
