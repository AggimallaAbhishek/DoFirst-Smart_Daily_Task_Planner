import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'retain-on-failure'
  },
  webServer: [
    {
      command: 'PORT=4301 npm run start --workspace backend',
      url: 'http://127.0.0.1:4301/health',
      reuseExistingServer: !process.env.CI
    },
    {
      command:
        'VITE_API_URL=http://127.0.0.1:4301 npm run dev --workspace frontend -- --host 127.0.0.1 --port 5173',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !process.env.CI
    }
  ]
});
