const { randomUUID } = require('crypto');

function requestLogger(logger) {
  return (request, response, next) => {
    const requestId = request.headers['x-request-id'] || randomUUID();
    const startedAt = Date.now();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      logger.info('Request completed.', {
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: Date.now() - startedAt,
        userId: request.user?.id || null,
        ip: request.ip
      });
    });

    next();
  };
}

module.exports = {
  requestLogger
};
