const { OAuth2Client } = require('google-auth-library');

function resolveAllowedAudiences(config) {
  const configuredAudiences = Array.isArray(config.googleOauthAllowedAudiences)
    ? config.googleOauthAllowedAudiences.filter(Boolean)
    : [];

  if (configuredAudiences.length > 0) {
    return configuredAudiences.length === 1 ? configuredAudiences[0] : configuredAudiences;
  }

  return config.googleOauthClientId;
}

function createGoogleOAuthClient({ config }) {
  if (!config.googleOauthClientId) {
    return null;
  }

  const oauthClient = config.googleOauthClientSecret
    ? new OAuth2Client(config.googleOauthClientId, config.googleOauthClientSecret)
    : new OAuth2Client(config.googleOauthClientId);

  async function verifyProfileFromIdToken(idToken) {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: resolveAllowedAudiences(config)
    });
    const payload = ticket.getPayload();

    return {
      email: payload?.email || '',
      emailVerified: Boolean(payload?.email_verified),
      name: payload?.name || '',
      picture: payload?.picture || '',
      subject: payload?.sub || ''
    };
  }

  async function getProfileFromCode(code) {
    if (!config.googleOauthClientSecret) {
      throw new Error('Google OAuth client secret is required for code exchange.');
    }

    const tokenResponse = await oauthClient.getToken({
      code,
      redirect_uri: config.googleOauthRedirectUri || 'postmessage'
    });
    const idToken = tokenResponse?.tokens?.id_token;

    if (!idToken) {
      throw new Error('Google did not return an ID token.');
    }

    return verifyProfileFromIdToken(idToken);
  }

  async function getProfileFromIdToken(idToken) {
    if (!idToken) {
      throw new Error('Google ID token is required.');
    }

    return verifyProfileFromIdToken(idToken);
  }

  return {
    getProfileFromCode,
    getProfileFromIdToken
  };
}

module.exports = {
  createGoogleOAuthClient
};
