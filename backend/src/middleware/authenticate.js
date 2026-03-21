const { verifyAccessToken } = require('../utils/jwt');

function authenticate(config) {
  return (request, response, next) => {
    const authorization = request.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return response.status(401).json({
        error: 'Authentication required.'
      });
    }

    const token = authorization.slice('Bearer '.length).trim();

    try {
      const payload = verifyAccessToken(token, config);
      const userId = payload?.sub;

      if (typeof userId !== 'string' || userId.trim() === '') {
        return response.status(401).json({
          error: 'Invalid or expired token.'
        });
      }

      request.user = {
        id: userId,
        email: payload.email
      };

      return next();
    } catch (error) {
      return response.status(401).json({
        error: 'Invalid or expired token.'
      });
    }
  };
}

module.exports = {
  authenticate
};
