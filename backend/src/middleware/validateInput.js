function validateInput(schema) {
  return (request, response, next) => {
    const validationTarget = {
      body: request.body,
      params: request.params,
      query: request.query
    };

    const { error, value } = schema.validate(validationTarget, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return response.status(400).json({
        error: 'Invalid request payload.',
        details: error.details.map((detail) => detail.message)
      });
    }

    request.body = value.body;
    request.params = value.params;
    request.query = value.query;

    return next();
  };
}

module.exports = {
  validateInput
};
