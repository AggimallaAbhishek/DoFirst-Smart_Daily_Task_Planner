const Joi = require('joi');

const email = Joi.string().trim().email().max(255).required();
const password = Joi.string().min(8).max(128).required();
const oauthCode = Joi.string().trim().min(10).max(4096).required();
const googleIdToken = Joi.string().trim().min(100).max(8192).required();

const registerSchema = Joi.object({
  body: Joi.object({
    email,
    password
  }).required(),
  params: Joi.object({}).unknown(false),
  query: Joi.object({}).unknown(false)
});

const loginSchema = Joi.object({
  body: Joi.object({
    email,
    password
  }).required(),
  params: Joi.object({}).unknown(false),
  query: Joi.object({}).unknown(false)
});

const googleLoginSchema = Joi.object({
  body: Joi.object({
    code: oauthCode.optional(),
    idToken: googleIdToken.optional()
  })
    .required()
    .xor('code', 'idToken'),
  params: Joi.object({}).unknown(false),
  query: Joi.object({}).unknown(false)
});

module.exports = {
  googleLoginSchema,
  loginSchema,
  registerSchema
};
