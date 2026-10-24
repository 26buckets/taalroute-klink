import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { learnerPhaseNames } from '../lib/learner-copy.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/phase-navigation-20261017';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], checks = [];
const pass = message => { checks.push(message); console.log('PASS', message); };
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(() => {
  window.__plays = [];
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; }
    play() { window.__plays.push(this.src); this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 30); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const lessonIndex = 2; // The map lesson shown in the reported screenshot.
const pack = packs[0], lesson = pack.lessons[lessonIndex], exercises = exercisesForLesson(pack, lesson);
const step = () => page.locator('.cp-exercise-browser');
const phases = () => page.locator('.cp-exercise-menu-options');
const trigger = () => page.getByRole('button', { name: 'Andere oefening', exact: true });
async function revealMenu() { if (await trigger().getAttribute('aria-expanded') === 'false') await trigger().click(); }
const position = () => page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.route.v1')));
async function openLesson() {
  await page.goto(`${base}/#learner/home`);
  await page.evaluate(() => { localStorage.removeItem('klink.taalroute.route.v1'); localStorage.removeItem('klink.taalroute.attempts.v1'); });
  await page.reload();
  await page.locator('.cp-package-grid > button').first().click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-start-lesson').nth(lessonIndex).click();
}
try {
  await openLesson();
  assert.equal(await trigger().getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('.cp-exercise-workspace > aside').count(), 0);
  assert(await phases().locator('button').evaluateAll(buttons => buttons.every(b => !b.disabled)));
  const original = await position();
  for (const [phase, label] of Object.entries(learnerPhaseNames)) {
    const first = exercises.find(e => e.phase === phase);
    if (!first) continue;
    const button = phases().getByRole('button', { includeHidden: true, name: label, exact: true });
    await revealMenu(); await button.focus(); await page.keyboard.press('Enter');
    assert.equal(await step().getAttribute('data-exercise-id'), first.exerciseId);
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await position(), original, 'Browsing must not skip the saved route or complete a lesson');
  }
  assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.attempts.v1')), null);
  pass('All five phases open their own first exercise by keyboard, without invented results or skipped saved progress');

  const firstRecall = exercises.findIndex(e => e.phase === 'recall');
  for (const exercise of exercises.slice(firstRecall)) await answerActivity(page, exercise);
  assert.equal(await step().getAttribute('data-exercise-id'), exercises[0].exerciseId);
  assert(!(await position()).completed.includes(lesson.id));
  assert.equal(await step().locator('output strong').innerText(), 'Eerst deze oefening');
  assert.equal(await step().locator('output small').innerText(), 'Deze oefening was nog niet af.');
  await revealMenu(); await phases().getByRole('button', { includeHidden: true, name: 'Maak', exact: true }).click();
  assert(!(await step().locator('output').innerText()).includes('Deze oefening was nog niet af.'));
  await page.reload();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: 'Ga verder', exact: true }).click();
  assert.equal(await step().getAttribute('data-exercise-id'), exercises[0].exerciseId);
  for (const exercise of exercises) await answerActivity(page, exercise);
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  assert((await position()).completed.includes(lesson.id));
  pass('Finishing a later phase returns to unfinished work; reload preserves the real route, and completing the whole route still works');

  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await openLesson();
    for (const button of await phases().locator('button').all()) {
      await revealMenu(); assert(await button.isVisible()); await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox(); assert(box.width >= 48 && box.height >= 48);
      await button.click();
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    }
    // The phase loop already ends on Nog een keer; do not click it twice and steal heading focus.
    for (const exercise of exercises.slice(firstRecall)) await answerActivity(page, exercise);
    assert.equal(await trigger().getAttribute('aria-expanded'), 'false');
    await revealMenu(); await phases().getByRole('button', { includeHidden: true, name: 'Kijk en luister', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.cp-model-content img')?.naturalWidth > 0);
    await page.screenshot({ path: `${out}/lesson-${width}.png` });
  }
  pass('All phase buttons stay reachable on desktop, tablet and phones, with 48px targets and the actual word photo');
  await revealMenu();
  await page.keyboard.press('Escape');
  assert.equal(await trigger().getAttribute('aria-expanded'), 'false');
  assert(await trigger().evaluate(el => el === document.activeElement));
  await page.setViewportSize({ width: 320, height: 568 });
  await revealMenu(); await phases().getByRole('button', { includeHidden: true, name: 'Nog een keer', exact: true }).click();
  assert.equal(await trigger().getAttribute('aria-expanded'), 'false');
  await revealMenu();
  assert.equal(await phases().getByRole('button', { includeHidden: true, name: 'Nog een keer', exact: true }).getAttribute('aria-pressed'), 'true');
  pass('Escape returns focus to the trigger; reopening identifies the current phase on a narrow phone');

  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/${base.startsWith('https:') ? 'live' : 'local'}-checks.json`, JSON.stringify({ base, checks, errors }, null, 2));
  await browser.close();
}
