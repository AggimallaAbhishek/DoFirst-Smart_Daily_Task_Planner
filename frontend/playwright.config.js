import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command:
        'PORT=4311 FRONTEND_ORIGIN=http://127.0.0.1:5174 ALLOWED_ORIGINS=http://127.0.0.1:5174,http://localhost:5174 AUTH_RATE_LIMIT_MAX=250 API_RATE_LIMIT_MAX=5000 RATE_LIMIT_WINDOW_MS=60000 npm run start --workspace backend',
      url: 'http://127.0.0.1:4311/health',
      reuseExistingServer: false
    },
    {
      command:
        'VITE_API_URL=http://127.0.0.1:4311 npm run dev --workspace frontend -- --host 127.0.0.1 --port 5174',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: false
    }
  ]
});
