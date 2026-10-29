import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18929';
const out = process.env.KLINK_ALFAC_OUTPUT ?? 'outputs/unified-practice-20261029';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      let frame;
      async function sameFrame(stage) {
        const next = await page.evaluate(() => ['.cp-context-header', '.cp-page-workspace', '.cp-practice-modes', '[data-my-route]'].map(selector => {
          const el = document.querySelector(selector);
          if (!el) return null;
          const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width) };
        }));
        assert(next.every(Boolean), `Missing common frame: ${stage}`);
        frame ??= next;
        assert.deepEqual(next, frame, `${engine}/${width}/${stage}: frame moved`);
        assert.equal(await page.locator('.cp-route-axis').count(), 2);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      }
      for (const level of ['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1']) for (const help of ['practice', 'guided']) {
        await page.goto(`${base}/#learner/chapters?level=${level}&help=${help}`);
        await page.locator('.cp-page-workspace').waitFor();
        await sameFrame(`${level}/${help}/categories`);
        assert.equal(await page.locator('.learner-nav [aria-current="page"]').evaluate(e => getComputedStyle(e).boxShadow), 'none');
        if (level === 'alfa-c') {
          assert.equal(await page.locator('[data-alfa-c-category]').count(), 3);
          for (const [group, kind, count] of [['words', 'pilot', 3], ['paper', 'functional', 6], ['messages', 'daily', 6]]) {
            await page.locator(`[data-alfa-c-category="${group}"]`).click();
            await page.locator('[data-chapter-activity="sequence"]').waitFor();
            await sameFrame(`${group}/activities`);
            assert.equal(await page.locator('[data-collection]').count(), 0);
            await page.locator('[data-chapter-activity="sequence"]').click();
            await page.locator('[data-collection]').first().waitFor();
            await sameFrame(`${group}/list`);
            assert.equal(await page.locator('.cp-chapter-collections > .cp-chapter-collection').count(), count);
            if (engine === 'chromium' && help === 'practice' && group === 'words') {
              await page.mouse.move(0, 0);
              await page.screenshot({ path: `${out}/alfa-c-list-${width}.png` });
            }
            await page.reload();
            await page.locator('[data-collection]').first().waitFor();
            const ids = await page.locator('[data-collection]').evaluateAll(es => es.map(e => e.dataset.collection));
            for (const id of ids) {
              await page.locator(`[data-collection="${id}"]`).click();
              await page.locator(`[data-${kind}-step]`).waitFor();
              assert.equal(await page.locator('.cp-context-header').count(), 1);
              await page.locator('.cp-context-header').getByRole('button', { name: 'Andere opdracht', exact: true }).click();
              await page.locator(`[data-collection="${id}"]`).waitFor();
              assert(page.url().endsWith(`/alfa-c-${group}/sequence?level=alfa-c&help=${help}`));
            }
            await page.locator('.cp-context-header .text-back').click();
            await page.locator('[data-chapter-activity="sequence"]').waitFor();
            await page.locator('.cp-context-header .text-back').click();
            await page.locator(`[data-alfa-c-category="${group}"]`).waitFor();
            await page.goBack(); await page.locator('[data-chapter-activity="sequence"]').waitFor();
            await page.goForward(); await page.locator(`[data-alfa-c-category="${group}"]`).waitFor();
            checks.push({ engine, width, level, help, group, blocks: count });
          }
        } else {
          assert.equal(await page.locator('[data-alfa-c-category]').count(), 0);
          const available = page.locator('[data-chapter]:not([disabled])');
          if (!await available.count()) { checks.push({ engine, width, level, help, unavailable: true }); continue; }
          await available.first().click();
          await page.locator('[data-chapter-activity]:not([disabled])').first().waitFor();
          await sameFrame(`${level}/activities`);
          assert.equal(await page.locator('[data-collection]').count(), 0);
          await page.locator('[data-chapter-activity]:not([disabled])').first().click();
          await page.locator('[data-collection]').first().waitFor();
          await sameFrame(`${level}/list`);
          if (engine === 'chromium' && help === 'practice' && level === 'alfa-a') {
            await page.mouse.move(0, 0); await page.screenshot({ path: `${out}/alfa-a-list-${width}.png` });
          }
          await page.locator('[data-collection]').first().click();
          await page.locator('.cp-context-header').getByRole('button', { name: 'Andere opdracht', exact: true }).waitFor();
          await page.locator('.cp-context-header .text-back').click();
          await page.locator('[data-collection]').first().waitFor();
          await page.locator('.cp-context-header .text-back').click();
          await page.locator('[data-chapter-activity]').first().waitFor();
          checks.push({ engine, width, level, help, standardJourney: true });
        }
      }
    }
    for (const [legacy, target] of [['words', 'alfa-c-words'], ['paper', 'alfa-c-paper'], ['messages', 'alfa-c-messages']]) {
      await page.goto(`${base}/#learner/alfa-c/${legacy}?help=guided`);
      await page.locator('[data-chapter-activity="sequence"]').waitFor();
      assert(page.url().endsWith(`/${target}?level=alfa-c&help=guided`));
    }
  } finally { await browser.close(); }
}
writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2));
assert.deepEqual(errors, []);
console.log(`PASS ${checks.length} journeys: all levels share category/activity/list frame; 180 C block entries/returns; two browsers, three sizes, reload/history and legacy URLs.`);
