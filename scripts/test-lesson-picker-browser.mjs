import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const out = 'outputs/lesson-picker-20261016';
mkdirSync(out, { recursive: true });
const packIndex = packs.findIndex(pack => pack.lessons.some(lesson => lesson.title === 'p'));
assert(packIndex >= 0);
const pack = packs[packIndex];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${base}/#learner/home`); await page.reload();
    await page.getByRole('button', { name: 'Lessen', exact: true }).click();
    await page.locator('.cp-package-grid > button').nth(packIndex).click();
    const picker = page.locator('.cp-lesson-picker');
    assert.equal(await picker.locator('h1').innerText(), 'Lessen');
    assert.equal(await picker.locator('article').count(), pack.lessons.length);
    assert.equal(await picker.locator('.cp-word-chips, ol, .cp-panel-count, small').count(), 0);
    for (const img of await picker.locator('img').all()) await img.evaluate(el => el.decode());
    for (const card of await picker.locator('article').all()) {
      assert.equal(await card.locator('button').count(), 1);
      const button = card.locator('button');
      assert.equal(await button.innerText(), 'Start');
      const bounds = await button.boundingBox(); assert(bounds.width >= 48 && bounds.height >= 48);
      assert(bounds.x >= 0 && bounds.x + bounds.width <= width);
      assert(await card.evaluate(el => el.scrollWidth <= el.clientWidth));
    }
    await picker.screenshot({ path: `${out}/lessen-${width}.png` });
    const start = picker.locator('.cp-start-lesson').first();
    await start.focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('.cp-lesson-launch h1').innerText(), 'map');
    assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercisesForLesson(pack, pack.lessons[0])[0].exerciseId);
    await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
    await picker.waitFor();
  }
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ widths: [1366, 768, 390, 320], singleStartPerLesson: true, minimumTouchTarget: 48, keyboardStartsCorrectLesson: true, systemLabelsRemoved: true, lessonDataUnchanged: true, errors }, null, 2));
  console.log('PASS compact lesson picker: four widths, one start per lesson, keyboard route, no overflow or system labels');
} finally { await browser.close(); }
