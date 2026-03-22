import axios from 'axios';
import { getStoredSession } from '../lib/session';

const PROD_API_FALLBACK = 'https://dofirst-smart-daily-task-planner-backend.onrender.com';
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);
const DEFAULT_MAX_RETRIES = import.meta.env.PROD ? 2 : 1;
const MAX_RETRY_DELAY_MS = 2500;
const BASE_RETRY_DELAY_MS = 350;

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
}

function resolveMaxRetries(requestConfig) {
  if (typeof requestConfig?.maxRetries === 'number') {
    return requestConfig.maxRetries;
  }

  return parsePositiveInteger(import.meta.env.VITE_HTTP_RETRY_MAX, DEFAULT_MAX_RETRIES);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function computeRetryDelay(attempt) {
  const exponentialDelay = BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attempt - 1);
  const jitter = Math.floor(Math.random() * 160);
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY_MS);
}

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, '');
  }

  if (import.meta.env.PROD) {
    console.warn('[httpClient] VITE_API_URL is missing. Using production fallback URL.', {
      fallback: PROD_API_FALLBACK
    });
    return PROD_API_FALLBACK;
  }

  return 'http://localhost:4301';
}

const httpClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 30000
});

httpClient.interceptors.request.use((config) => {
  const session = getStoredSession();

  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }

  return config;
});

function isRetryableMethod(config) {
  if (config.retryable === true) {
    return true;
  }

  const method = typeof config.method === 'string' ? config.method.toLowerCase() : 'get';
  return RETRYABLE_METHODS.has(method);
}

function shouldRetry(error) {
  if (!error?.config || error.code === 'ERR_CANCELED') {
    return false;
  }

  const { config } = error;
  const attempt = config.__retryAttempt || 0;
  const maxRetries = resolveMaxRetries(config);

  if (attempt >= maxRetries || !isRetryableMethod(config)) {
    return false;
  }

  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
    return true;
  }

  const status = error.response?.status;
  return Boolean(status && RETRYABLE_STATUS_CODES.has(status));
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!shouldRetry(error)) {
      return Promise.reject(error);
    }

    const config = error.config;
    config.__retryAttempt = (config.__retryAttempt || 0) + 1;
    const delayMs = computeRetryDelay(config.__retryAttempt);

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug('[httpClient] retrying request', {
        attempt: config.__retryAttempt,
        maxRetries: resolveMaxRetries(config),
        method: config.method,
        url: config.url,
        delayMs
      });
    }

    await wait(delayMs);
    return httpClient(config);
  }
);

export default httpClient;
