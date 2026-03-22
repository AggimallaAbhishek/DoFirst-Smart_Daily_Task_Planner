const { randomUUID } = require('crypto');

function requestLogger(logger, config = {}) {
  const slowThresholdMs = config.slowRequestThresholdMs || 1000;

  return (request, response, next) => {
    const requestId = request.headers['x-request-id'] || randomUUID();
    const startedAt = Date.now();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    response.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      const payload = {
        requestId,
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs,
        userId: request.user?.id || null,
        ip: request.ip
      };

      if (durationMs >= slowThresholdMs) {
        logger.warn('Slow request detected.', payload);
        return;
      }

      logger.info('Request completed.', payload);
    });

    next();
  };
}

module.exports = {
  requestLogger
};
