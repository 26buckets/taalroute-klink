import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const out = process.env.KLINK_NETWORK_OUTPUT || 'docs/network-peaks-20261104/waterfall';
const delay = Number(process.env.KLINK_NETWORK_DELAY ?? 1200);
const throttled = process.env.KLINK_NETWORK_THROTTLE === '1';
assert(Number.isFinite(delay) && delay >= 0 && delay <= 10000);
const versions = process.env.KLINK_NETWORK_URL
  ? [['live', process.env.KLINK_NETWORK_URL]]
  : [['before', `http://127.0.0.1:${throttled ? 19132 : 19122}`], ['after', `http://127.0.0.1:${throttled ? 19130 : 19120}`]];
assert(!throttled || (!delay && !process.env.KLINK_NETWORK_URL), 'Throttling is for compressed local builds only');
assert(!process.env.KLINK_NETWORK_URL || delay === 0, 'Live measurement never intercepts traffic');
mkdirSync(out, { recursive: true });
const releases = Object.fromEntries(await Promise.all(versions.map(async ([name, base]) => [name, await fetch(base + '/release.json').then(r => r.json())])));
const rows = [], errors = [];
for (const [engine, browserType] of Object.entries(throttled ? { chromium } : { chromium, webkit })) {
  const browser = await browserType.launch();
  try {
    for (const width of [1280, 390]) for (let repeat = 0; repeat < 3; repeat++) {
      // Alternate order so a warming machine or changing network does not favour one build.
      for (const [version, base] of repeat % 2 ? [...versions].reverse() : versions) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        if (throttled) {
          const session = await context.newCDPSession(page);
          await session.send('Network.enable');
          await session.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: width === 390 ? 750000 : 1500000, uploadThroughput: 250000 });
        }
        page.on('pageerror', error => errors.push({ engine, width, version, message: error.message }));
        await page.addInitScript(() => {
          window.networkReady = null;
          window.networkLongTasks = [];
          const observer = new MutationObserver(() => {
            if (document.querySelector('.learner-app')?.getClientRects().length && !document.querySelector('.klink-opening-loader')) {
              window.networkReady = performance.now(); observer.disconnect();
            }
          });
          observer.observe(document, { childList: true, subtree: true, attributes: true });
          try { new PerformanceObserver(list => window.networkLongTasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true }); } catch {}
        });
        if (delay) await page.route(/\/route-settings-[^/]+\.js$/, async route => {
          await new Promise(resolve => setTimeout(resolve, delay));
          await route.continue();
        });
        await page.goto(base + '/#learner', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => typeof window.networkReady === 'number');
        const stats = await page.evaluate(() => ({
          readyMs: window.networkReady,
          navigation: performance.getEntriesByType('navigation')[0].toJSON(),
          resources: performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, start: r.startTime, responseStart: r.responseStart, end: r.responseEnd, transfer: r.transferSize, decoded: r.decodedBodySize })),
          longTasks: window.networkLongTasks,
        }));
        const shared = stats.resources.find(r => /\/route-settings-.*\.js$/.test(r.path));
        const learner = stats.resources.find(r => /\/learner-app-.*\.js$/.test(r.path));
        assert(shared && learner, 'The selected workspace and shared exercise data must both load');
        if (version === 'after' && delay) assert(learner.start < shared.end, 'Learner download must start before the delayed shared data finishes');
        const start = performance.now();
        await page.getByRole('button', { name: 'Woorden bekijken', exact: true }).click();
        await page.getByRole('searchbox').first().waitFor();
        rows.push({ engine, width, repeat, version, ...stats, nextMs: performance.now() - start, overlappingDownloads: learner.start < shared.end });
        writeFileSync(out + '/measurements.json', JSON.stringify({ releases, delayMs: delay, conditions: throttled ? 'local gzip proxy; Chromium CDP 150ms latency, desktop 12Mbps/mobile 6Mbps down, 2Mbps up; no CPU emulation; fresh contexts; alternating order; first visits only' : delay ? 'fresh browser context; delay shared data request only; no bandwidth/CPU emulation; interception disables HTTP cache; alternating order; first visits only' : 'fresh browser context; real network; no interception, CPU or bandwidth emulation; first visits only', rows, errors }, null, 2));
        await context.close();
      }
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
for (const [name, base] of versions) assert.deepEqual(await fetch(base + '/release.json').then(r => r.json()), releases[name], 'Source changed during measurement');
console.log(`PASS ${rows.length} first-open measurements; ${out}`);
