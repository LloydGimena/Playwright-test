import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Explore' }).click();
});

test('EXP-01a: searching by name shows only matching photographers', async ({ page }) => {
  await expect(page.getByRole('link', { name: /Joesol Photography/ })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Search photographer name...' });
  await search.fill('Aurora');
  await search.press('Enter');
  await expect(page.getByRole('link', { name: /Aurora Studios/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Joesol Photography/ })).toHaveCount(0);
});

test('EXP-01b: filter options can be opened and selected', async ({ page }) => {
  await page.getByRole('button', { name: /^Filters/ }).click();
  await expect(page.getByRole('button', { name: 'Indoor', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bulan Only' })).toBeVisible();
  await page.getByRole('button', { name: 'Indoor', exact: true }).click();
  await page.getByRole('button', { name: 'Bulan Only' }).click();
  await expect(page.getByRole('button', { name: 'Filters 2' })).toBeVisible();
  await page.getByRole('button', { name: /^Filters/ }).click();
});

test('EXP-01c: photographer order is the same after a reload', async ({ page }) => {
  const cards = page.getByRole('link', { name: /Freelancer|Studio/ });
  await expect(cards.first()).toBeVisible();
  const before = await cards.allInnerTexts();
  await page.reload();
  await expect(cards.first()).toBeVisible();
  const after = await cards.allInnerTexts();
  expect(after).toEqual(before);
});