const { googleLoginSchema, loginSchema, registerSchema } = require('../../src/modules/auth/validators/authSchemas');

describe('auth validation schemas', () => {
  test('accepts valid register payload', () => {
    const result = registerSchema.validate({
      body: {
        email: 'person@example.com',
        password: 'Password123'
      },
      params: {},
      query: {}
    });

    expect(result.error).toBeUndefined();
  });

  test('rejects invalid login payload', () => {
    const result = loginSchema.validate({
      body: {
        email: 'not-an-email',
        password: 'short'
      },
      params: {},
      query: {}
    });

    expect(result.error).toBeDefined();
  });

  test('accepts valid google auth code payload', () => {
    const result = googleLoginSchema.validate({
      body: {
        code: '4/0AdQt8qh-example-auth-code-with-sufficient-length'
      },
      params: {},
      query: {}
    });

    expect(result.error).toBeUndefined();
  });

  test('accepts valid google id-token payload', () => {
    const result = googleLoginSchema.validate({
      body: {
        idToken:
          'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQifQ.eyJlbWFpbCI6InBlcnNvbkBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.signature-part-with-extra-length'
      },
      params: {},
      query: {}
    });

    expect(result.error).toBeUndefined();
  });

  test('rejects empty google auth code payload', () => {
    const result = googleLoginSchema.validate({
      body: {
        code: 'short'
      },
      params: {},
      query: {}
    });

    expect(result.error).toBeDefined();
  });

  test('rejects payload when both code and idToken are sent', () => {
    const result = googleLoginSchema.validate({
      body: {
        code: '4/0AdQt8qh-example-auth-code-with-sufficient-length',
        idToken:
          'eyJhbGciOiJSUzI1NiIsImtpZCI6IjEyMzQifQ.eyJlbWFpbCI6InBlcnNvbkBleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlfQ.signature-part-with-extra-length'
      },
      params: {},
      query: {}
    });

    expect(result.error).toBeDefined();
  });
});
