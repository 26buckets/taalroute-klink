import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const out = process.env.KLINK_OPENING_PROFILE_OUTPUT || 'docs/browser-opening-wait-20261105/diagnosis';
const repetitions = Number(process.env.KLINK_OPENING_PROFILE_REPETITIONS || 3);
assert([1, 3].includes(repetitions));
assert(!existsSync(`${out}/visits.json`), 'Keep previous diagnosis evidence; select a new output directory');
mkdirSync(out, { recursive: true });
const rows = [], errors = [];
const browser = await chromium.launch();
try {
  for (const width of [1280, 390]) for (let repetition = 0; repetition < repetitions; repetition++) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      const state = window.__opening = { longTasks: [], readyMs: null };
      new PerformanceObserver(list => {
        state.longTasks.push(...list.getEntries().map(entry => ({ startMs: entry.startTime, durationMs: entry.duration })));
      }).observe({ type: 'longtask', buffered: true });
      let pending = false;
      const observer = new MutationObserver(() => {
        if (pending || !document.querySelector('.learner-app')?.getClientRects().length || document.querySelector('.klink-opening-loader')) return;
        pending = true;
        requestAnimationFrame(() => requestAnimationFrame(() => { state.readyMs = performance.now(); observer.disconnect(); }));
      });
      observer.observe(document, { childList: true, subtree: true, attributes: true });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    const profiled = repetition === repetitions - 1;
    if (profiled) await cdp.send('Profiler.enable');
    for (const visit of ['first', 'repeat']) {
      if (profiled) await cdp.send('Profiler.start');
      const response = visit === 'first'
        ? await page.goto('https://klink-pr12-candidate.nico-554.workers.dev/#learner', { waitUntil: 'domcontentloaded' })
        : await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__opening.readyMs !== null);
      const data = await page.evaluate(() => ({ ...window.__opening, navigation: performance.getEntriesByType('navigation')[0].toJSON(), resources: performance.getEntriesByType('resource').map(entry => entry.toJSON()) }));
      if (profiled) {
        const { profile } = await cdp.send('Profiler.stop');
        writeFileSync(`${out}/${width}-${visit}.cpuprofile`, JSON.stringify(profile));
      }
      rows.push({ width, repetition, visit, profiled, status: response.status(), ...data });
      writeFileSync(`${out}/visits.json`, JSON.stringify({ conditions: 'Diagnosis only: current staging, real network, Chromium, first/reload, reduced motion; profiled rows include sampling overhead. Ready time observed inside the document after two animation frames.', rows, errors }, null, 2));
      assert.equal(response.status(), 200);
      console.log(width, repetition, visit, Math.round(data.readyMs), data.longTasks.length);
    }
    await context.close();
  }
} finally { await browser.close(); }
assert.equal(rows.length, 4 * repetitions);
assert.deepEqual(errors, []);
