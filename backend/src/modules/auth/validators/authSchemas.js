const Joi = require('joi');

const email = Joi.string().trim().email().max(255).required();
const password = Joi.string().min(8).max(128).required();

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

module.exports = {
  loginSchema,
  registerSchema
};
