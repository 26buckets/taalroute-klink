import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const remote = process.env.KLINK_OPENING_REMOTE === '1';
const out = process.env.KLINK_FLOW_OUTPUT || 'docs/total-download-20261105/first-exercise';
assert(!existsSync(out + '/visits.json'), 'Preserve previous measurements');
mkdirSync(out, { recursive: true });
const rows = [], errors = [], startedAt = new Date().toISOString();
const browser = await chromium.launch();
const save = () => writeFileSync(out + '/visits.json', JSON.stringify({ startedAt, savedAt: new Date().toISOString(), browserVersion: browser.version(), conditions: remote ? 'Fresh Chromium contexts, 3 Mbps down / 1 Mbps up, 40 ms added latency, no CPU throttling; alternating versions. Immediate chapter, activity and first exercise clicks, without invented thinking time. Not a physical phone or mobile network.' : 'Local diagnostic, fresh Chromium contexts, no network or CPU throttling.', rows, errors }, null, 2) + '\n');
try {
  for (const width of [1280, 390]) for (let repeat = 0; repeat < (remote ? 4 : 1); repeat++) {
    for (const version of repeat % 2 ? ['after', 'before'] : ['before', 'after']) {
      const base = remote ? `https://klink-pr12-${version === 'before' ? 'baseline' : 'candidate'}.nico-554.workers.dev` : `http://127.0.0.1:${version === 'before' ? 19122 : 19120}`;
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await context.addInitScript(() => {
          window.__flow = { home: null, chapter: null, activity: null, exercise: null, clicks: {} };
          const selectors = { home: '.cp-home', chapter: '[data-chapter-page="words"]', activity: '[data-collection]', exercise: '[data-exercise-id]' };
          const pending = new Set();
          const observer = new MutationObserver(() => {
            for (const [key, selector] of Object.entries(selectors)) {
              if (window.__flow[key] !== null || pending.has(key) || !document.querySelector(selector)?.getClientRects().length || document.querySelector('.klink-opening-loader')) continue;
              pending.add(key);
              requestAnimationFrame(() => requestAnimationFrame(() => { window.__flow[key] = performance.now(); }));
            }
          });
          observer.observe(document, { subtree: true, childList: true, attributes: true });
          document.addEventListener('click', event => {
            for (const [key, selector] of Object.entries({ chapter: '[data-chapter="words"]', activity: '[data-chapter-activity="meet"]', exercise: '[data-collection]' })) {
              if (event.target.closest?.(selector)) window.__flow.clicks[key] = performance.now();
            }
          }, true);
        });
        const page = await context.newPage();
        if (remote) {
          const session = await context.newCDPSession(page);
          await session.send('Network.enable');
          await session.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 375000, uploadThroughput: 125000 });
        }
        page.on('pageerror', error => errors.push({ width, repeat, version, message: error.message }));
        await page.goto(base + '/#learner', { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__flow.home !== null);
        const snapshot = () => page.evaluate(() => ({ ...window.__flow, navigation: performance.getEntriesByType('navigation')[0].toJSON(), resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, startMs: entry.startTime, endMs: entry.responseEnd, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize, transferSize: entry.transferSize })) }));
        const opening = await snapshot();
        await page.locator('[data-chapter="words"]').click();
        await page.waitForFunction(() => window.__flow.chapter !== null);
        await page.locator('[data-chapter-activity="meet"]').click();
        await page.waitForFunction(() => window.__flow.activity !== null);
        await page.locator('[data-collection]').first().click();
        await page.waitForFunction(() => window.__flow.exercise !== null);
        await page.locator('[data-exercise-id]').first().waitFor();
        await page.waitForFunction(() => [...document.querySelectorAll('[data-exercise-id] img')].every(image => image.complete && image.naturalWidth > 0));
        await page.evaluate(() => document.fonts.ready);
        const exerciseMediaReadyMs = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))));
        const exercise = await snapshot();
        const id = await page.locator('[data-exercise-id]').first().getAttribute('data-exercise-id');
        assert(id);
        if (version === 'after') assert(!opening.resources.some(row => /\/(?:learner-rounds|staff-apps|teacher-classroom)-/.test(row.path)), 'No player or teacher transfer before the first choice');
        rows.push({ width, repeat, version, opening, exercise, exerciseId: id, exerciseMediaReadyMs, chapterClickMs: exercise.chapter - exercise.clicks.chapter, activityClickMs: exercise.activity - exercise.clicks.activity, exerciseClickMs: exercise.exercise - exercise.clicks.exercise, firstChoiceToExerciseMs: exercise.exercise - exercise.clicks.chapter, openingToExerciseMs: exercise.exercise });
        save();
        console.log(width, repeat, version, 'home', Math.round(opening.home), 'exercise', Math.round(exercise.exercise), 'last click', Math.round(exercise.exercise - exercise.clicks.exercise));
      } catch (error) { errors.push({ width, repeat, version, message: String(error) }); save(); throw error; }
      finally { await context.close(); }
    }
  }
  assert.equal(rows.length, remote ? 16 : 4);
  assert.deepEqual(errors, []);
  assert.equal(new Set(rows.map(row => row.exerciseId)).size, 1, 'Compare exactly the same task');
} finally { await browser.close(); save(); }
