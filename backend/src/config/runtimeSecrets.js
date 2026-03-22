const { GetSecretValueCommand, SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');

async function loadRuntimeSecrets(config, logger) {
  if (!config.awsSecretsManagerSecretId) {
    return {};
  }

  const client = new SecretsManagerClient({ region: config.awsRegion });
  const command = new GetSecretValueCommand({
    SecretId: config.awsSecretsManagerSecretId
  });

  logger.info('Loading runtime secrets from AWS Secrets Manager.', {
    secretId: config.awsSecretsManagerSecretId,
    region: config.awsRegion
  });

  const response = await client.send(command);

  if (!response.SecretString) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(response.SecretString);
  } catch (error) {
    throw new Error(`AWS Secrets Manager payload must be valid JSON. ${error.message}`);
  }

  const allowedKeys = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SENTRY_DSN',
    'ALLOWED_ORIGINS',
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_ADDITIONAL_CLIENT_IDS',
    'GOOGLE_OAUTH_CLIENT_SECRET'
  ];

  return Object.fromEntries(
    Object.entries(parsed).filter(([key, value]) => allowedKeys.includes(key) && value)
  );
}

module.exports = {
  loadRuntimeSecrets
};
