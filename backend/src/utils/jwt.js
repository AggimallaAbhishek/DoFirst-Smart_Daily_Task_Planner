const jwt = require('jsonwebtoken');

function signAccessToken(payload, config) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

function verifyAccessToken(token, config) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};
