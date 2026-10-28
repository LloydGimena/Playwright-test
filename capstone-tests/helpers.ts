import { expect, Page } from '@playwright/test';

export function adminCreds() {
  const user = process.env.CAPSTONE_ADMIN_USER;
  const pass = process.env.CAPSTONE_ADMIN_PASS;
  if (!user || !pass) throw new Error('Missing CAPSTONE_ADMIN_USER / CAPSTONE_ADMIN_PASS in .env');
  return { user, pass };
}

export async function fillAdminLogin(page: Page, user: string, pass: string) {
  await page.goto('admin-login.php');
  await page.getByLabel('Username').fill(user);
  await page.getByLabel('Password', { exact: true }).fill(pass);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

export async function adminLogin(page: Page) {
  const { user, pass } = adminCreds();
  await fillAdminLogin(page, user, pass);
  await expect(page).toHaveURL(/admin-dashboard\.php/);
}

export async function fillRegister(page: Page, id: string, username: string, password: string) {
  await page.goto('register.php');
  await page.getByLabel('User ID').fill(id);
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Register', exact: true }).click();
}

// The red/green message box at the top of the form
export async function expectBanner(page: Page, text: string) {
  await expect(page.locator('.banner')).toHaveText(text);
}