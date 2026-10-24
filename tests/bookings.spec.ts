import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

test('BST-01: client sees their bookings list', async ({ page }) => {
  await page.goto('/bookings');
  await expect(page.getByRole('heading', { name: 'My Bookings' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('View Details').first()).toBeVisible({ timeout: 15000 });
});