import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
const base = 'https://klink-inzicht-pr8-staging.nico-554.workers.dev';
const before = process.env.KLINK_ANONYMOUS_PHASE === 'before';
const out = process.env.KLINK_LOGIN_OUTPUT;
assert(out, 'Use a separate evidence directory');
mkdirSync(out, { recursive: true });
const checks = [],
  errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390])
      for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: 'reduce',
        });
        const page = await context.newPage();
        page.setDefaultTimeout(45000);
        page.on('pageerror', (e) => errors.push(e.message));
        let reads = 0;
        page.on('request', (r) => {
          if (new URL(r.url()).pathname === '/api/inzicht/me') reads++;
        });
        await page.goto(base + '/inzicht', { waitUntil: 'domcontentloaded' });
        await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
        await page.waitForFunction(() =>
          [...document.querySelectorAll('form')].some((form) =>
            Object.keys(form).some(
              (key) =>
                key.startsWith('__reactProps$') &&
                typeof form[key]?.onSubmit === 'function',
            ),
          ),
        );
        await page.evaluate(async (theme) => {
          document.documentElement.dataset.theme = theme;
          document.documentElement.classList.toggle('dark', theme === 'dark');
          await document.fonts.ready;
        }, theme);
        await page.waitForTimeout(200);
        assert.equal(reads, before ? 1 : 0);
        await page.screenshot({
          path: `${out}/${engine}-${width}-${theme}.png`,
          fullPage: true,
        });
        if (!before) {
          await context.addCookies([
            {
              name: '__Host-inzicht_session',
              value: 'a'.repeat(64),
              url: base,
              httpOnly: true,
              secure: true,
              sameSite: 'Strict',
            },
          ]);
          let release, started;
          const held = new Promise((resolve) => {
            release = resolve;
          });
          const requested = new Promise((resolve) => {
            started = resolve;
          });
          await page.route('**/api/inzicht/me', async (route) => {
            started();
            await held;
            await route.continue();
          });
          try {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await requested;
            assert.equal(
              await page
                .getByText('Toegang controleren…', { exact: true })
                .isVisible(),
              true,
            );
            assert.equal(
              await page.getByLabel('Wachtwoord', { exact: true }).count(),
              0,
            );
            release();
            await page.getByLabel('Wachtwoord', { exact: true }).waitFor();
            assert.equal(reads, 1);
          } finally {
            release();
          }
        }
        checks.push({
          engine,
          width,
          theme,
          anonymousAccountRequests: before ? 1 : 0,
          existingCookieStillValidated: !before,
        });
        await context.close();
      }
  } finally {
    await browser.close();
    writeFileSync(
      out + '/checks.json',
      JSON.stringify({ base, before, checks, errors }, null, 2) + '\n',
    );
  }
}
assert.equal(checks.length, 8);
assert.deepEqual(errors, []);
console.log('PASS eight login appearance and session-boundary cases');
