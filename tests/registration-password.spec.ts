import { test, expect, Page } from '@playwright/test';

const EXISTING_EMAIL = 'client@example.test'; // the test client used by the login tests

async function openClientRegistration(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.getByRole('button', { name: 'Client Find & book' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

type Form = { name: string; email: string; phone: string; password: string; confirm: string; terms: boolean };

const valid = (): Form => ({
  name: 'QA Tester',
    email: `qa.${Date.now()}@gmail.com`,
  phone: '09171234567',
  password: 'Passw0rd!',
  confirm: 'Passw0rd!',
  terms: true,
});

async function fillStep1(page: Page, f: Form) {
  await page.getByRole('textbox', { name: 'Your name' }).fill(f.name);
  await page.getByRole('textbox', { name: 'you@example.com' }).fill(f.email);
  await page.getByRole('textbox', { name: '123 4567' }).fill(f.phone);
  await page.getByRole('textbox', { name: 'Min. 8 characters' }).fill(f.password);
  await page.getByRole('textbox', { name: 'Re-enter password' }).fill(f.confirm);
  const terms = page.getByRole('checkbox', { name: /I agree to Bulan/ });
  if (f.terms) await terms.check();
  else await terms.uncheck();
}

const continueButton = (page: Page) => page.getByRole('button', { name: 'Continue' });

// Control: proves the "disabled" checks below are meaningful
test('REG-04 (control): valid details and Terms ticked enable Continue', async ({ page }) => {
  await openClientRegistration(page);
  await fillStep1(page, valid());
  await expect(continueButton(page)).toBeEnabled();
});

const bad: [string, Partial<Form>][] = [
  ['empty form', { name: '', email: '', phone: '', password: '', confirm: '', terms: false }],
  ['invalid email', { email: 'abc' }],
  ['mismatched passwords', { confirm: 'Different1!' }],
  ['password too short', { password: 'abc', confirm: 'abc' }],
  ['Terms not ticked', { terms: false }],
];

for (const [label, change] of bad) {
  test(`REG-04: cannot continue - ${label}`, async ({ page }) => {
    await openClientRegistration(page);
    await fillStep1(page, { ...valid(), ...change });
    await expect(continueButton(page)).toBeDisabled();
  });
}

test.fixme('REG-03 (partial): an email that is already registered is rejected', async ({ page }) => {
  await openClientRegistration(page);
  await fillStep1(page, { ...valid(), email: EXISTING_EMAIL });
  await expect(page.getByText(/This email is already registered/)).toBeVisible();
  await expect(continueButton(page)).toBeDisabled();
});

test('PW-02 (partial): an unregistered email gets a general message', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByRole('textbox', { name: 'Registered Email Address' }).fill('nobody-here@example.test');
  await page.getByRole('button', { name: 'Send Reset Link' }).click();
  await page.getByRole('button', { name: 'Confirm & Send' }).click();
  await expect(page.getByRole('button', { name: 'Confirm & Send' })).toBeHidden();
  const text = await page.locator('body').innerText();
  test.info().annotations.push({ type: 'page text', description: text.slice(0, 300) });
  expect(text).not.toMatch(/no account|not registered|not found|does not exist|doesn't exist|unknown/i);
});
test('REG-04: an email with an unrecognised ending is rejected', async ({ page }) => {
  await openClientRegistration(page);
  await fillStep1(page, { ...valid(), email: 'client@example.test' });
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(continueButton(page)).toBeDisabled();
});