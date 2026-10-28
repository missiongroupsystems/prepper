import { defineConfig } from '@playwright/test';

/** Pure unit tests (`src/**\/*.test.ts`) on the Playwright runner — no browser, no auth setup. */
export default defineConfig({
  testDir: './src',
  testMatch: /.*\.test\.ts$/,
  reporter: 'list',
});
