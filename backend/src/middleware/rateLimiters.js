const rateLimit = require('express-rate-limit');

function createRateLimiters(config) {
  const baseConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    windowMs: config.rateLimitWindowMs
  };

  return {
    authRateLimiter: rateLimit({
      ...baseConfig,
      max: config.authRateLimitMax,
      message: {
        error: 'Too many authentication attempts. Please try again later.'
      }
    }),
    apiRateLimiter: rateLimit({
      ...baseConfig,
      max: config.apiRateLimitMax,
      message: {
        error: 'Too many requests. Please try again later.'
      }
    })
  };
}

module.exports = {
  createRateLimiters
};
