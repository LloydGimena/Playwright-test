import { test, expect } from '@playwright/test';
import { login, openMenuItem } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('EXP-03 (partial): favorites page lists saved photographers', async ({ page }) => {
  await openMenuItem(page, 'Favorites');
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Profile' }).first()).toBeVisible();
});

test('NTF-01 (client part): notification panel shows the booking notification', async ({ page }) => {
  await page.getByRole('button', { name: /notification/i }).click();
  await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
  await expect(page.getByText('Booking Submitted').first()).toBeVisible();
});

test('SES-02: user can log out', async ({ page }) => {
  await openMenuItem(page, 'Log out');
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).not.toHaveURL(/bookings|favorites/);
});