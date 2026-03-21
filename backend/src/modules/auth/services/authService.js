const crypto = require('crypto');
const { createHttpError } = require('../../../utils/httpError');
const { mapUser } = require('../../../utils/mappers');
const { hashPassword, verifyPassword } = require('../../../utils/passwords');

function createAuthService({ authRepository, logger, googleOAuthClient }) {
  async function register({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    logger.debug('Registering new user.', {
      email: normalizedEmail
    });

    const existingUser = await authRepository.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw createHttpError(409, 'An account already exists for this email address.');
    }

    const passwordHash = await hashPassword(password);
    const user = await authRepository.createUser({
      email: normalizedEmail,
      passwordHash
    });

    return mapUser(user);
  }

  async function login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    logger.debug('Attempting login.', {
      email: normalizedEmail
    });

    const user = await authRepository.findUserByEmail(normalizedEmail);

    if (!user) {
      throw createHttpError(401, 'Invalid email or password.');
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
      throw createHttpError(401, 'Invalid email or password.');
    }

    return mapUser(user);
  }

  async function loginWithGoogle({ code }) {
    if (!googleOAuthClient) {
      throw createHttpError(503, 'Google sign-in is not configured for this environment.');
    }

    logger.debug('Attempting Google sign-in.');

    let profile;
    try {
      profile = await googleOAuthClient.getProfileFromCode(code);
    } catch (error) {
      logger.debug('Google sign-in failed during code exchange.', {
        reason: error.message
      });
      throw createHttpError(401, 'Google sign-in failed. Please try again.');
    }

    const normalizedEmail = profile.email.trim().toLowerCase();

    if (!normalizedEmail || !profile.emailVerified) {
      throw createHttpError(401, 'Google account email is not verified.');
    }

    let user = await authRepository.findUserByEmail(normalizedEmail);

    if (!user) {
      const generatedPassword = crypto.randomBytes(48).toString('hex');
      const passwordHash = await hashPassword(generatedPassword);
      user = await authRepository.createUser({
        email: normalizedEmail,
        passwordHash
      });

      logger.debug('Created a local user from Google sign-in.', {
        email: normalizedEmail,
        googleSubject: profile.subject
      });
    }

    return {
      ...mapUser(user),
      name: profile.name || null,
      avatarUrl: profile.picture || null
    };
  }

  return {
    login,
    loginWithGoogle,
    register
  };
}

module.exports = {
  createAuthService
};
