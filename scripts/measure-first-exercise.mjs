import assert from 'node:assert/strict';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const remote = process.env.KLINK_OPENING_REMOTE === '1';
const repeats = Number(process.env.KLINK_FLOW_REPEATS ?? (remote ? 2 : 1));
assert(Number.isInteger(repeats) && repeats >= 1 && repeats <= 10, 'Use one to ten paired repetitions per viewport and portal');
const portals = process.env.KLINK_FLOW_LEARNER_ONLY === '1' ? ['learner'] : process.env.KLINK_FLOW_TEACHER_ONLY === '1' ? ['teacher/plus'] : ['learner', 'teacher/plus'];
const out = process.env.KLINK_FLOW_OUTPUT || 'docs/total-download-20261105/first-exercise';
assert(!existsSync(out + '/visits.json'), 'Preserve previous measurements');
mkdirSync(out, { recursive: true });
const rows = [], errors = [], startedAt = new Date().toISOString();
const browser = await chromium.launch();
const save = () => writeFileSync(out + '/visits.json', JSON.stringify({ startedAt, savedAt: new Date().toISOString(), browserVersion: browser.version(), conditions: remote ? 'Fresh Chromium contexts, 3 Mbps down / 1 Mbps up, 40 ms added latency, no CPU throttling; alternating versions. Immediate chapter, activity and first exercise clicks, without invented thinking time. Not a physical phone or mobile network.' : 'Local diagnostic, fresh Chromium contexts, no network or CPU throttling.', rows, errors }, null, 2) + '\n');
try {
  for (const width of [1280, 390]) for (const portal of portals) for (let repeat = 0; repeat < repeats; repeat++) {
    for (const version of repeat % 2 ? ['after', 'before'] : ['before', 'after']) {
      const base = remote ? `https://klink-pr12-${version === 'before' ? 'baseline' : 'candidate'}.nico-554.workers.dev` : `http://127.0.0.1:${version === 'before' ? 19122 : 19120}`;
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await context.addInitScript(portal => {
          window.__flow = { home: null, chapter: null, activity: null, exercise: null, lesson: null, clicks: {} };
          window.__flowAudio = [];
          const seenAudio = new WeakSet();
          window.addEventListener('klink-audio-source', event => {
            const audio = event.detail;
            if (seenAudio.has(audio)) return;
            seenAudio.add(audio);
            audio.addEventListener('ended', () => window.__flowAudio.push({ native: audio instanceof HTMLAudioElement, duration: audio.duration }));
          });
          const selectors = portal === 'learner' ? { home: '.cp-home', chapter: '[data-chapter-page="words"]', activity: '[data-collection]', exercise: '[data-exercise-id]' } : { home: '.kpd-lesson-choice', lesson: '.kpd-big-word' };
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
            for (const [key, selector] of Object.entries({ chapter: '[data-chapter="words"]', activity: '[data-chapter-activity="meet"]', exercise: '[data-collection]', lesson: 'button[aria-label="Les openen: mat"]' })) {
              if (event.target.closest?.(selector)) window.__flow.clicks[key] = performance.now();
            }
          }, true);
        }, portal);
        const page = await context.newPage();
        if (remote) {
          const session = await context.newCDPSession(page);
          await session.send('Network.enable');
          await session.send('Network.emulateNetworkConditions', { offline: false, latency: 40, downloadThroughput: 375000, uploadThroughput: 125000 });
        }
        page.on('pageerror', error => errors.push({ width, portal, repeat, version, message: error.message }));
        await page.goto(base + '/#' + portal, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__flow.home !== null);
        const snapshot = () => page.evaluate(() => ({ ...window.__flow, navigation: performance.getEntriesByType('navigation')[0].toJSON(), resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, startMs: entry.startTime, responseStartMs: entry.responseStart, endMs: entry.responseEnd, encodedBodySize: entry.encodedBodySize, decodedBodySize: entry.decodedBodySize, transferSize: entry.transferSize })) }));
        const opening = await snapshot();
        if (portal === 'teacher/plus') {
          await page.getByRole('button', { name: 'Les openen: mat', exact: true }).click();
          await page.waitForFunction(() => window.__flow.lesson !== null);
          assert.match(await page.locator('.kpd-big-word').innerText(), /mat/i);
          await page.waitForFunction(() => [...document.images].filter(image => { const rect = image.getBoundingClientRect(); return rect.width && rect.height && rect.top < innerHeight && rect.bottom > 0; }).every(image => image.complete && image.naturalWidth > 0));
          await page.evaluate(() => document.fonts.ready);
          const lessonMediaReadyMs = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))));
          const lesson = await snapshot();
          rows.push({ width, portal, repeat, version, opening, lesson, lessonId: 'mat', lessonMediaReadyMs, lessonClickMs: lesson.lesson - lesson.clicks.lesson, openingToLessonMs: lesson.lesson });
          save();
          console.log(width, portal, repeat, version, 'home', Math.round(opening.home), 'lesson', Math.round(lesson.lesson), 'click', Math.round(lesson.lesson - lesson.clicks.lesson));
          continue;
        }
        await page.locator('[data-chapter="words"]').click();
        await page.waitForFunction(() => window.__flow.chapter !== null);
        await page.locator('[data-chapter-activity="meet"]').click();
        await page.waitForFunction(() => window.__flow.activity !== null);
        await page.locator('[data-collection]').first().click();
        await page.waitForFunction(() => window.__flow.exercise !== null);
        await page.locator('[data-exercise-id]').first().waitFor();
        await page.waitForFunction(() => {
          const images = [...document.querySelectorAll('[data-exercise-id] img')];
          return images.length > 0 && images.every(image => image.complete && image.naturalWidth > 0);
        });
        const exerciseImages = await page.locator('[data-exercise-id] img').evaluateAll(async images => {
          await Promise.all(images.map(image => image.decode()));
          return images.map(image => new URL(image.currentSrc).pathname);
        });
        await page.evaluate(() => document.fonts.ready);
        const exerciseMediaReadyMs = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(performance.now())))));
        const exercise = await snapshot();
        const id = await page.locator('[data-exercise-id]').first().getAttribute('data-exercise-id');
        assert(id);
        if (version === 'after') assert(!opening.resources.some(row => /\/(?:learner-rounds|staff-apps|teacher-classroom)-/.test(row.path)), 'No player or teacher transfer before the first choice');
        if (version === 'after') assert(!exercise.resources.some(row => /\/learner-rounds-extra[.-]/.test(row.path)), 'Regular first exercise must not download unrelated extra players');
        // Test real audio after the timing snapshot, without charging playback duration to opening.
        const heard = await page.evaluate(() => window.__flowAudio.length);
        await page.locator('.cp-exercise-listen').first().click();
        await page.waitForFunction(count => window.__flowAudio.length > count && window.__flowAudio.at(-1).native && window.__flowAudio.at(-1).duration > 0, heard);
        rows.push({ width, portal, repeat, version, opening, exercise, exerciseId: id, exerciseImages, exerciseMediaReadyMs, nativeAudioCompleted: true, chapterClickMs: exercise.chapter - exercise.clicks.chapter, activityClickMs: exercise.activity - exercise.clicks.activity, exerciseClickMs: exercise.exercise - exercise.clicks.exercise, firstChoiceToExerciseMs: exercise.exercise - exercise.clicks.chapter, openingToExerciseMs: exercise.exercise });
        save();
        console.log(width, repeat, version, 'home', Math.round(opening.home), 'exercise', Math.round(exercise.exercise), 'last click', Math.round(exercise.exercise - exercise.clicks.exercise));
      } catch (error) { errors.push({ width, portal, repeat, version, message: String(error) }); save(); throw error; }
      finally { await context.close(); }
    }
  }
  assert.equal(rows.length, 4 * portals.length * repeats);
  assert.deepEqual(errors, []);
  if (portals.includes('learner')) {
    assert.equal(new Set(rows.filter(row => row.portal === 'learner').map(row => row.exerciseId)).size, 1, 'Compare exactly the same task');
    assert.equal(new Set(rows.filter(row => row.portal === 'learner').map(row => JSON.stringify(row.exerciseImages))).size, 1, 'Compare the same decoded exercise images');
  }
} finally { await browser.close(); save(); }
