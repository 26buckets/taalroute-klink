import { productionIndex } from '../lib/production-practice.ts';
import { chapterHash } from '../lib/practice-chapters.ts';
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { lessonPackages, allPackageWords, wordLabel } from '../lib/package-content.ts';
import { lessonPreviewWords } from '../lib/taalroute-packages.ts';
import { progressKey } from '../lib/learner-progress.ts';
import { practicePreferencesKey } from '../lib/practice-navigation.ts';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18971';
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/direct-kiezen/navigation';
mkdirSync(out, { recursive: true });
const pack = lessonPackages.find(item => item.lessons.some(lesson => lesson.guidedExerciseIds?.length));
const lesson = pack.lessons.find(item => item.guidedExerciseIds?.length);
const position = { packageId: pack.id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds[0] };
const saved = {
  [progressKey]: JSON.stringify({ position, completed: [lesson.id] }),
  'klink.taalroute.savedWords.v1': JSON.stringify([allPackageWords[0].id]),
  'klink.taalroute.attempts.v1': JSON.stringify([{ exerciseId: position.exerciseId, correct: false, at: '2026-10-30T12:00:00.000Z' }]),
  'klink.round-progress.v1:sequence:functional:lijst': JSON.stringify({ version: 1, total: 12, done: ['lijst-01'] }),
};
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}/#learner/home`);
    await page.locator('.cp-home').waitFor();
    assert.equal(await page.locator('.cp-direct-resume').count(), 0, 'A new visitor has no invented resume action');
    await page.evaluate(saved => {
      for (const [key, value] of Object.entries(saved)) localStorage.setItem(key, value);
      localStorage.setItem('klink.taalroute.preferences.v1', JSON.stringify({ literacy: 'alfa-a', language: 'b1', pictures: 'request' }));
      localStorage.removeItem('klink.taalroute.practice-navigation.v1');
    }, saved);
    await page.reload();
    const nav = page.getByRole('navigation', { name: 'Cursistnavigatie' });
    await page.getByRole('button', { name: `Verder met ${wordLabel(lessonPreviewWords(pack, lesson)[0])}`, exact: true }).waitFor();
    for (const [width, height] of [[1366, 900], [768, 1024], [390, 844], [320, 480]]) {
      await page.setViewportSize({ width, height });
      assert.deepEqual(await nav.locator('button').allTextContents(), ['Start', 'Woorden bekijken', 'Nog een keer']);
      assert.equal(await page.locator('[data-chapter]').count(), 12);
      assert.equal(await page.locator('.cp-direct-levels button:not(:disabled)').count(), 6);
      assert.equal(await page.locator('.cp-direct-levels select, .cp-direct-levels details').count(), 0);
      assert.equal(await page.getByRole('button', { name: 'B2 — nog niet beschikbaar', exact: true }).count(), 0);
      const reserved = page.locator('.cp-direct-levels button[aria-label="B2 — nog niet beschikbaar"]');
      assert(await reserved.isHidden(), 'B2 is absent from the visible and accessible controls');
      const space = await reserved.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      const b1 = await page.getByRole('button', { name: 'B1', exact: true }).boundingBox();
      assert(Math.abs(space.width - b1.width) < 1 && space.height === b1.height && space.y === b1.y && space.x >= b1.x + b1.width, 'B2 keeps its complete empty slot after B1');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const first = await page.locator('[data-chapter]').first().boundingBox();
      const bottomNav = await nav.boundingBox();
      assert(first.y < bottomNav.y || width > 820, `First exercise is visible at ${width}x${height}`);
      for (const button of await page.locator('.cp-direct-levels button:visible, .cp-practice-modes button').all()) {
        const box = await button.boundingBox();
        assert(box.height >= 47.5 && box.width >= 47.5, 'Level and mode targets are at least 48px');
      }
      await page.screenshot({ path: `${out}/${engine}-${width}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Alfa C', exact: true }).click();
    await page.locator('.cp-practice-modes').getByRole('button', { name: 'Met je docent', exact: true }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Alfa C', exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('.cp-direct-levels button[aria-label="Alfa C"]')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.locator('.cp-practice-modes').getByRole('button', { name: 'Met je docent', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), practicePreferencesKey), { level: 'alfa-c', help: 'guided' });
    await page.locator('[data-chapter="words"]').click();
    await nav.getByRole('button', { name: 'Start', exact: true }).click();
    assert.equal(await page.locator('[data-chapter]').count(), 12, 'Start also leaves an inner route');
    await page.getByRole('button', { name: 'Klankenkaart', exact: true }).click();
    await page.locator('[data-sound="a"]').waitFor();
    assert.equal(await page.locator('[data-sound]').count(), 46);
    await nav.getByRole('button', { name: 'Woorden bekijken', exact: true }).click();
    await page.getByRole('heading', { name: 'Woorden bekijken', exact: true }).waitFor();
    await nav.getByRole('button', { name: 'Nog een keer', exact: true }).click();
    await page.locator('.review-page').waitFor();
    await nav.getByRole('button', { name: 'Start', exact: true }).click();
    await page.locator('.cp-direct-explanation summary').click();
    assert.equal(await page.locator('.cp-practice-line button').count(), 6, 'All six original steps remain available');
    await page.locator('.cp-practice-line button').first().click();
    await page.locator('.cp-practice-explanation iframe').waitFor();
    await page.getByRole('button', { name: 'Uitleg sluiten', exact: true }).click();
    const row = productionIndex.find(item => item.id.startsWith('word-meet:alfa-c:'));
    const firstWord = JSON.parse(readFileSync('public' + row.url)).exercises[0];
    await page.goto(base + '/' + chapterHash({ chapter: 'words', activity: 'meet', collection: row.id, level: row.level, help: 'practice' }));
    await page.locator(`[data-exercise-id="${firstWord.exerciseId}"]`).waitFor();
    for (let reload = 0; reload < 3; reload++) {
      await page.reload();
      await page.locator(`[data-exercise-id="${firstWord.exerciseId}"]`).waitFor();
    }
    const retained = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(saved));
    assert.deepEqual(retained, saved, 'Navigation preserves existing progress, saved words, attempts and rounds byte for byte');
    await nav.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByRole('button', { name: 'Alfa A', exact: true }).click();
    await page.locator('.cp-practice-modes').getByRole('button', { name: 'Zelf oefenen', exact: true }).click();
    await page.locator('.cp-direct-resume').click();
    await page.locator(`[data-exercise-id="${position.exerciseId}"]`).waitFor();
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).position, progressKey), position);
    await page.goto(`${base}/#teacher`);
    const guide = page.locator('.cp-menu-guide');
    await guide.waitFor();
    assert.deepEqual(await guide.locator('dt a').allTextContents(), ['Start', 'Woorden bekijken', 'Nog een keer']);
    await guide.getByRole('link', { name: 'Woorden bekijken', exact: true }).click();
    await page.getByRole('heading', { name: 'Woorden bekijken', exact: true }).waitFor();
    checks.push({ engine, sizes: 4, persistedLevels: true, retainedStorage: Object.keys(saved), originalSteps: 6, sounds: 46 });
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2));
console.log('PASS Direct kiezen, visible level buttons, real sound card, original steps and preserved storage in both browsers and four sizes');
