import { test, expect, Page } from '@playwright/test';
import { login } from './helpers';

// Written for the live site (Golden Hour studio). Skipped when running locally.
test.skip(!process.env.BOOKING_URL, 'Written for the live site');

async function openBooking(page: Page) {
  await login(page);
  await page.getByRole('link', { name: 'Home' }).click();
  await page.getByRole('button', { name: 'Book', exact: true }).click();
}

async function pickDateAndTime(page: Page) {
  // First available date, then the PM list, then the first available PM time
  await page.getByRole('button', { name: /^\w+day, \w+ \d+/ }).and(page.locator(':enabled')).first().click();
  await page.getByRole('button', { name: 'PM', exact: true }).click();
  await page.getByRole('button', { name: /^\d{1,2}:\d{2} PM$/ }).and(page.locator(':enabled')).first().click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function fillDetails(page: Page, eventType: string) {
  await page.getByLabel('Event Type *').selectOption(eventType);
  await page.getByRole('spinbutton', { name: 'Estimated Guests (optional)' }).fill('2');
  await page.getByRole('textbox', { name: /Special Requests/ }).fill('QA TEST - please ignore');
  await page.getByRole('button', { name: 'Continue' }).click();
}

test('BKG-A1: a date and time can be chosen and the event details step opens', async ({ page }) => {
  await openBooking(page);
  await pickDateAndTime(page);
  await expect(page.getByLabel('Event Type *')).toBeVisible();
});

test('BKG-A2: after the event details, the package step opens', async ({ page }) => {
  await openBooking(page);
  await pickDateAndTime(page);
  await fillDetails(page, 'Birthday');
  await expect(page.getByRole('button', { name: 'Intimate Wedding Package' })).toBeVisible();
  // Observation for the owner: which packages are offered for a Birthday?
  const packages = await page.getByRole('button', { name: /Package/ }).allInnerTexts();
  test.info().annotations.push({ type: 'packages for Birthday', description: packages.join(' | ') });
});

test('BKG-A3: the wizard reaches the review step (Submit is NOT clicked)', async ({ page }) => {
  await openBooking(page);
  await pickDateAndTime(page);
  await fillDetails(page, 'Birthday');
  await page.getByRole('button', { name: 'Intimate Wedding Package' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  // Add-ons step
  await expect(page.getByText('Optional Add-ons')).toBeVisible();
  await page.getByRole('button', { name: /Formal Attire Rental/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  // Review step. A real booking was already made by hand; never click Submit in a test.
  await expect(page.getByRole('button', { name: 'Submit Booking Request' })).toBeVisible();
});

test('BKG-A4: add-ons are optional, so Continue works without choosing any', async ({ page }) => {
  await openBooking(page);
  await pickDateAndTime(page);
  await fillDetails(page, 'Birthday');
  await page.getByRole('button', { name: 'Intimate Wedding Package' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Optional Add-ons')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('button', { name: 'Submit Booking Request' })).toBeVisible();
});

test('BKG-A5: the booking summary shows the choices made so far', async ({ page }) => {
  await openBooking(page);
  await pickDateAndTime(page);
  await fillDetails(page, 'Birthday');
  await page.getByRole('button', { name: 'Intimate Wedding Package' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Booking Summary')).toBeVisible();
  await expect(page.getByText('Birthday', { exact: true })).toBeVisible();
  await expect(page.getByText('Intimate Wedding Package').first()).toBeVisible();
});