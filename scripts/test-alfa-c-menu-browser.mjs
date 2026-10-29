import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.KLINK_URL ?? 'http://127.0.0.1:18929';
const out = process.env.KLINK_ALFAC_OUTPUT ?? 'outputs/alfa-c-menu-20261029';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      let standard;
      for (const level of ['alfa-a', 'alfa-b', 'alfa-c']) for (const help of ['practice', 'guided']) {
        await page.goto(`${base}/#learner/chapters?level=${level}&help=${help}`);
        await page.locator(level === 'alfa-c' ? '[data-alfa-c-category]' : '[data-chapter]').first().waitFor();
        const chapters = await page.locator('[data-chapter]').evaluateAll(es => es.map(e => e.dataset.chapter));
        standard ??= chapters;
        if (level !== 'alfa-c') assert.deepEqual(chapters, standard);
        else assert.equal(chapters.length, help === 'guided' ? 8 : 0);
        assert.equal(await page.locator('[data-alfa-c-category]').count(), level === 'alfa-c' ? 3 : 0);
        const active = page.locator('.learner-nav [aria-current="page"]');
        assert.equal(await active.evaluate(e => getComputedStyle(e).boxShadow), 'none');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        if (level !== 'alfa-c') continue;
        if (engine === 'chromium' && help === 'practice') await page.screenshot({ path: `${out}/menu-${width}.png` });
        for (const [group, attribute, count] of [['words', 'pilot', 3], ['paper', 'functional', 6], ['messages', 'daily', 6]]) {
          await page.locator(`[data-alfa-c-category="${group}"]`).click();
          await page.locator(`[data-${attribute}-block]`).first().waitFor();
          assert.equal(await page.locator(`[data-${attribute}-block]`).count(), count);
          assert.equal(await page.locator('[data-alfa-c-category]').count(), 0);
          await page.reload();
          await page.locator(`[data-${attribute}-block]`).first().waitFor();
          const ids = await page.locator(`[data-${attribute}-block]`).evaluateAll((es, attribute) => es.map(e => e.getAttribute(attribute)), `data-${attribute}-block`);
          for (const id of ids) {
            await page.locator(`[data-${attribute}-block="${id}"]`).click();
            await page.locator(`[data-${attribute}-step]`).waitFor();
            assert(page.url().endsWith(`/${id}?help=${help}`));
            await page.getByRole(attribute === 'pilot' ? 'button' : 'link', { name: 'Andere oefening', exact: true }).click();
            await page.locator(`[data-${attribute}-block="${id}"]`).waitFor();
            assert(page.url().endsWith(`/${group}?help=${help}`));
          }
          await page.getByRole('button', { name: 'Andere oefening', exact: true }).click();
          await page.locator(`[data-alfa-c-category="${group}"]`).waitFor();
          assert(page.url().endsWith(`level=alfa-c&help=${help}`));
          await page.goBack();
          await page.locator(`[data-${attribute}-block]`).first().waitFor();
          await page.goForward();
          await page.locator(`[data-alfa-c-category="${group}"]`).waitFor();
          checks.push({ engine, width, help, group, blocks: count });
        }
      }
    }
  } finally { await browser.close(); }
}
writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2));
assert.deepEqual(errors, []);
console.log(`PASS ${checks.length} category journeys, 180 block entries/returns, consistent A/B/C menus, reload/history, desktop/tablet/mobile, no navigation stripe.`);
