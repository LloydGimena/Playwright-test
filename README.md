# Playwright Test

End-to-end tests written with Playwright (TypeScript) while learning QA.
Two systems are tested, each with its own suite and config.

## What is tested

| Suite | System | Folder | Config |
|---|---|---|---|
| Booking | Photography booking web app (React + Laravel), run locally | `tests/` | `playwright.config.ts` |
| Capstone | Campus WiFi captive portal (PHP, FreeRADIUS, MySQL) | `capstone-tests/` | `playwright.capstone.config.ts` |

The test cases behind each suite are kept in separate test-case documents.
Test names start with the case ID (for example `REG-02`, `ADM-03`), so a result
can be traced back to its case. Cases marked "(partial)" cover only part of the
case, and `test.fixme` marks a case that is skipped on purpose.

## Setup

```bash
npm install
```

The tests use Microsoft Edge (`channel: msedge`).

## Run

```bash
# Booking suite
npx playwright test

# Capstone suite
npx playwright test -c playwright.capstone.config.ts

# List tests without running them
npx playwright test -c playwright.capstone.config.ts --list
```

Reports are generated after each run (`playwright-report/` and
`playwright-report-capstone/`). They are not committed.

## Capstone suite requirements

- The computer must be on the portal's admin network.
- Create a local `.env` file (never committed) with:

  ```
  CAPSTONE_ADMIN_USER=your-admin-username
  CAPSTONE_ADMIN_PASS=your-admin-password
  ```

- The database needs reserved test IDs (`9999xxxx`) and test usernames (`qa_...`).
  Registration tests use up IDs, so the test data must be reset before each run.

## Not in this repository

- `.env` and any credentials
- Generated reports, traces and screenshots
- The source code of the systems under test