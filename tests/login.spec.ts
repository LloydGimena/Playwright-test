import { test, expect } from '@playwright/test';

test('LOG-01: client can log in with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('client@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 });
});

test('LOG-02a: wrong password is rejected', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('client@example.test');
  await page.getByLabel('Password', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('The provided credentials are incorrect.').first()).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/login/);
});

test('LOG-02b: unregistered email is rejected', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('nobody@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('The provided credentials are incorrect.').first()).toBeVisible({ timeout: 15000 });
  await expect(page).toHaveURL(/\/login/);
});

test('LOG-02c: empty form is not submitted', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('LOG-02d: email without "@" is rejected', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('notanemail');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/\/login/);
});