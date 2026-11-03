import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit, expect } from 'playwright/test';
import { base, online, login } from './browser-auth.mjs';
assert(online, 'Only the authorized synthetic staging may receive credentials');
const out =
  process.env.KLINK_LATENCY_OUTPUT ?? 'docs/inzicht-20261102/evidence/latency';
mkdirSync(out, { recursive: true });
const results = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let reads = 0,
    mfaPosts = 0;
  const holds = [];
  page.on('request', (request) => {
    if (
      new URL(request.url()).pathname === '/api/inzicht/mfa' &&
      request.method() === 'POST'
    )
      mfaPosts++;
  });
  await page.route(
    (url) => url.pathname === '/api/inzicht/me',
    async (route) => {
      reads++;
      if (reads === 1 || reads === 3) {
        await new Promise((resolve) =>
          holds.push(() => {
            void route.abort('failed').catch(() => {});
            resolve();
          }),
        );
      } else await route.continue();
    },
  );
  try {
    const confirmation = page.waitForResponse(
      (r) => new URL(r.url()).pathname === '/api/inzicht/mfa',
    );
    await Promise.all([
      login(page, 'docent'),
      (async () => {
        assert.equal((await confirmation).status(), 200);
        await expect(
          page.getByText('Toegang controleren…', { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByLabel('E-mailadres', { exact: true }),
        ).toHaveCount(0);
        const retry = page.getByRole('button', {
          name: 'Toegang opnieuw controleren',
          exact: true,
        });
        await retry.waitFor({ timeout: 16000 });
        await expect(page.getByRole('alert')).toHaveText(
          'Ophalen duurt te lang. Probeer opnieuw.',
        );
        holds.splice(0).forEach((release) => release());
        await retry.click();
      })(),
    ]);
    assert.equal(
      mfaPosts,
      1,
      'Account retry must not resend the consumed MFA code',
    );
    await page.reload();
    const retry = page.getByRole('button', {
      name: 'Toegang opnieuw controleren',
      exact: true,
    });
    await retry.waitFor({ timeout: 16000 });
    await expect(page.getByLabel('E-mailadres', { exact: true })).toHaveCount(
      0,
    );
    holds.splice(0).forEach((release) => release());
    await retry.click();
    await page.getByLabel('Actieve school', { exact: true }).waitFor();
    assert.equal(
      mfaPosts,
      1,
      'A stalled reload must preserve the valid session',
    );
    await page.screenshot({
      path: `${out}/${engine}-account-recovered.png`,
    });
    await page.getByRole('button', { name: 'Afmelden', exact: true }).click();
    await page.getByLabel('E-mailadres', { exact: true }).waitFor();
    results.push({
      engine,
      delayed_post_mfa_read: 'bounded and recovered',
      delayed_reload_read: 'bounded and recovered',
      login_form_not_repeated_while_waiting: true,
      mfa_posts: mfaPosts,
      reads,
      logout: 'passed',
    });
  } finally {
    holds.splice(0).forEach((release) => release());
    await browser.close();
  }
}
writeFileSync(
  `${out}/account-delay-browser.json`,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      origin: base,
      synthetic_only: true,
      results,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Both engines: stalled account reads after MFA and reload time out visibly; retry preserves the session without replaying MFA.',
);
