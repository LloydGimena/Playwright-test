import { test, expect } from '@playwright/test';
import { adminCreds, adminLogin, fillAdminLogin, expectBanner } from './helpers';

test('ADM-01: valid login', async ({ page }) => {
  const { user } = adminCreds();
  await adminLogin(page);
  await expect(page.getByText(`Signed in as ${user}`)).toBeVisible();
  await expect(page.locator('#welcomeToast')).toContainText('Welcome back, ADMIN!');
});

for (const [label, user, pass] of [
  ['empty username', '', 'something'],
  ['empty password', 'someone', ''],
  ['both empty', '', ''],
]) {
  test(`ADM-02: ${label}`, async ({ page }) => {
    await fillAdminLogin(page, user, pass);
    await expectBanner(page, 'Username and password are required.');
  });
}

test('ADM-03: wrong password', async ({ page }) => {
  const { user } = adminCreds();
  await fillAdminLogin(page, user, 'definitely-wrong-123');
  await expectBanner(page, 'Invalid username or password.');
});

test('ADM-04: unknown username', async ({ page }) => {
  await fillAdminLogin(page, 'qa_nobody_here', 'whatever123');
  await expectBanner(page, 'Invalid username or password.');
});

test('ADM-05: SQL text in username', async ({ page }) => {
  await fillAdminLogin(page, "' OR '1'='1", "' OR '1'='1");
  await expectBanner(page, 'Invalid username or password.');
  await expect(page.getByText(/SQL|Fatal error|Warning:/i)).toHaveCount(0);
});

test('ADM-06: already logged in goes to dashboard', async ({ page }) => {
  await adminLogin(page);
  await page.goto('admin-login.php');
  await expect(page).toHaveURL(/admin-dashboard\.php/);
});

test('ADM-07: dashboard needs login', async ({ page }) => {
  await page.goto('admin-dashboard.php');
  await expect(page).toHaveURL(/admin-login\.php/);
});

test('ADM-08 (partial): logout, then dashboard no longer opens', async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('link', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/admin-login\.php/);
  await page.goto('admin-dashboard.php');
  await expect(page).toHaveURL(/admin-login\.php/);
});

test('ADM-09: session ID changes after login', async ({ page }) => {
  await page.goto('admin-login.php');
  const before = (await page.context().cookies()).find(c => c.name === 'PHPSESSID');
  await adminLogin(page);
  const after = (await page.context().cookies()).find(c => c.name === 'PHPSESSID');
  expect(before).toBeDefined();
  expect(after).toBeDefined();
  expect(after!.value).not.toBe(before!.value);
});

test.fixme('ADM-10: repeated failures are blocked (lockout not built yet)', async () => {});