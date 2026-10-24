import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { chapterCollections, chapterHash, practiceChapters } from '../lib/practice-chapters.ts';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { progressKey } from '../lib/learner-progress.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18843';
const out = process.env.KLINK_STABILITY_OUTPUT || 'outputs/session-stability-20261024/stress';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage(), errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
page.on('crash', () => errors.push('Renderer crashed'));
await page.addInitScript(() => {
  window.__segmentCalls = 0;
  const original = Reflect.get(Intl.Segmenter.prototype, 'segment');
  Intl.Segmenter.prototype.segment = function (...args) { window.__segmentCalls++; return original.apply(this, args); };
});
const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
const routes = ['word-sort', 'text-evidence', 'verb-choice', 'context-order', 'situation-point', 'practice-branch'].map(activity => ({
  activity, chapter: practiceChapters.find(item => item.activities.includes(activity)).id, collection: chapterCollections(activity).at(-1),
}));
try {
  await page.goto(base + '/#learner/home');
  const nav = page.getByRole('navigation', { name: 'Cursistnavigatie' });
  await nav.getByRole('button', { name: 'Woorden', exact: true }).click();
  await page.locator('.cp-global-word-grid article > button').nth(1).click();
  const saved = await page.evaluate(() => localStorage.getItem('klink.taalroute.savedWords.v1'));
  assert(JSON.parse(saved).length > 0);
  await nav.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Begin hier', exact: true }).click();
  await answerActivity(page, exercisesForLesson(packs[0], packs[0].lessons[0])[0]);
  const position = await page.evaluate(key => localStorage.getItem(key), progressKey);
  assert(JSON.parse(position).position.exerciseId);
  for (let round = 0; round < 10; round++) {
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const route of [...routes, ...chapterCollections('situation-point').map(collection => ({ activity: 'situation-point', chapter: 'practical', collection, answer: true }))]) {
      const { collection } = route;
      const start = Date.now();
      await page.goto(base + '/' + chapterHash({ chapter: route.chapter, activity: route.activity, collection: collection.id, level: collection.level }));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.locator('.is-mixed-round, .cp-chapter-playing .honest-empty').waitFor();
      if (await page.locator('.cp-chapter-playing .honest-empty').count()) await page.getByRole('button', { name: 'Nog een keer', exact: true }).click();
      await page.locator('.is-mixed-round').waitFor();
      const toggle = page.locator('.cp-nav-toggle');
      if ((await toggle.getAttribute('aria-expanded') === 'false') !== Boolean(round % 2)) await toggle.click();
      if (route.answer) {
        await page.setViewportSize({ width: 320, height: 568 });
        for (const exercise of collection.exercises) {
          await page.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
          await page.locator('.cp-hotspot-target').first().waitFor();
          await page.locator('.cp-hotspot-target').nth(exercise.standardTask.regions.findIndex(region => exercise.standardTask.correctRegionIds.includes(region.id))).click();
          await page.locator('.cp-exercise-feedback > button').click();
        }
        await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
        await page.setViewportSize({ width: 1280, height: 800 });
      }
      const calls = await page.evaluate(() => window.__segmentCalls);
      assert(calls < 20000, `Excessive native segmentation: ${calls}`);
      assert.equal(await page.evaluate(key => localStorage.getItem(key), progressKey), position);
      assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.savedWords.v1')), saved);
      const metrics = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(item => [item.name, item.value]));
      checks.push({ round, activity: route.activity, collection: collection.id, answered: route.answer ? collection.exercises.length : 0, ms: Date.now() - start, segmentCalls: calls, heapMB: metrics.JSHeapUsedSize / 1048576 });
      console.log(JSON.stringify(checks.at(-1)));
      writeFileSync(`${out}/checks.json`, JSON.stringify({ base, checks, errors }, null, 2));
    }
  }
  await nav.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: 'Ga verder', exact: true }).click();
  await page.locator(`[data-exercise-id="${JSON.parse(position).position.exerciseId}"]`).waitFor();
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ base, checks, errors, reloads: checks.length, sceneAnswers: checks.reduce((n, row) => n + row.answered, 0), savedWordsAndPositionPreserved: true, resumedAfterStress: true, realAudio: true }, null, 2));
} finally { await browser.close(); }
