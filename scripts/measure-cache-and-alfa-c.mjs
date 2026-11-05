import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
const out = process.env.KLINK_CACHE_OUTPUT || 'docs/eight-seconds-20261105/cache-and-alfa';
assert(!existsSync(out + '/checks.json'), 'Preserve measurements');
mkdirSync(out, { recursive: true });
const evidence = process.env.KLINK_COMPRESSION_EVIDENCE || 'docs/eight-seconds-20261105';
const rows = [], errors = [], browser = await chromium.launch();
try {
  for (const width of [1280, 390]) for (const [scenario, route, selector] of [
    ['ordinary', '#learner', '[data-exercise-id]'],
    ['daily', '#learner/alfa-c/dagelijks-les', '[data-daily-step]'],
    ['functional', '#learner/alfa-c/lijst', '[data-functional-step]'],
  ]) for (const version of width === 1280 ? ['before', 'after'] : ['after', 'before']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      const session = await context.newCDPSession(page);
      await session.send('Network.enable');
      await session.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 375000, uploadThroughput: 125000 });
      const workerPaths = JSON.parse(readFileSync(`${evidence}/compression-${version}.json`)).files.map(file => file.path);
      const base = `https://klink-pr12-${version === 'before' ? 'baseline' : 'candidate'}.nico-554.workers.dev`;
      for (const visit of ['cold', 'warm']) {
        if (visit === 'warm') await page.goto('about:blank');
        await page.goto(base + '/' + route, { waitUntil: 'domcontentloaded' });
        if (scenario === 'ordinary') {
          await page.locator('[data-chapter="words"]').click();
          await page.locator('[data-chapter-activity="meet"]').click();
          await page.locator('[data-collection]').first().click();
        }
        await page.locator(selector).first().waitFor();
        await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForFunction(() => [...document.images].filter(image => { const r = image.getBoundingClientRect(); return r.width && r.height && r.top < innerHeight && r.bottom > 0; }).every(image => image.complete && image.naturalWidth));
        const result = await page.evaluate(paths => ({ readyMs: performance.now(), resources: performance.getEntriesByType('resource').map(e => ({ path: new URL(e.name).pathname, bytes: e.transferSize, encoded: e.encodedBodySize, start: e.startTime, ttfb: e.responseStart - e.requestStart, duration: e.duration, worker: paths.includes(new URL(e.name).pathname) })) }), workerPaths);
        const row = { width, scenario, version, visit, ...result, player: await page.locator(selector).first().innerText() };
        assert(!result.resources.some(r => /\/learner-rounds-extra[.-]/.test(r.path)) || scenario !== 'ordinary');
        rows.push(row);
        writeFileSync(out + '/checks.json', JSON.stringify({ conditions: 'Chromium, 3 Mbps, 40ms added latency, no CPU throttling; warm visit in the same browser context; synthetic desktop/mobile, not physical device.', rows, errors }, null, 2) + '\n');
        console.log(width, scenario, version, visit, Math.round(result.readyMs), 'worker network fetches', result.resources.filter(r => r.worker && r.bytes > 0).length);
      }
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
assert.equal(rows.length, 24);
assert.deepEqual(errors, []);
for (const width of [1280, 390]) for (const scenario of ['ordinary', 'daily', 'functional']) assert.equal(new Set(rows.filter(r => r.width === width && r.scenario === scenario).map(r => r.player)).size, 1, 'Same actual lesson across versions and visits at the same viewport');
