import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const out = 'docs/browser-opening-wait-20261105/targeted-mobile-reloads.json';
assert(!existsSync(out), 'Preserve all earlier measurements');
const initial = out.replace('.json', '-initial.json');
const prior = existsSync(initial) ? JSON.parse(readFileSync(initial)) : null;
if (prior) {
  assert.equal(prior.rows.length, 20);
  assert.equal(prior.errors.length, 1);
  assert.match(prior.errors[0].message, /Versioned code must reload from browser cache/);
}
const rows = prior?.rows ?? [], errors = [];
const cacheCheck = row => {
  const first = rows.find(other => other.repeat === row.repeat && other.version === row.version && other.visit === 'first');
  const loaded = new Set(first.staticResources.map(resource => resource.path));
  // A later prefetched stylesheet may not have completed on the first visit.
  assert(row.staticResources.filter(resource => loaded.has(resource.path)).every(resource => resource.transferSize === 0), 'Previously loaded versioned assets must use browser cache');
};
for (const row of rows.filter(row => row.version === 'after' && row.visit === 'repeat')) cacheCheck(row);
const save = () => writeFileSync(out, JSON.stringify({ conditions: 'Original outlier cell: Chromium, 390x900, learner; 20 independent first/reload contexts per version, alternating version order, reduced motion, no CPU/network throttle. Both first visits and reloads retained.', retainedInitialVisits: rows.length >= 20 && prior ? 20 : 0, harnessCorrection: prior ? 'Initial cache assertion also included a later-prefetched stylesheet absent from the first visit. All 20 completed visits retained; corrected assertion checks previously completed resources. Initial report preserved separately.' : null, rows, errors }, null, 2));
const browser = await chromium.launch();
try {
  for (let repeat = rows.length / 4; repeat < 20; repeat++) for (const version of repeat % 2 ? ['after', 'before'] : ['before', 'after']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push({ repeat, version, message: error.message }));
    const base = `https://klink-pr12-${version === 'before' ? 'baseline' : 'candidate'}.nico-554.workers.dev`;
    try {
      for (const visit of ['first', 'repeat']) {
        try {
          const response = visit === 'first' ? await page.goto(`${base}/#learner`, { waitUntil: 'domcontentloaded' }) : await page.reload({ waitUntil: 'domcontentloaded' });
          await page.locator('.learner-app').waitFor();
          await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
          const data = await page.evaluate(() => ({ readyMs: performance.now(), navigation: performance.getEntriesByType('navigation')[0].toJSON(), staticResources: performance.getEntriesByType('resource').filter(entry => new URL(entry.name).pathname.startsWith('/_next/static/')).map(entry => ({ path: new URL(entry.name).pathname, transferSize: entry.transferSize, durationMs: entry.duration })) }));
          rows.push({ repeat, version, visit, status: response.status(), ...data }); save();
          assert.equal(response.status(), 200);
          assert(data.staticResources.some(row => row.path.includes('route-settings-')));
          if (version === 'after' && visit === 'repeat') cacheCheck(rows.at(-1));
          console.log(repeat, version, visit, Math.round(data.readyMs));
        } catch (error) { errors.push({ repeat, version, visit, message: String(error) }); save(); throw error; }
      }
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
assert.equal(rows.length, 80);
assert.deepEqual(errors, []);
console.log('PASS 80 first/reload visits, including 20 cache-only candidate reloads');
