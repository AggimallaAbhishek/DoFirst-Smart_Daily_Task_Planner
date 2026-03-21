const { createHttpError } = require('../../../utils/httpError');
const { mapUser } = require('../../../utils/mappers');
const { hashPassword, verifyPassword } = require('../../../utils/passwords');

function createAuthService({ authRepository, logger }) {
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

  return {
    login,
    register
  };
}

module.exports = {
  createAuthService
};
