const Joi = require('joi');
const { validateInput } = require('../../src/middleware/validateInput');

describe('validateInput middleware', () => {
  const schema = Joi.object({
    body: Joi.object({
      title: Joi.string().required()
    }).required(),
    params: Joi.object({}).unknown(false),
    query: Joi.object({}).unknown(false)
  });

  test('passes sanitized data to the next middleware', () => {
    const middleware = validateInput(schema);
    const request = {
      body: {
        title: 'Focus block',
        ignored: true
      },
      params: {},
      query: {}
    };
    const response = {};
    const next = jest.fn();

    middleware(request, response, next);

    expect(request.body).toEqual({
      title: 'Focus block'
    });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('returns 400 for invalid payloads', () => {
    const middleware = validateInput(schema);
    const request = {
      body: {},
      params: {},
      query: {}
    };
    const response = {
      statusCode: 200,
      payload: undefined,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      }
    };
    const next = jest.fn();

    middleware(request, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.payload.error).toBe('Invalid request payload.');
    expect(next).not.toHaveBeenCalled();
  });
});
