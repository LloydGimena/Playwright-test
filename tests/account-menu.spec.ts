import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('EXP-03 (partial): favorites page lists saved photographers', async ({ page }) => {
  await page.getByRole('button', { name: /^TC\s*Test$/ }).click();
  await page.getByText('Favorites', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View Profile' }).first()).toBeVisible();
});

test('NTF-01 (client part): notification panel shows the booking notification', async ({ page }) => {
  await page.getByRole('button', { name: /notification/i }).click();
  await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
  await expect(page.getByText('Booking Submitted').first()).toBeVisible();
});

test('SES-02: user can log out', async ({ page }) => {
  await page.getByRole('button', { name: /^TC\s*Test$/ }).click();
  await page.getByText('Log out', { exact: true }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).not.toHaveURL(/bookings|favorites/);
  await page.goto('/bookings');
  await expect(page).toHaveURL(/\/login/);
});