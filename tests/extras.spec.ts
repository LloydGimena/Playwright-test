import { test, expect } from '@playwright/test';
import { login } from './helpers';

test('LOG-05: a logged-in client opening /login is sent to My Bookings', async ({ page }) => {
  await login(page);
  await page.goto('/login');
  await expect(page).toHaveURL(/\/bookings/);
});

test('LOG-UI: show-password button reveals the password', async ({ page }) => {
  await page.goto('/login');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('password');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
});

test('SES-01 (part): a new tab in the same browser is still logged in', async ({ page, context }) => {
  await login(page);
  const second = await context.newPage();
  await second.goto('/bookings');
  await expect(second.getByRole('heading', { name: 'My Bookings' })).toBeVisible();
  await expect(second).not.toHaveURL(/\/login/);
});

test('SES-02 (part): after logging out, the Back button does not show private pages', async ({ page }) => {
  await login(page);
  await page.goto('/bookings');
  await page.getByRole('button', { name: /^TC\s*Test$/ }).click();
  await page.getByText('Log out', { exact: true }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await page.waitForLoadState('networkidle');
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
});