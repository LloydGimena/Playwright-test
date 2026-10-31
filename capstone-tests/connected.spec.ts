import { test, expect } from '@playwright/test';

// The Log Out link points at a made-up address and is never clicked.
const LOGOUT_URL = 'http://192.168.88.1/logout';

test('LGN-10: connected page without a logout link shows a warning', async ({ page }) => {
  await page.goto('connected.php');
  await expect(page.locator('.banner.warn')).toContainText('without a valid logout link');
  await expect(page.getByText('Signed in successfully')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log Out' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Log Out' })).toHaveCount(0);
  // With no data, all three values show a dash
  await expect(page.locator('.stat-value')).toHaveText(['—', '—', '—']);
});

test('LGN-11: connected page with data shows the session details', async ({ page }) => {
  const params = new URLSearchParams({
    username: 'qa_user',
    uptime: '1h2m',
    'bytes-in': '1.5 MiB',
    'bytes-out': '300 KiB',
    'link-logout': LOGOUT_URL,
  });
  await page.goto(`connected.php?${params}`);
  await expect(page.getByText('Signed in as qa_user')).toBeVisible();
  await expect(page.locator('.stat-row', { hasText: 'Session time' }).locator('.stat-value')).toHaveText('1h2m');
  await expect(page.locator('.stat-row', { hasText: 'Downloaded' }).locator('.stat-value')).toHaveText('1.5 MiB');
  await expect(page.locator('.stat-row', { hasText: 'Uploaded' }).locator('.stat-value')).toHaveText('300 KiB');
  await expect(page.getByRole('link', { name: 'Log Out' })).toHaveAttribute('href', LOGOUT_URL);
  await expect(page.locator('.banner.warn')).toHaveCount(0);
});

test('LGN-11 (extra): HTML in the username is shown as plain text', async ({ page }) => {
  const params = new URLSearchParams({ username: '<b>x</b>', 'link-logout': LOGOUT_URL });
  await page.goto(`connected.php?${params}`);
  await expect(page.getByText('Signed in as <b>x</b>')).toBeVisible();
  await expect(page.locator('.sub b')).toHaveCount(0);
});