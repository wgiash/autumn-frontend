import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3200";

export default defineConfig({
  testDir: "./tests/frontend",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    contextOptions: { reducedMotion: "reduce" },
    trace: "retain-on-failure",
  },
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      stylePath: "./tests/frontend/screenshot.css",
      maxDiffPixelRatio: 0.001,
    },
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 950 } } },
    { name: "tablet", use: { viewport: { width: 755, height: 950 } } },
    {
      name: "phone",
      use: { viewport: { width: 390, height: 950 }, hasTouch: true },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --port 3200",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
