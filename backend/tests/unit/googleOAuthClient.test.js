const mockGetToken = jest.fn();
const mockVerifyIdToken = jest.fn();
const mockOAuth2Client = jest.fn().mockImplementation(() => ({
  getToken: mockGetToken,
  verifyIdToken: mockVerifyIdToken
}));

jest.mock('google-auth-library', () => ({
  OAuth2Client: mockOAuth2Client
}));

const { createGoogleOAuthClient } = require('../../src/modules/auth/services/googleOAuthClient');

describe('googleOAuthClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns null when oauth credentials are missing', () => {
    const client = createGoogleOAuthClient({
      config: {
        googleOauthClientId: '',
        googleOauthClientSecret: ''
      }
    });

    expect(client).toBeNull();
    expect(mockOAuth2Client).not.toHaveBeenCalled();
  });

  test('exchanges auth code for a verified google profile', async () => {
    const client = createGoogleOAuthClient({
      config: {
        googleOauthClientId: 'google-client-id',
        googleOauthClientSecret: 'google-client-secret'
      }
    });

    mockGetToken.mockResolvedValue({
      tokens: {
        id_token: 'google-id-token'
      }
    });
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'person@example.com',
        email_verified: true,
        name: 'Person Example',
        picture: 'https://example.com/avatar.png',
        sub: 'google-subject'
      })
    });

    const profile = await client.getProfileFromCode('oauth-code');

    expect(mockGetToken).toHaveBeenCalledWith({
      code: 'oauth-code',
      redirect_uri: 'postmessage'
    });
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: 'google-id-token',
      audience: 'google-client-id'
    });
    expect(profile).toEqual({
      email: 'person@example.com',
      emailVerified: true,
      name: 'Person Example',
      picture: 'https://example.com/avatar.png',
      subject: 'google-subject'
    });
  });

  test('fails when token exchange does not include an id token', async () => {
    const client = createGoogleOAuthClient({
      config: {
        googleOauthClientId: 'google-client-id',
        googleOauthClientSecret: 'google-client-secret'
      }
    });

    mockGetToken.mockResolvedValue({
      tokens: {}
    });

    await expect(client.getProfileFromCode('oauth-code')).rejects.toThrow(
      'Google did not return an ID token.'
    );
  });
});
