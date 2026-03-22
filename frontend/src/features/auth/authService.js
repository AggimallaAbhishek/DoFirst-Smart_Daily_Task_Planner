import httpClient from '../../api/httpClient';

export async function registerUser(credentials) {
  const response = await httpClient.post('/api/auth/register', credentials);
  return response.data.user;
}

export async function loginUser(credentials) {
  const response = await httpClient.post('/api/auth/login', credentials, {
    retryable: true
  });
  return response.data;
}

export async function loginWithGoogle(payload) {
  const response = await httpClient.post('/api/auth/google', payload, {
    retryable: true
  });
  return response.data;
}
