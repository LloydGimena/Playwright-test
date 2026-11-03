import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Explore' }).click();
});

test('EXP-01a: searching by name shows only matching photographers', async ({ page }) => {
  test.skip(!!process.env.BOOKING_URL, 'Uses the local photographers; see the live version below');
  await expect(page.getByRole('link', { name: /Joesol Photography/ })).toBeVisible();
  const search = page.getByRole('textbox', { name: 'Search photographer name...' });
  await search.fill('Aurora');
  await search.press('Enter');
  await expect(page.getByRole('link', { name: /Aurora Studios/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Joesol Photography/ })).toHaveCount(0);
});
test('EXP-01a (live): search keeps matching photographers and hides the rest', async ({ page }) => {
  test.skip(!process.env.BOOKING_URL, 'Live site only (Golden Hour)');
  const card = page.getByRole('link', { name: /Golden Hour/ });
  await expect(card).toBeVisible();

  const search = page.getByRole('textbox', { name: 'Search photographer name...' });
  await search.fill('golden');
  await search.press('Enter');
  await expect(page.getByText(/Showing 1 of 1 results/)).toBeVisible();
  await expect(card).toBeVisible();

  await search.fill('zzzz');
  await search.press('Enter');
  await expect(card).toHaveCount(0);
  // Save what the page says when nothing matches, for the report
  const text = await page.locator('body').innerText();
  test.info().annotations.push({ type: 'page text when nothing matches', description: text.slice(0, 400) });
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