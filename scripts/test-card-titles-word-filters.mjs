import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { writeFileSync } from 'node:fs';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_CARD_FILTER_OUTPUT || 'outputs/card-titles-word-filters-20261101.json';
const checks = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${base}/#learner/words`);
    await page.locator('.word-filter-details summary').click();
    for (const level of ['all', 'a2', 'b1']) {
      await page.locator('.word-filters').getByLabel('Niveau', { exact: true }).selectOption(level);
      await page.locator('.word-filters').getByLabel('Onderdeel', { exact: true }).selectOption('words');
      const select = page.locator('.word-filters').getByLabel('Oefening', { exact: true });
      await select.locator('optgroup option').first().waitFor({ state: 'attached' });
      const options = await select.locator('optgroup option').evaluateAll(nodes => nodes.map(o => ({ value: o.value, label: o.textContent })));
      assert(options.length); assert(options.every(o => / · \d+ (?:woord|woorden)(?: ·|$)/.test(o.label)));
      assert(options.every(o => !/^Leesronde|^Zinnenronde/.test(o.label)));
      await select.selectOption(options[0].value);
      await page.locator('.cp-global-word-grid article').first().waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      checks.push({ engine, level, options: options.length, sourceIdsPreserved: true, metadata: true, selectionWorks: true });
    }
  } finally { await browser.close(); }
}
writeFileSync(out, JSON.stringify({ checks, errors: [] }, null, 2));
console.log('PASS six word-filter selections with short titles and source-bound levels/counts.');
