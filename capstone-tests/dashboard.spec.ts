import { test, expect } from '@playwright/test';
import { adminLogin } from './helpers';

test.beforeEach(async ({ page }) => {
  await adminLogin(page);
});

test('DSH-01: the four overview cards are shown', async ({ page }) => {
  for (const title of ['Registered Users', 'Online Now', 'Data Used Today', 'Failed Logins Today']) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
});

test('DSH-01 (extra): the overview panels are shown', async ({ page }) => {
  for (const title of ['Usage this month', 'Users by role', 'Top users this month', 'Busiest hours', 'Connected now']) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
});

test('NAV: sidebar links open the ID list and the logs', async ({ page }) => {
  await page.getByRole('link', { name: 'Users and IDs' }).click();
  await expect(page.getByRole('textbox', { name: 'Search by ID or name...' })).toBeVisible();
  await page.getByRole('link', { name: 'Logs' }).click();
  await expect(page.getByRole('textbox', { name: 'Search by username...' })).toBeVisible();
});

test('NAV: Security and Tools are marked as coming soon', async ({ page }) => {
  await expect(page.getByText('Security').first()).toBeVisible();
  await expect(page.getByText('Tools').first()).toBeVisible();
  await expect(page.getByText('Soon')).toHaveCount(2);
});

test('DSH-13: the welcome toast shows and can be dismissed', async ({ page }) => {
  await expect(page.getByText(/Welcome back/)).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByText(/Welcome back/)).toBeHidden();
});

test('ADM-08: after Log out, the dashboard no longer opens', async ({ page }) => {
  await page.getByRole('button', { name: 'Log out' }).or(page.getByRole('link', { name: 'Log out' })).first().click();
  await expect(page).toHaveURL(/admin-login\.php/);
  await page.goto('admin-dashboard.php');
  await expect(page).toHaveURL(/admin-login\.php/);
});