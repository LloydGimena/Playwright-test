import { test, expect, Page } from '@playwright/test';
import { adminLogin } from './helpers';

// IDs stay in the 9999xxxx range so your cleanup SQL still matches them.
const created: string[] = [];

function newId() {
  const id = `9999${5000 + Math.floor(Math.random() * 5000)}`;
  created.push(id);
  return id;
}

const searchBox = (page: Page) => page.getByRole('textbox', { name: 'Search by ID or name...' });
const rowFor = (page: Page, id: string) => page.getByRole('row').filter({ hasText: id });

async function closePanel(page: Page) {
  const close = page.getByRole('link', { name: '× Close' });
  if (await close.isVisible()) await close.click();
}

// Types the ID in the search box so its row is on screen
async function showRow(page: Page, id: string) {
  await closePanel(page);
  await searchBox(page).fill(id);
}

async function addId(page: Page, id: string, name: string, role?: 'staff' | 'admin') {
  await page.getByRole('button', { name: 'Add ID' }).click();
  const modal = page.locator('#idModal');
  await modal.getByRole('textbox', { name: 'ID number' }).fill(id);
  await modal.getByRole('textbox', { name: 'Full name' }).fill(name);
  if (role) await modal.getByLabel('Role', { exact: true }).selectOption(role);
  await modal.getByRole('button', { name: 'Add ID' }).click();
}

async function markUsed(page: Page, id: string) {
  await showRow(page, id);
  await rowFor(page, id).getByRole('link', { name: 'Edit' }).click();
  await page.getByRole('checkbox', { name: 'Marked as used' }).check();
  await page.getByRole('button', { name: 'Save Changes' }).click();
}

async function deleteId(page: Page, id: string) {
  await showRow(page, id);
  const row = rowFor(page, id);
  if ((await row.count()) === 0) return;
  page.once('dialog', d => d.accept());
  await row.getByRole('button').click();
  await expect(row).toHaveCount(0);
}

// Reads every row of the ID table, page by page
async function allRows(page: Page): Promise<string[][]> {
  const rows: string[][] = [];
  const next = page.locator('#idPagination').getByRole('button', { name: 'Next ›' });
  let lastFirstRow = '';
  for (let i = 0; i < 30; i++) {
    const cells = await page.locator('tbody tr:visible').evaluateAll(trs =>
      trs.map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => (td.textContent ?? '').replace(/\s+/g, ' ').trim())
      )
    );
    const first = JSON.stringify(cells[0] ?? []);
    if (first === lastFirstRow) break; // the pager did not move, so we are done
    lastFirstRow = first;
    rows.push(...cells);
    if (!(await next.isVisible()) || !(await next.isEnabled())) break;
    await next.click();
  }
  return rows;
}

// Finds which column a header label is, e.g. 'Role'
async function columnIndex(page: Page, label: string) {
  const heads = await page.locator('thead th').allInnerTexts();
  const i = heads.findIndex(h => h.toLowerCase().includes(label.toLowerCase()));
  if (i < 0) throw new Error(`No column header containing "${label}". Found: ${heads.join(' | ')}`);
  return i;
}

async function sortBy(page: Page, column: 'ID Number' | 'Role' | 'Used Status') {
  await page.getByRole('button', { name: 'Sort' }).click();
  await page.getByRole('link', { name: column }).click();
}

// True when equal values sit together, whatever the direction (e.g. A A B B or B B A A)
function isGrouped(values: string[]) {
  let changes = 0;
  for (let i = 1; i < values.length; i++) if (values[i] !== values[i - 1]) changes++;
  return changes === new Set(values).size - 1;
}

test.beforeEach(async ({ page }) => {
  await adminLogin(page);
  await page.getByRole('link', { name: 'Users and IDs' }).click();
});

test.afterEach(async ({ page }) => {
  for (const id of created.splice(0)) {
    try { await deleteId(page, id); } catch { /* the SQL cleanup catches leftovers */ }
  }
});

test('IDS-02: Staff and Admin roles are shown on the rows', async ({ page }) => {
  const staffId = newId();
  const adminId = newId();
  await addId(page, staffId, 'QA Role One', 'staff');
  await addId(page, adminId, 'QA Role Two', 'admin');

  await showRow(page, staffId);
  await expect(rowFor(page, staffId)).toContainText('Staff');
  await expect(rowFor(page, staffId)).not.toContainText('Admin');

  await showRow(page, adminId);
  await expect(rowFor(page, adminId)).toContainText('Admin');
  await expect(rowFor(page, adminId)).not.toContainText('Staff');
});

test('IDS-08: marking an ID as used changes the row to Used', async ({ page }) => {
  const id = newId();
  await addId(page, id, 'QA Mark One');
  await showRow(page, id);
  await expect(rowFor(page, id)).toContainText('Available');

  await markUsed(page, id);

  await showRow(page, id);
  await expect(rowFor(page, id)).toContainText('Used');
  await expect(rowFor(page, id)).not.toContainText('Available');
});

test('IDS-13: sorting by ID Number, Role and Used Status reorders the rows', async ({ page }) => {
  // Make sure the list holds more than one role and both statuses
  const staffId = newId();
  const adminId = newId();
  await addId(page, staffId, 'QA Sort One', 'staff');
  await addId(page, adminId, 'QA Sort Two', 'admin');
  await markUsed(page, adminId);
  await closePanel(page);

  // ID Number: strictly ascending or strictly descending
  await sortBy(page, 'ID Number');
  const idCol = await columnIndex(page, 'ID Number');
  const ids = (await allRows(page)).map(r => r[idCol]);
  const asc = [...ids].sort();
  const desc = [...asc].reverse();
  expect([asc, desc]).toContainEqual(ids);

  // Role: equal roles sit together
  await page.getByRole('link', { name: 'Users and IDs' }).click();
  await sortBy(page, 'Role');
  const roleCol = await columnIndex(page, 'Role');
  const roles = (await allRows(page)).map(r => r[roleCol]);
  expect(new Set(roles).size).toBeGreaterThan(1);
  expect(isGrouped(roles)).toBe(true);

  // Used Status: Used and Available sit together
  await page.getByRole('link', { name: 'Users and IDs' }).click();
  await sortBy(page, 'Used Status');
  const usedCol = await columnIndex(page, 'Used');
  const statuses = (await allRows(page)).map(r => r[usedCol]);
  expect(new Set(statuses).size).toBeGreaterThan(1);
  expect(isGrouped(statuses)).toBe(true);
});

test('IDS-18: the Registered Users card matches the number of Used rows', async ({ page }) => {
  const usedCol = await columnIndex(page, 'Used');
  const rows = await allRows(page);
  const usedRows = rows.filter(r => /^used$/i.test(r[usedCol])).length;

  await page.getByRole('link', { name: 'Overview' }).click();
  const text = (await page.locator('#kpiContent').innerText()).replace(/\s+/g, ' ');
  const card = Number(text.match(/Registered users\s*(\d+)/i)?.[1]);
  expect(card, `Could not read the Registered Users number from: ${text}`).not.toBeNaN();

  expect(card).toBe(usedRows);
});