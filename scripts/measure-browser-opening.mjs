import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const remote = process.env.KLINK_OPENING_REMOTE === '1';
const throttled = process.env.KLINK_OPENING_THROTTLED === '1';
assert(!throttled || remote, 'Use real staging responses for the controlled 3 Mbps trial');
const out = process.env.KLINK_OPENING_OUTPUT || `docs/browser-opening-wait-20261105/${remote ? 'staging' : 'local'}-measurement`;
assert(!existsSync(`${out}/visits.json`), 'Keep earlier measurements in a separate directory');
mkdirSync(out, { recursive: true });
const rows = [], nextClicks = [], errors = [];
const startedAt = new Date().toISOString(), browserVersions = {};
const repeats = throttled ? 4 : remote ? 2 : 1;
const save = () => writeFileSync(`${out}/visits.json`, JSON.stringify({ startedAt, savedAt: new Date().toISOString(), browserVersions, conditions: `Matched first visit and real reload; fresh contexts, alternating order, reduced motion, no CPU throttling. ${throttled ? 'Chromium network emulation: 3 Mbps download, 1 Mbps upload, 40 ms added latency; not a second physical network.' : 'No network throttling.'} Same selectors as the prior staging trial; in-document paint/long-task timings additionally recorded. Synthetic browser state only.`, rows, nextClicks, errors }, null, 2));
for (const [engine, type] of Object.entries(throttled ? { chromium } : { chromium, webkit })) {
  const browser = await type.launch();
  browserVersions[engine] = browser.version();
  try {
    for (const width of [1280, 390]) for (const [portal, selector] of throttled ? [['learner', '.learner-app']] : [['learner', '.learner-app'], ['teacher/plus', '.kpd-lesson-choice']]) for (let repeat = 0; repeat < repeats; repeat++) {
      for (const version of repeat % 2 ? ['after', 'before'] : ['before', 'after']) {
        const base = remote ? `https://klink-pr12-${version === 'before' ? 'baseline' : 'candidate'}.nico-554.workers.dev` : `http://127.0.0.1:${version === 'before' ? 19122 : 19120}`;
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await context.addInitScript(selector => {
          const state = window.__opening = { paintReadyMs: null, longTasks: [] };
          if (PerformanceObserver.supportedEntryTypes.includes('longtask')) new PerformanceObserver(list => {
            state.longTasks.push(...list.getEntries().map(entry => ({ startMs: entry.startTime, durationMs: entry.duration })));
          }).observe({ type: 'longtask', buffered: true });
          let pending = false;
          const observer = new MutationObserver(() => {
            if (pending || !document.querySelector(selector)?.getClientRects().length || document.querySelector('.klink-opening-loader')) return;
            pending = true;
            requestAnimationFrame(() => requestAnimationFrame(() => { state.paintReadyMs = performance.now(); observer.disconnect(); }));
          });
          observer.observe(document, { childList: true, subtree: true, attributes: true });
        }, selector);
        const page = await context.newPage();
        if (throttled) {
          const session = await context.newCDPSession(page);
          await session.send('Network.enable');
          await session.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 375000, uploadThroughput: 125000 });
        }
        page.on('pageerror', error => errors.push({ engine, width, portal, version, message: error.message }));
        try {
          for (const visit of ['first', 'repeat']) {
            try {
              const response = visit === 'first' ? await page.goto(`${base}/#${portal}`, { waitUntil: 'domcontentloaded' }) : await page.reload({ waitUntil: 'domcontentloaded' });
              await page.locator(selector).first().waitFor();
              await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
              const readyMs = await page.evaluate(() => performance.now());
              await page.waitForFunction(() => window.__opening.paintReadyMs !== null);
          const result = await page.evaluate(readyMs => ({ readyMs, ...window.__opening, navigation: performance.getEntriesByType('navigation')[0].toJSON(), widthFits: document.documentElement.scrollWidth <= innerWidth + 1, resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, startMs: entry.startTime, endMs: entry.responseEnd, transferSize: entry.transferSize, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize })) }), readyMs);
              rows.push({ engine, width, portal, repeat, version, visit, status: response.status(), ...result });
              save();
              assert.equal(response.status(), 200);
              assert(result.widthFits);
              console.log(engine, width, portal, repeat, version, visit, Math.round(result.readyMs));
            } catch (error) {
              errors.push({ engine, width, portal, repeat, version, visit, message: String(error) }); save(); throw error;
            }
          }
          if (portal === 'learner') {
            const start = await page.evaluate(() => performance.now());
            await page.locator('button[data-chapter="sentences"]').click();
            await page.locator('[data-chapter-page="sentences"]').waitFor();
            nextClicks.push({ engine, width, repeat, version, durationMs: await page.evaluate(start => performance.now() - start, start) });
            save();
          }
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
}
assert.equal(rows.length, throttled ? 32 : 32 * repeats);
assert.equal(nextClicks.length, throttled ? 16 : 8 * repeats);
assert.deepEqual(errors, []);
console.log(`PASS ${rows.length} first/reload visits and ${nextClicks.length} next-chapter interactions`);
