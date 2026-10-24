import assert from 'node:assert/strict';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { isBeginnerLesson } from '../lib/lesson-plan.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
// Playback timing is simulated here; the separate continuous-flow suite checks real audio.
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; }
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 30); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
let checked = 0;
try {
  for (const [packIndex, pack] of packs.entries()) for (const [lessonIndex, lesson] of pack.lessons.entries()) {
    const exercises = exercisesForLesson(pack, lesson);
    if (!isBeginnerLesson(exercises[0], true)) continue;
    await page.goto(`${process.env.KLINK_TEST_URL || 'http://127.0.0.1:18821'}/#learner/home`);
    await page.locator('.cp-package-grid > button').nth(packIndex).click();
    await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
    await page.locator('.cp-start-lesson').nth(lessonIndex).click();
    for (const exercise of exercises) {
      await answerActivity(page, exercise, { advance: false });
      assert.equal(await page.getByRole('button', { name: /Automatisch verder/ }).count(), 0);
      await page.waitForTimeout(800);
      assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const next = page.locator('.cp-exercise-feedback > button');
      await next.scrollIntoViewIfNeeded();
      assert(await next.evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
      const box = await next.boundingBox();
      const navigation = await page.getByRole('navigation', { name: 'Cursistnavigatie' }).boundingBox();
      assert(box.height >= 48 && box.y + box.height <= navigation.y + 1, 'The whole continuation button stays above the mobile navigation');
      await next.click();
      checked++;
    }
    await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
    console.log('PASS', lesson.id, exercises.length, 'steps: manual pace, recovery and mobile footer');
  }
  assert.equal(checked, 127);
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
