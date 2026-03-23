const { EventEmitter } = require('events');
const { requestLogger } = require('../../src/middleware/requestLogger');

describe('requestLogger middleware', () => {
  function createResponse() {
    const response = new EventEmitter();
    response.statusCode = 200;
    response.headers = {};
    response.setHeader = jest.fn((key, value) => {
      response.headers[key] = value;
    });
    return response;
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('logs completed request with info for fast requests', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn()
    };
    const middleware = requestLogger(logger, {
      slowRequestThresholdMs: 1000
    });

    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1200);

    const request = {
      headers: { 'x-request-id': 'req-123' },
      method: 'GET',
      originalUrl: '/health',
      user: { id: 'user-1' },
      ip: '127.0.0.1'
    };
    const response = createResponse();
    const next = jest.fn();

    middleware(request, response, next);
    response.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(request.requestId).toBe('req-123');
    expect(response.setHeader).toHaveBeenCalledWith('x-request-id', 'req-123');
    expect(logger.info).toHaveBeenCalledWith(
      'Request completed.',
      expect.objectContaining({
        requestId: 'req-123',
        method: 'GET',
        path: '/health',
        statusCode: 200,
        durationMs: 200,
        userId: 'user-1',
        ip: '127.0.0.1'
      })
    );
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test('logs slow requests with warn when threshold is exceeded', () => {
    const logger = {
      info: jest.fn(),
      warn: jest.fn()
    };
    const middleware = requestLogger(logger, {
      slowRequestThresholdMs: 300
    });

    jest.spyOn(Date, 'now').mockReturnValueOnce(5000).mockReturnValueOnce(5401);

    const request = {
      headers: { 'x-request-id': 'req-456' },
      method: 'POST',
      originalUrl: '/api/tasks',
      ip: '10.0.0.1'
    };
    const response = createResponse();
    response.statusCode = 201;
    const next = jest.fn();

    middleware(request, response, next);
    response.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Slow request detected.',
      expect.objectContaining({
        requestId: 'req-456',
        method: 'POST',
        path: '/api/tasks',
        statusCode: 201,
        durationMs: 401,
        userId: null,
        ip: '10.0.0.1'
      })
    );
    expect(logger.info).not.toHaveBeenCalled();
  });
});
