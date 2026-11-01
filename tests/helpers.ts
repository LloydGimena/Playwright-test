import { Page, expect } from '@playwright/test';

// The live account is used only when BOOKING_URL is set (testing the deployed site).
// Otherwise the old local test account is used, so local runs behave as before.
const live = !!process.env.BOOKING_URL;

function creds() {
  if (!live) return { email: 'client@example.test', password: 'password', name: 'TC Test' };
  const { BOOKING_EMAIL, BOOKING_PASS, BOOKING_NAME } = process.env;
  if (!BOOKING_EMAIL || !BOOKING_PASS || !BOOKING_NAME) {
    throw new Error('Set BOOKING_EMAIL, BOOKING_PASS and BOOKING_NAME in .env to test the live site.');
  }
  return { email: BOOKING_EMAIL, password: BOOKING_PASS, name: BOOKING_NAME };
}

export async function login(page: Page) {
  const { email, password } = creds();
  await page.goto('/login');
  await page.getByLabel('Email Address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function openMenuItem(page: Page, item: string) {
  const { name } = creds();
  // "TC Test" becomes /^TC\s*Test$/, the same pattern as before
  const pattern = new RegExp('^' + name.trim().split(/\s+/).join('\\s*') + '$');
  await page.getByRole('button', { name: pattern }).or(page.getByRole('menu', { name: pattern })).first().click();
  await page.getByText(item, { exact: true }).click();
}