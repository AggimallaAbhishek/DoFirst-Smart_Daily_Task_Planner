const Sentry = require('@sentry/node');

let initialized = false;

function initializeSentry(config) {
  if (initialized || !config.sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    tracesSampleRate: 0.2,
    environment: config.nodeEnv
  });

  initialized = true;
}

module.exports = {
  Sentry,
  initializeSentry
};
