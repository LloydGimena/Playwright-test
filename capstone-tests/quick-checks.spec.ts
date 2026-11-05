import { test, expect } from '@playwright/test';

test('DSH-09: the live data endpoint refuses a logged-out request', async ({ request }) => {
  const res = await request.get('admin-live-data.php');
  expect(res.status()).toBe(401);
  expect(await res.text()).toContain('Not authorized');
});

test('DSH-10 (partial): the chart data endpoint refuses a logged-out request', async ({ request }) => {
  const res = await request.get('admin-chart-data.php');
  expect(res.status()).toBe(401);
  expect(await res.text()).toContain('Not authorized');
});

test('NET-01: from the admin network, the admin login page opens', async ({ page }) => {
  const res = await page.goto('admin-login.php');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
});