import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_PERF_OUTPUT || 'docs/performance-20261102/baseline';
mkdirSync(out, { recursive: true });
const release = await fetch(base + '/release.json').then(r => r.json());
const rows = [], errors = [];
const scenarios = [
  { name: 'entry', hash: '', selector: '.landing-start' },
  { name: 'learner', hash: '#learner', selector: '.learner-app' },
  { name: 'docent', hash: '#teacher/plus', selector: '.kpd-lesson-choice' },
];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) for (const scenario of scenarios) for (let repeat = 0; repeat < 3; repeat++) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push({ engine, width, scenario: scenario.name, message: error.message }));
      await page.addInitScript(() => {
        localStorage.setItem('performance-preserve', 'saved-progress');
        window.perfLongTasks = [];
        try { new PerformanceObserver(list => window.perfLongTasks.push(...list.getEntries().map(e => e.duration))).observe({ type: 'longtask', buffered: true }); } catch {}
      });
      for (const visit of ['cold', 'warm']) {
        await page.goto(base + '/' + scenario.hash, { waitUntil: 'domcontentloaded' });
        await page.locator(scenario.selector).first().waitFor();
        await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
        const ready = await page.evaluate(() => performance.now());
        let nextMs;
        const start = performance.now();
        if (scenario.name === 'docent') {
          await page.getByRole('button', { name: 'Les openen: mat', exact: true }).click();
          await page.locator('.kpd-big-word').waitFor();
          nextMs = performance.now() - start;
        } else if (scenario.name === 'entry') {
          await page.getByRole('button', { name: 'Start met oefenen', exact: true }).click();
          await page.getByRole('button', { name: 'Begin', exact: true }).click();
          await page.locator('.learner-app').waitFor();
          nextMs = performance.now() - start;
        } else {
          await page.getByRole('button', { name: 'Woorden bekijken', exact: true }).click();
          await page.locator('.learner-app').waitFor();
          nextMs = performance.now() - start;
        }
        const stats = await page.evaluate(() => ({ resources: performance.getEntriesByType('resource').map(r => ({ name: new URL(r.name).pathname, transfer: r.transferSize, decoded: r.decodedBodySize, duration: r.duration })), longTasks: window.perfLongTasks, preserved: localStorage.getItem('performance-preserve') }));
        assert.equal(stats.preserved, 'saved-progress');
        if (repeat === 0 && visit === 'cold') {
          await page.evaluate(() => document.fonts.ready);
          await page.screenshot({ path: `${out}/${engine}-${width}-${scenario.name}.png` });
        }
        rows.push({ engine, width, scenario: scenario.name, repeat, visit, readyMs: ready, nextMs, ...stats });
        // Reset only the synthetic lesson choice, retain the browser HTTP cache.
        if (scenario.name === 'docent') await page.getByRole('button', { name: 'Lesoverzicht', exact: true }).click();
        writeFileSync(out + '/measurements.json', JSON.stringify({ base, release, measuredAt: new Date().toISOString(), network: 'local loopback, no CPU/network emulation', rows, errors }, null, 2));
      }
      await context.close();
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
console.log(`PASS ${rows.length} cold/warm measurements; ${out}`);
