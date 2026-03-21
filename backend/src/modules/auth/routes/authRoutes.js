const express = require('express');
const { validateInput } = require('../../../middleware/validateInput');
const { loginSchema, registerSchema } = require('../validators/authSchemas');

function createAuthRouter({ authController, authRateLimiter }) {
  const router = express.Router();

  router.post('/register', authRateLimiter, validateInput(registerSchema), authController.register);
  router.post('/login', authRateLimiter, validateInput(loginSchema), authController.login);

  return router;
}

module.exports = {
  createAuthRouter
};
