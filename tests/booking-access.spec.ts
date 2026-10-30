import { test, expect } from '@playwright/test';

test('BKG-12 (partial): logged out, clicking Book asks the user to sign in', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Book' }).nth(2).click();
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
});

test('BKG-12 (partial): logged out, the booking address asks the user to sign in', async ({ page }) => {
  await page.goto('/booking/24');
  await expect(page.getByRole('textbox', { name: 'Email Address' })).toBeVisible();
});