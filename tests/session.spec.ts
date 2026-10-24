import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('SES-03: logged-out user opening a protected page is sent to Login', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page).toHaveURL(/\/login/);
});

test('SES-01: user stays logged in after a page refresh', async ({ page }) => {
  await login(page);
  await page.goto('/bookings');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
  await expect(page).not.toHaveURL(/\/login/);
});