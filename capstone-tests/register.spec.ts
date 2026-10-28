import { test, expect } from '@playwright/test';
import { fillRegister, expectBanner } from './helpers';

const USERNAME_MSG =
  'Username must be 3 to 32 characters: letters, numbers, dots, dashes or underscores only (no spaces).';

// Uses ID 99990001 and username qa_reg01. Run the cleanup SQL before running again.
test('REG-01 (message only): valid registration', async ({ page }) => {
  await fillRegister(page, '99990001', 'qa_reg01', 'Passw0rd!');
  await expectBanner(page, 'Account created. You can now log in.');
});

for (const [label, id, user, pass] of [
  ['empty ID', '', 'qa_empty', 'Passw0rd!'],
  ['empty username', '99990002', '', 'Passw0rd!'],
  ['empty password', '99990002', 'qa_empty', ''],
  ['all empty', '', '', ''],
]) {
  test(`REG-02: ${label}`, async ({ page }) => {
    await fillRegister(page, id, user, pass);
    await expectBanner(page, 'All fields are required.');
  });
}

for (const [label, user] of [
  ['space', 'qa has space'],
  ['too short', 'ab'],
  ['too long (33)', 'a'.repeat(33)],
  ['symbol @', 'qa@user'],
]) {
  test(`REG-03: username rule - ${label}`, async ({ page }) => {
    await fillRegister(page, '99990002', user, 'Passw0rd!');
    await expectBanner(page, USERNAME_MSG);
  });
}

for (const [label, id] of [
  ['7 digits', '1234567'],
  ['9 digits', '123456789'],
  ['letters', 'abcdefgh'],
]) {
  test(`REG-04: ID format - ${label}`, async ({ page }) => {
    await fillRegister(page, id, 'qa_format', 'Passw0rd!');
    await expectBanner(page, 'Invalid ID format.');
  });
}

test('REG-05: unknown ID', async ({ page }) => {
  await fillRegister(page, '99998888', 'qa_unknown', 'Passw0rd!');
  await expectBanner(page, 'ID not recognized.');
});

test('REG-06: used ID', async ({ page }) => {
  await fillRegister(page, '99990015', 'qa_usedid', 'Passw0rd!');
  await expectBanner(page, 'ID not recognized or already used.');
});

test('REG-07: admin-role ID', async ({ page }) => {
  await fillRegister(page, '99990014', 'qa_adminid', 'Passw0rd!');
  await expectBanner(page, 'This ID cannot be used for self-registration.');
});

test('REG-08: duplicate username', async ({ page }) => {
  await fillRegister(page, '99990008', 'qa_taken', 'Passw0rd!');
  await expectBanner(page, 'That username is already taken.');
});

test('REG-13: show / hide password', async ({ page }) => {
  await page.goto('register.php');
  const box = page.getByLabel('Password', { exact: true });
  await box.fill('Passw0rd!');
  await expect(box).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(box).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  await expect(box).toHaveAttribute('type', 'password');
});

test('REG-14: Log in link keeps the hotspot parameters', async ({ page }) => {
  const qs = 'link-login-only=http%3A%2F%2F192.168.88.1%2Flogin&link-orig=http%3A%2F%2Fexample.com&ip=192.168.100.10&mac=AA%3ABB%3ACC%3ADD%3AEE%3AFF';
  await page.goto(`register.php?${qs}`);
  const link = page.getByRole('link', { name: 'Log in' });
  await expect(link).toHaveAttribute('href', /^login\.php\?.*ip=192\.168\.100\.10/);
  await link.click();
  await expect(page).toHaveURL(/login\.php\?.*ip=192\.168\.100\.10/);
});