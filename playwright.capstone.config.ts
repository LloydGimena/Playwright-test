import { defineConfig } from '@playwright/test';
import 'dotenv/config'; // loads CAPSTONE_ADMIN_USER / CAPSTONE_ADMIN_PASS from .env

export default defineConfig({
  testDir: './capstone-tests',          // only the capstone folder
  outputDir: './test-results-capstone', // keeps its results apart from Booking's
  workers: 1,
  fullyParallel: false,                 // tests run in order, one at a time
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-capstone', open: 'never' }],
    ['json', { outputFile: 'results-capstone.json' }],
  ],
  use: {
    baseURL: 'http://192.168.88.10/portal/', // trailing slash matters
    channel: 'msedge',
    actionTimeout: 20000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
});