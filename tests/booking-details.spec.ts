import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.goto('/bookings');
  await page.getByRole('button', { name: 'View Details' }).first().click();
  await expect(page).toHaveURL(/\/booking\/\d+\/details/);
});

test('CHG-01 (partial): booking details offer a reschedule option', async ({ page }) => {
  await expect(page.getByText(/Reschedule/).first()).toBeVisible();
});

test('CHG-04 (partial): cancel request form opens and can be closed without sending', async ({ page }) => {
  await page.getByRole('button', { name: 'Cancel Booking' }).click();
  const reason = page.getByRole('textbox', { name: 'Please explain your request' });
  await expect(reason).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(reason).toBeHidden();
});