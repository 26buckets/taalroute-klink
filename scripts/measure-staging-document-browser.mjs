import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const rows = [], errors = [], out = 'docs/staging-document-wait-20261104/browser.json';
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) for (const [portal, selector] of [['learner', '.learner-app'], ['teacher/plus', '.kpd-lesson-choice']]) for (let repeat = 0; repeat < 2; repeat++) {
      const versions = repeat % 2 ? ['candidate', 'baseline'] : ['baseline', 'candidate'];
      for (const version of versions) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push({ version, engine, message: error.message }));
        const url = `https://klink-pr12-${version}.nico-554.workers.dev/#${portal}`;
        for (const visit of ['first', 'repeat']) {
          const response = visit === 'first' ? await page.goto(url, { waitUntil: 'domcontentloaded' }) : await page.reload({ waitUntil: 'domcontentloaded' });
          await page.locator(selector).first().waitFor();
          await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
          const stats = await page.evaluate(() => ({ readyMs: performance.now(), navigation: performance.getEntriesByType('navigation')[0].toJSON(), widthFits: document.documentElement.scrollWidth <= innerWidth + 1 }));
          assert.equal(response.status(), 200);
          assert(stats.widthFits);
          rows.push({ engine, width, portal, repeat, version, visit, cache: response.headers()['x-vinext-cache'] || null, ...stats });
          writeFileSync(out, JSON.stringify({ conditions: 'Real staging network, no throttling; Chromium/WebKit; two viewport sizes; fresh context per version/portal/repetition; repeat visit is a real reload using the same context; alternating version order; synthetic local state only. No physical phone or second physical network.', rows, errors }, null, 2) + '\n');
        }
        await context.close();
      }
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
console.log('PASS', rows.length, 'real staging first/repeat browser visits');
