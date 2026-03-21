const express = require('express');
const { validateInput } = require('../../../middleware/validateInput');
const { googleLoginSchema, loginSchema, registerSchema } = require('../validators/authSchemas');

function createAuthRouter({ authController, authRateLimiter }) {
  const router = express.Router();

  router.post('/register', authRateLimiter, validateInput(registerSchema), authController.register);
  router.post('/login', authRateLimiter, validateInput(loginSchema), authController.login);
  router.post('/google', authRateLimiter, validateInput(googleLoginSchema), authController.googleLogin);

  return router;
}

module.exports = {
  createAuthRouter
};
