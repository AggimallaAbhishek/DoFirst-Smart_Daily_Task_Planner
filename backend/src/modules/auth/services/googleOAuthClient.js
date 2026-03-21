const { OAuth2Client } = require('google-auth-library');

function createGoogleOAuthClient({ config }) {
  if (!config.googleOauthClientId || !config.googleOauthClientSecret) {
    return null;
  }

  const oauthClient = new OAuth2Client(config.googleOauthClientId, config.googleOauthClientSecret);

  async function getProfileFromCode(code) {
    const tokenResponse = await oauthClient.getToken({
      code,
      redirect_uri: 'postmessage'
    });
    const idToken = tokenResponse?.tokens?.id_token;

    if (!idToken) {
      throw new Error('Google did not return an ID token.');
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: config.googleOauthClientId
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

  return {
    getProfileFromCode
  };
}

module.exports = {
  createGoogleOAuthClient
};
