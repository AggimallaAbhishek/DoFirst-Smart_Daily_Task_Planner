import axios from 'axios';
import { getStoredSession } from '../lib/session';

const PROD_API_FALLBACK = 'https://dofirst-smart-daily-task-planner-backend.onrender.com';

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (import.meta.env.PROD) {
    return PROD_API_FALLBACK;
  }

  return 'http://localhost:4301';
}

const httpClient = axios.create({
  baseURL: resolveApiBaseUrl(),
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
