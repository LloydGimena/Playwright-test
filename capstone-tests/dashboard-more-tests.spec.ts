import { test, expect } from '@playwright/test';
import { adminLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await adminLogin(page); // lands on Overview
});

// Turns "436.91 MB" style text into MB so sizes can be compared
const sizesIn = (text: string) =>
  [...text.matchAll(/([\d,.]+)\s*(KB|MB|GB)/g)].map(
    m => Number(m[1].replace(/,/g, '')) * ({ KB: 1 / 1024, MB: 1, GB: 1024 } as Record<string, number>)[m[2]]
  );

// The nearest box around a heading that also holds some data (the card itself)
const cardOf = (page: import('@playwright/test').Page, heading: string, mustHave: string) =>
  page.getByText(heading, { exact: true }).locator(`xpath=ancestor::*[.//*[contains(., "${mustHave}")]][1]`);

test('DSH-02: the Connected now card shows a list, "No users connected." or a router warning', async ({ page }) => {
  const card = cardOf(page, 'Connected now', 'View all');
  await expect(card).toBeVisible();
  await expect(
    card.locator('table').or(card.getByText(/No users connected|router/i)).first()
  ).toBeVisible();
});

test('DSH-03: the dashboard asks for new data by itself without reloading the page', async ({ page }) => {
  test.setTimeout(60_000);
  // A marker that would vanish if the page reloaded
  await page.evaluate(() => { (window as any).__qaMarker = 'still here'; });

  await page.waitForRequest(/admin-live-data\.php/, { timeout: 25_000 }); // about 16 seconds

  expect(await page.evaluate(() => (window as any).__qaMarker)).toBe('still here');
});

test('DSH-07: Top users lists at most 5 users, from most data to least', async ({ page }) => {
  const card = cardOf(page, 'Top users this month', 'MB');
  await expect(card).toContainText(/\d\s*(KB|MB|GB)/);

  const sizes = sizesIn(await card.innerText());
  expect(sizes.length).toBeGreaterThan(0);
  expect(sizes.length).toBeLessThanOrEqual(5);
  expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
});

test('DSH-08: choosing a user in Usage this month updates the chart without a reload', async ({ page }) => {
  const card = cardOf(page, 'Usage this month', 'MB per day');
  const select = card.locator('select');
  await expect.poll(() => select.locator('option').count()).toBeGreaterThan(1);

  const urlBefore = page.url();
  const htmlBefore = await card.innerHTML();

  await select.selectOption({ index: 1 }); // the first real user after "All users"

  await expect.poll(() => card.innerHTML()).not.toBe(htmlBefore);
  expect(page.url()).toBe(urlBefore);
});

test('DSH-17: Refresh resets the updated time and the theme button switches modes', async ({ page }) => {
  // Refresh: the "Updated Ns ago" label goes back down
  const updated = page.getByText(/^Updated /);
  const seconds = async () => Number((await updated.innerText()).match(/(\d+)s/)?.[1] ?? 0);
  await expect.poll(seconds).toBeGreaterThanOrEqual(3);
  const before = await seconds();
  await page.getByRole('button', { name: 'Refresh', exact: true }).first().click();
  await expect.poll(seconds).toBeLessThan(before);

  // Theme: the button changes its label and the page's look changes
  const look = () => page.evaluate(() => JSON.stringify([
    document.documentElement.className, document.documentElement.getAttribute('data-theme'),
    document.body.className, getComputedStyle(document.body).backgroundColor,
    getComputedStyle(document.documentElement).backgroundColor,
  ]));
  const light = await look();
  await page.getByRole('button', { name: 'Dark mode' }).click();
  await expect(page.getByRole('button', { name: 'Light mode' })).toBeVisible();
  expect(await look()).not.toBe(light);

  await page.getByRole('button', { name: 'Light mode' }).click();
  await expect(page.getByRole('button', { name: 'Dark mode' })).toBeVisible();
  expect(await look()).toBe(light);
});