import { test, expect, Page } from '@playwright/test';
import { login } from './helpers';

const DAY_BUTTON = /^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), \w+ \d{1,2}(st|nd|rd|th)/;

async function startBookingWithJoesol(page: Page) {
  await login(page);
  await page.getByRole('navigation').getByRole('link', { name: 'Explore' }).click();
  await page.getByRole('link', { name: /Joesol Photography/ }).click();
  await page.getByRole('banner').getByRole('button', { name: 'Book Now' }).click();
}

async function pickDateAndTime(page: Page) {
  await page.getByRole('button', { name: DAY_BUTTON, disabled: false }).first().click();
  await page.getByRole('button', { name: /^\d{1,2}:\d{2} (AM|PM)$/ }).first().click();
}

async function fillEventDetails(page: Page) {
  await page.getByLabel('Event Type *').selectOption('Wedding');
  await page.getByRole('spinbutton', { name: 'Estimated Guests (optional)' }).fill('20');
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('Test Client');
  await page.getByRole('textbox', { name: 'Phone Number *' }).fill('09170000000');
  await page.getByRole('textbox', { name: /Special Requests/ }).fill('automated test');
}

test('BKG-01 to BKG-05: booking wizard works up to the review step (no submit)', async ({ page }) => {
  test.setTimeout(120000);
  await startBookingWithJoesol(page);

  await test.step('BKG-01: pick an available date and start time', async () => {
    await pickDateAndTime(page);
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  await test.step('BKG-02: enter the event details', async () => {
    await expect(page.getByLabel('Event Type *')).toBeVisible();
    await fillEventDetails(page);
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  await test.step('BKG-03: select a fixed package', async () => {
    const pkg = page.getByRole('button', { name: /^Graduation Package/ });
    await expect(pkg).toBeVisible();
    await pkg.click();
    await page.getByRole('button', { name: 'Continue' }).click();
  });

  await test.step('BKG-05: select an add-on and check the review step', async () => {
    const addon = page.getByRole('button', { name: /^Drone Coverage/ });
    await expect(addon).toBeVisible();
    await addon.click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('button', { name: 'Submit Booking Request' })).toBeVisible();
    await expect(page.getByText(/Graduation Package/).first()).toBeVisible();
    await expect(page.getByText(/Drone Coverage/).first()).toBeVisible();
  });
});

// Turned off on purpose: it creates a real booking. Change test.fixme to test to run it.
test.fixme('BKG-06: submitting a filled booking creates a Pending booking', async ({ page }) => {
  test.setTimeout(180000);
  await startBookingWithJoesol(page);
  await pickDateAndTime(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await fillEventDetails(page);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /^Graduation Package/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /^Drone Coverage/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Submit Booking Request' }).click();
  await page.getByRole('button', { name: 'Confirm Submit' }).click();
  await expect(page.getByRole('button', { name: 'See My Bookings' })).toBeVisible();
});