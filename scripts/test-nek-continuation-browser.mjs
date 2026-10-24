import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { nextLessonPosition, progressKey } from '../lib/learner-progress.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18821';
const out = process.env.KLINK_CONTINUATION_OUTPUT || '../../outputs/klink-nekvervolg-online-20261024/local';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const pack = packs.find(item => item.id === 'groep-3');
const lesson = pack.lessons.find(item => item.id === 'woord-klink-woord-nek');
const next = nextLessonPosition(packs, pack.id, lesson.id);
const checks = [];
try {
  for (const [width, height] of [[320,568],[390,844],[1366,900]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/#learner/home');
    await page.locator('.cp-package-grid > button').nth(1).click();
    await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
    await page.locator('.cp-start-lesson').nth(10).click();
    for (const exercise of exercisesForLesson(pack, lesson)) {
      await answerActivity(page, exercise, { advance: false });
      await page.waitForTimeout(1500);
      assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
      await page.locator('.cp-exercise-feedback > button').click();
    }
    await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
    const button = page.getByRole('button', { name: 'Verder met kop · sok', exact: true });
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox(); assert(box.height >= 48 && box.y >= 0 && box.y + box.height <= height);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${out}/vervolg-${width}.png` });
    await button.click();
    await page.locator(`[data-exercise-id="${next.exerciseId}"]`).waitFor();
    await page.getByRole('heading', { name: 'kop · sok', exact: true }).waitFor();
    await page.reload();
    await page.locator('.cp-tabs').waitFor();
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Ga verder', exact: true }).click();
    await page.locator(`[data-exercise-id="${next.exerciseId}"]`).waitFor();
    const progress = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), progressKey);
    assert.deepEqual(progress.position, next); assert(progress.completed.includes(lesson.id)); assert(!progress.completed.includes(next.lessonId));
    assert.deepEqual(errors, []);
    checks.push(`${width}x${height}: manual completion, named continuation, 48px target, next model, reload and Start resume without completing next lesson`);
    await page.screenshot({ path: `${out}/volgende-les-${width}.png` });
    await context.close();
  }
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, realAudio: true, physicalPhone: false }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, errors: [] }));
} finally { await browser.close(); }
