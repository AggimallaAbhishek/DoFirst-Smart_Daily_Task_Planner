function errorHandler(logger) {
  return (error, request, response, next) => {
    if (response.headersSent) {
      return next(error);
    }

    const statusCode = error.statusCode || 500;

    logger.error('Unhandled request error.', {
      requestId: request.requestId,
      path: request.originalUrl,
      method: request.method,
      statusCode,
      userId: request.user?.id || null,
      errorMessage: error.message,
      stack: error.stack
    });

    return response.status(statusCode).json({
      error: statusCode >= 500 ? 'Internal server error.' : error.message,
      details: error.details || undefined
    });
  };
}

module.exports = {
  errorHandler
};
