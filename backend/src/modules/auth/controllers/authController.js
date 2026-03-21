const { asyncHandler } = require('../../../utils/asyncHandler');
const { signAccessToken } = require('../../../utils/jwt');

function createAuthController({ authService, config }) {
  const register = asyncHandler(async (request, response) => {
    const user = await authService.register(request.body);

    return response.status(201).json({
      user
    });
  });

  const login = asyncHandler(async (request, response) => {
    const user = await authService.login(request.body);
    const token = signAccessToken(
      {
        sub: user.id,
        email: user.email
      },
      config
    );

    return response.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  });

  return {
    login,
    register
  };
}

module.exports = {
  createAuthController
};
