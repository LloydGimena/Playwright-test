import { test, expect } from '@playwright/test';

// Fake hotspot values. The form is never submitted, so nothing reaches the router.
const hotspot = new URLSearchParams({
  'link-login-only': 'http://192.168.88.1/login',
  'link-orig': 'http://example.com',
  ip: '192.168.100.5',
  mac: 'AA:BB:CC:DD:EE:FF',
});

test('LGN-01: login page opened directly shows a warning and the form', async ({ page }) => {
  await page.goto('login.php');
  await expect(page.locator('.banner.warn')).toContainText('without hotspot context');
  await expect(page.locator('#username')).toBeVisible();
  await expect(page.locator('#password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log In' })).toBeVisible();
});

test('LGN-02: the eye button shows and hides the password', async ({ page }) => {
  await page.goto('login.php');
  const password = page.locator('#password');
  await password.fill('Secret123');
  await expect(password).toHaveAttribute('type', 'password');

  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(password).toHaveAttribute('type', 'text');

  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('LGN-03: error text appears in a red banner', async ({ page }) => {
  await page.goto('login.php?error=Hello');
  await expect(page.locator('.banner.error')).toHaveText('Hello');
});

test('LGN-03 (extra): HTML in the error text is shown as plain text', async ({ page }) => {
  const params = new URLSearchParams({ error: '<b>x</b>' });
  await page.goto(`login.php?${params}`);
  await expect(page.locator('.banner.error')).toHaveText('<b>x</b>');
  await expect(page.locator('.banner.error b')).toHaveCount(0);
});

test('LGN-04: the username in the address pre-fills the box', async ({ page }) => {
  await page.goto('login.php?username=test');
  await expect(page.locator('#username')).toHaveValue('test');
});

test('LGN-04 (extra): HTML in the username is not run', async ({ page }) => {
  const params = new URLSearchParams({ username: '"><b>x</b>' });
  await page.goto(`login.php?${params}`);
  await expect(page.locator('#username')).toHaveValue('"><b>x</b>');
  await expect(page.locator('form b')).toHaveCount(0);
});

test('LGN-05: Register here keeps the hotspot parameters', async ({ page }) => {
  await page.goto(`login.php?${hotspot}`);
  await page.getByRole('link', { name: 'Register here' }).click();
  await page.waitForURL(/register\.php/);
  const url = new URL(page.url());
  expect(url.searchParams.get('link-login-only')).toBe('http://192.168.88.1/login');
  expect(url.searchParams.get('link-orig')).toBe('http://example.com');
  expect(url.searchParams.get('ip')).toBe('192.168.100.5');
  expect(url.searchParams.get('mac')).toBe('AA:BB:CC:DD:EE:FF');
});

test('LGN-12 (as built): the Forgot password link does nothing', async ({ page }) => {
  await page.goto('login.php');
  const before = page.url();
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page).toHaveURL(before);
});