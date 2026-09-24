import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';
import { AUTH_FILE } from './tests/paths';

// Records the critical journeys slowly so they can be turned into the README GIF.
// Not part of CI: run with `npm run demo`.
export default defineConfig({
  ...base,
  outputDir: 'demo-results',
  retries: 0,
  workers: 1,
  fullyParallel: false,
  reporter: 'list',
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'demo',
      testDir: './tests/e2e',
      testMatch: ['publish-article.spec.ts', 'comment.spec.ts'],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
        viewport: { width: 1280, height: 900 },
        video: { mode: 'on', size: { width: 1280, height: 900 } },
        launchOptions: { slowMo: 350 },
      },
    },
  ],
});
