import { Page, expect } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('client@example.test');
  await page.getByLabel('Password', { exact: true }).fill('password');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
export async function openMenuItem(page: Page, item: string) {
  await page.getByRole('button', { name: /^TC\s*Test$/ }).click();
  await page.getByText(item, { exact: true }).click();
}