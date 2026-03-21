const winston = require('winston');

const REDACTED_KEYS = new Set(['password', 'passwordHash', 'token', 'authorization', 'jwtSecret']);

function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
    accumulator[key] = REDACTED_KEYS.has(key) ? '[REDACTED]' : sanitize(nestedValue);
    return accumulator;
  }, {});
}

function createLogger(level = 'debug') {
  return winston.createLogger({
    level,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const payload = sanitize(info);
        return JSON.stringify(payload);
      })
    ),
    defaultMeta: {
      service: 'smart-daily-planner-backend'
    },
    transports: [new winston.transports.Console()]
  });
}

module.exports = {
  createLogger
};
