import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_NETWORK_ENTRY_OUTPUT || 'docs/network-peaks-20261104/entry-checks';
mkdirSync(out, { recursive: true });
const rows = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) for (const entry of ['landing', 'teacher']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      let release;
      const held = new Promise(resolve => { release = resolve; });
      await page.route(/\/route-settings-[^/]+\.js$/, async route => { await held; await route.continue(); });
      const requested = page.waitForRequest(request => new RegExp(`/${entry === 'teacher' ? 'staff-apps' : 'learner-app'}-[^/]+\\.js$`).test(request.url()), { timeout: 10000 });
      try {
        await page.goto(base + (entry === 'teacher' ? '/#teacher' : '/'), { waitUntil: 'domcontentloaded' });
        if (entry === 'landing') {
          await page.getByRole('button', { name: 'Start met oefenen', exact: true }).click();
          await page.getByRole('button', { name: 'Begin', exact: true }).click();
        }
        await requested;
        await page.locator('.klink-opening-loader').waitFor();
        assert.equal(await page.locator('.learner-app,.staff-app').count(), 0);
      } finally { release(); }
      await page.locator(entry === 'teacher' ? '.staff-app' : '.learner-app').waitFor();
      assert.equal(await page.locator('.klink-opening-loader').count(), 0);
      rows.push({ engine, width, entry, selectedAppRequestedBeforeSharedDataReleased: true });
      await context.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({ rows, errors }, null, 2));
console.log(`PASS ${rows.length} landing/legacy-teacher parallel-loading checks`);
