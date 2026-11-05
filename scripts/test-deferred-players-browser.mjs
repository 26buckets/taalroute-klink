import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_DEFERRED_OUTPUT || 'docs/total-download-20261105/deferred-players';
mkdirSync(out, { recursive: true });
const rows = [], errors = [];
const player = /\/learner-rounds-[^/]+\.js$/;
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const page = await context.newPage(), requests = [];
        page.on('request', request => requests.push(request.url()));
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + '/#learner', { waitUntil: 'networkidle' });
        await page.locator('.cp-home').waitFor();
        assert(!requests.some(url => /\/(?:learner-rounds|staff-apps|teacher-classroom)-/.test(url)), 'Home must not fetch players or teacher workspaces');
        await page.locator('[data-chapter="words"]').click();
        await page.locator('[data-chapter-page="words"]').waitFor();
        assert(!requests.some(url => player.test(url)), 'A category choice still needs no player');
        let release;
        const held = new Promise(resolve => { release = resolve; });
        await page.route(player, async route => { await held; await route.continue(); });
        try {
          const requested = page.waitForRequest(request => player.test(request.url()));
          await page.locator('[data-chapter-activity="meet"]').click();
          await requested;
          await page.locator('[data-collection]').first().waitFor();
          await page.locator('[data-collection]').first().click();
          await page.getByText('De oefening wordt geladen…', { exact: true }).waitFor();
          assert.equal(await page.locator('[data-exercise-id]').count(), 0);
          release();
          await page.locator('[data-exercise-id]').first().waitFor();
          const id = await page.locator('[data-exercise-id]').first().getAttribute('data-exercise-id');
          const route = page.url();
          await page.reload();
          await page.locator(`[data-exercise-id="${id}"]`).waitFor();
          assert.equal(page.url(), route, 'Direct exercise reload preserves the selected task');
          rows.push({ engine, width, firstOpeningDefersPlayers: true, categoryDefersPlayers: true, activityStartsPlayer: true, heldDownloadRecovers: true, directReload: id });
        } finally { release(); }
      } finally { await context.close(); }

      const recovery = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const page = await recovery.newPage();
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + '/#learner');
        await page.locator('.cp-home').waitFor();
        await page.evaluate(() => localStorage.setItem('deferred-preservation', 'saved answers'));
        await page.route(player, route => route.abort());
        await page.locator('[data-chapter="words"]').click();
        await page.locator('[data-chapter-activity="meet"]').click();
        await page.locator('[data-collection]').first().click();
        await page.getByRole('button', { name: 'Opnieuw openen', exact: true }).waitFor();
        assert.equal(await page.locator('[data-exercise-id]').count(), 0);
        assert(await page.getByRole('button', { name: 'Terug', exact: true }).isVisible());
        await page.unroute(player);
        await page.getByRole('button', { name: 'Opnieuw openen', exact: true }).click();
        await page.locator('[data-exercise-id]').first().waitFor();
        assert.equal(await page.evaluate(() => localStorage.getItem('deferred-preservation')), 'saved answers');
        rows.push({ engine, width, failedDownloadVisible: true, explicitRetryRecovers: true, storedAnswersPreserved: true });
      } finally { await recovery.close(); }
    }
  } finally { await browser.close(); writeFileSync(out + '/checks.json', JSON.stringify({ rows, errors }, null, 2) + '\n'); }
}
assert.equal(rows.length, 8);
assert.deepEqual(errors, []);
console.log('PASS eight cold/held/failed/reloaded player flows across Chromium/WebKit and desktop/mobile');
