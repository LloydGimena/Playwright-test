import { test, expect } from '@playwright/test';
import { login, openMenuItem } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
});

for (const item of ['My Profile', 'Payment History', 'Help / Report a Problem']) {
  test(`NAV: profile menu opens "${item}"`, async ({ page }) => {
    const before = page.url();
    await openMenuItem(page, item);
    await expect(page).not.toHaveURL(before);
    await expect(page.getByRole('heading').first()).toBeVisible();
  });
}

test('NAV: profile menu opens "My Reviews" with a Write Review button', async ({ page }) => {
  await openMenuItem(page, 'My Reviews');
  await expect(page.getByRole('button', { name: 'Write Review' }).first()).toBeVisible();
});

test('NTF-01 (client part): bell panel shows a notification and its View Details opens the booking', async ({ page }) => {
  await page.getByRole('button', { name: /notification/i }).click();
  await expect(page.getByText('Booking Submitted').first()).toBeVisible();
  await page.getByRole('link', { name: 'View Details' }).first().click();
  await expect(page).toHaveURL(/\/booking\/\d+\/details/);
});