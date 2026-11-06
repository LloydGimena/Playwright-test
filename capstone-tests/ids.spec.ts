import { test, expect, Page } from '@playwright/test';
import { adminLogin } from './helpers';

// Each test makes its own IDs in the 9999xxxx range, so your cleanup SQL still matches them.
const created: string[] = [];

function newId() {
  const id = `9999${5000 + Math.floor(Math.random() * 5000)}`;
  created.push(id);
  return id;
}

const searchBox = (page: Page) => page.getByRole('textbox', { name: 'Search by ID or name...' });
const rowFor = (page: Page, id: string) => page.getByRole('row').filter({ hasText: id });

async function addId(page: Page, id: string, name: string) {
  await page.getByRole('button', { name: 'Add ID' }).click();
  const modal = page.locator('#idModal');
  await modal.getByRole('textbox', { name: 'ID number' }).fill(id);
  await modal.getByRole('textbox', { name: 'Full name' }).fill(name);
  await modal.getByRole('button', { name: 'Add ID' }).click();
}

async function deleteId(page: Page, id: string) {
  const close = page.getByRole('link', { name: '× Close' });
  if (await close.isVisible()) await close.click();
  await searchBox(page).fill(id);
  const row = rowFor(page, id);
  if ((await row.count()) === 0) return;
  page.once('dialog', d => d.accept());
  await row.getByRole('button').click();
  await expect(row).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('link', { name: 'Users and IDs' }).click();
});

// Best-effort cleanup through the page; the SQL cleanup catches anything left behind
test.afterEach(async ({ page }) => {
  for (const id of created.splice(0)) {
    try { await deleteId(page, id); } catch { /* ignore */ }
  }
});

test('IDS-01: adding an ID shows a success message and the new row', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA Add Test');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await searchBox(page).fill(id);
  const row = rowFor(page, id);
  await expect(row).toBeVisible();
  await expect(row).toContainText('Available');
  await expect(row).toContainText('Student');
});

test('IDS-03: adding an ID that already exists is refused', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA First');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await addId(page, id, 'QA Duplicate');
  await expect(page.getByText('That ID number already exists.')).toBeVisible();
});

test('IDS-04: the form refuses an empty ID or an empty name (browser check)', async ({ page }) => {
  const modal = page.locator('#idModal');
  await page.getByRole('button', { name: 'Add ID' }).click();

  await modal.getByRole('textbox', { name: 'Full name' }).fill('QA No ID');
  await modal.getByRole('button', { name: 'Add ID' }).click();
  await expect(modal).toBeVisible();

  await modal.getByRole('textbox', { name: 'Full name' }).fill('');
  await modal.getByRole('textbox', { name: 'ID number' }).fill('99995999');
  await modal.getByRole('button', { name: 'Add ID' }).click();
  await expect(modal).toBeVisible();
  await expect(page.getByText('ID added successfully.')).toHaveCount(0);
});

for (const bad of ['1234567', 'abcdefgh']) {
  test(`IDS-05: the form refuses the ID "${bad}" (browser check)`, async ({ page }) => {
    const modal = page.locator('#idModal');
    await page.getByRole('button', { name: 'Add ID' }).click();
    await modal.getByRole('textbox', { name: 'ID number' }).fill(bad);
    await modal.getByRole('textbox', { name: 'Full name' }).fill('QA Bad ID');
    await modal.getByRole('button', { name: 'Add ID' }).click();
    await expect(modal).toBeVisible();
    await expect(page.getByText('ID added successfully.')).toHaveCount(0);
  });
}

test('IDS-05: the ID field accepts at most 8 digits', async ({ page }) => {
  await page.getByRole('button', { name: 'Add ID' }).click();
  const idBox = page.locator('#idModal').getByRole('textbox', { name: 'ID number' });
  await idBox.pressSequentially('123456789');
  await expect(idBox).toHaveValue('12345678');
});

test('IDS-07: editing an ID changes the name', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA Before');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await searchBox(page).fill(id);
  await rowFor(page, id).getByRole('link').click();
  const modal = page.locator('#idModal');
  await modal.getByRole('textbox', { name: 'Full name' }).fill('QA After');
  await modal.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText('ID updated successfully.')).toBeVisible();
  await searchBox(page).fill(id);
  await expect(rowFor(page, id)).toContainText('QA After');
});

test('IDS-09: changing an ID to one that already exists is refused', async ({ page }) => {
  const a = newId();
  const b = newId();
  await addId(page, a, 'QA Existing');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await addId(page, b, 'QA Other');
  await searchBox(page).fill(b);
  await rowFor(page, b).getByRole('link').click();
  const modal = page.locator('#idModal');
  await modal.getByRole('textbox', { name: 'ID number' }).fill(a);
  await modal.getByRole('button', { name: 'Save Changes' }).click();
  await expect(page.getByText(/Update failed/)).toBeVisible();
});

test('IDS-10 and IDS-11: Cancel keeps the row, confirming deletes it', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA Delete Test');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await searchBox(page).fill(id);
  const row = rowFor(page, id);

  let message = '';
  page.once('dialog', d => { message = d.message(); d.dismiss().catch(() => {}); });
  await row.getByRole('button').click();
  expect(message).toContain('Delete this ID');
  await expect(row).toBeVisible();

  page.once('dialog', d => d.accept());
  await row.getByRole('button').click();
  await expect(page.getByText('ID removed.')).toBeVisible();
  await expect(row).toHaveCount(0);
});

test('IDS-12: search keeps matching rows and hides the others', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA Search Test');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await searchBox(page).fill(id);
  await expect(rowFor(page, id)).toBeVisible();
  await searchBox(page).fill('zzzzzzzz');
  await expect(rowFor(page, id)).toHaveCount(0);
});

test('IDS-14: the pager moves between pages', async ({ page }) => {
  const pager = page.locator('#idPagination');
  await expect(pager.getByText(/Page 1 of \d+/)).toBeVisible();
  await expect(pager.getByRole('button', { name: '‹ Prev' })).toBeDisabled();
  await pager.getByRole('button', { name: 'Next ›' }).click();
  await expect(pager.getByText(/Page 2 of \d+/)).toBeVisible();
  await pager.getByRole('button', { name: '‹ Prev' }).click();
  await expect(pager.getByText(/Page 1 of \d+/)).toBeVisible();
});

test('IDS-15: HTML in a name is shown as plain text', async ({ page }) => {
  const id = newId();
  await addId(page, id, '<b>x</b>');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await searchBox(page).fill(id);
  const row = rowFor(page, id);
  await expect(row).toContainText('<b>x</b>');
  await expect(row.locator('b')).toHaveCount(0);
});

test('IDS-16: the message disappears and a refresh does not add the ID again', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA Refresh Test');
  await expect(page.getByText('ID added successfully.')).toBeVisible();
  await expect(page.getByText('ID added successfully.')).toBeHidden({ timeout: 10000 });
  await page.reload();
  await page.getByRole('link', { name: 'Users and IDs' }).click();
  await searchBox(page).fill(id);
  await expect(rowFor(page, id)).toHaveCount(1);
});