import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('LIVE-01: the test client can sign in', async ({ page }) => {
  await login(page);
  await expect(page.getByRole('button', { name: /Notifications/ })).toBeVisible();
});