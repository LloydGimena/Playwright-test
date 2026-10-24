import { test, expect } from '@playwright/test';
import { login, openMenuItem } from './helpers';

test('EXP-03 (partial): cancelling "Remove Favorite" keeps the photographer', async ({ page }) => {
  await login(page);
  await openMenuItem(page, 'Favorites');
  const removeButtons = page.getByRole('button', { name: 'Remove Favorite' });
  await expect(removeButtons.first()).toBeVisible();
  const before = await removeButtons.count();
  await removeButtons.first().click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(removeButtons).toHaveCount(before);
});