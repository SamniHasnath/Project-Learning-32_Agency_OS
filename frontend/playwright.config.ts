import { defineConfig, devices } from "@playwright/test";

/**
 * Browser E2E tests. They expect the full stack to be running:
 *   API on http://localhost:3001, web app on E2E_BASE_URL (default http://localhost:3000).
 * Each run registers fresh agencies, so it never touches existing data.
 *
 *   npm run test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    acceptDownloads: true,
  },
  projects: [
    {
      name: "chrome",
      // Use the locally installed Chrome; CI uses Playwright's bundled Chromium.
      use: { ...devices["Desktop Chrome"], channel: process.env.CI ? undefined : "chrome" },
    },
  ],
});
