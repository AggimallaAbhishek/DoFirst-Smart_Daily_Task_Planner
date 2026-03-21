import axios from 'axios';
import { getStoredSession } from '../lib/session';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000
});

httpClient.interceptors.request.use((config) => {
  const session = getStoredSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

export default httpClient;
