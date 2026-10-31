import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { allPackageWords, contentPackages } from '../lib/package-content.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { learningReviewKey } from '../lib/learning-review.ts';
import { progressKey } from '../lib/learner-progress.ts';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18971';
const out = process.env.KLINK_REVIEW_OUTPUT || 'outputs/review-saved-words-20261031';
mkdirSync(out, { recursive: true });
const savedKey = 'klink.taalroute.savedWords.v1';
const lesson = contentPackages.flatMap(pack => pack.lessons).find(lesson => (lesson.newWords?.length ?? 0) >= 2);
const recall = chapterCollections('learning-review').flatMap(collection => collection.exercises).find(exercise => exercise.exerciseId.includes(':recall:'));
assert(lesson && recall, 'Use existing lessons and encountered review tasks');
const checks = [], errors = [];
try {
 for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
   const page = await browser.newPage();
   page.on('pageerror', error => errors.push(error.message));
   for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [scheduled, completed] of [[false, false], [true, false], [false, true], [true, true]]) {
     await page.goto(`${base}/#learner/review`);
     await page.locator('.review-page').waitFor();
     const state = {
      [savedKey]: '[]',
      [learningReviewKey]: JSON.stringify(scheduled ? { [recall.exerciseId]: { due: 0, last: 1, streak: 0 } } : {}),
      [progressKey]: JSON.stringify({ completed: completed ? [lesson.id] : [] }),
      'klink.taalroute.attempts.v1': JSON.stringify([{ exerciseId: recall.exerciseId, correct: false, at: '2026-10-31T08:00:00.000Z' }]),
     };
     await page.evaluate(state => { for (const [key, value] of Object.entries(state)) localStorage.setItem(key, value); }, state);
     await page.reload(); await page.locator('.review-page').waitFor();
     assert.equal(await page.getByRole('heading', { name: 'Kies eerst een woord', exact: true }).count(), 1, `Keep saved-word invitation with scheduled=${scheduled}, completed=${completed}`);
     assert.equal(await page.getByRole('link', { name: 'Oefen opnieuw', exact: true }).count(), Number(scheduled));
     assert.equal(await page.getByRole('button', { name: 'Woordenmix', exact: true }).count(), Number(completed));
     const empty = await page.locator('.honest-empty').boundingBox();
     const button = await page.getByRole('button', { name: 'Kies woorden', exact: true }).boundingBox();
     assert(Math.abs(button.x + button.width / 2 - empty.x - empty.width / 2) < 2, 'Centered invitation');
     assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
     for (const [key, value] of Object.entries(state)) assert.equal(await page.evaluate(key => localStorage.getItem(key), key), value, key);
     checks.push({ engine, width, scheduled, completed, saved: 0 });
    }
    await page.screenshot({ path: `${out}/${engine}-${width}-no-saved.png` });
    const protectedState = await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), [progressKey, learningReviewKey, 'klink.taalroute.attempts.v1']);
    await page.getByRole('button', { name: 'Kies woorden', exact: true }).click();
    await page.locator('.cp-global-word-grid article').first().waitFor();
    await page.locator('.cp-global-word-grid article').first().getByRole('button', { name: / bewaren$/ }).click();
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), savedKey);
    assert.equal(saved.length, 1);assert(allPackageWords.some(word => word.id === saved[0]));
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Nog een keer', exact: true }).click();
    await page.locator('.review-word-list').waitFor();
    assert.equal(await page.locator('.review-word-list > div > button').count(), 1);
    assert.equal(await page.locator('.honest-empty').count(), 0);
    await page.reload();await page.locator('.review-word-list').waitFor();
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), savedKey), saved);
    const word = allPackageWords.find(word => word.id === saved[0]);
    assert(word.audio, 'Saved fixture has existing audio');
    const audio = page.waitForResponse(response => new URL(response.url()).pathname === word.audio);
    await page.locator('.review-word-list > div > button').click();
    assert((await audio).ok(), 'Saved word retains accessible original audio');
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Woorden bekijken', exact: true }).click();
    await page.getByLabel('Welke woorden?', { exact: true }).selectOption('saved');
    await page.locator('.cp-global-word-grid article').first().getByRole('button', { name: / niet meer bewaren$/ }).click();
    await page.getByRole('heading', { name: 'Nog geen woorden bewaard', exact: true }).waitFor();
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Nog een keer', exact: true }).click();
    await page.getByRole('heading', { name: 'Kies eerst een woord', exact: true }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Oefen opnieuw', exact: true }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Woordenmix', exact: true }).count(), 1);
    assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).completed[0], progressKey), lesson.id);
    await page.getByRole('link', { name: 'Oefen opnieuw', exact: true }).click();
    await page.locator('[data-collection]').first().waitFor();
    assert.equal(await page.locator('[data-collection]').count(), 1, 'Existing due work still opens');
    await page.goto(`${base}/#learner/review`);
    await page.getByRole('heading', { name: 'Kies eerst een woord', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Woordenmix', exact: true }).click();
    await page.locator('.is-mixed-round').waitFor();
    for (const [key, value] of Object.entries(protectedState)) assert.equal(await page.evaluate(key => localStorage.getItem(key), key), value, key);
    await page.getByRole('button', { name: 'Terug', exact: true }).first().click();
    await page.getByRole('heading', { name: 'Kies eerst een woord', exact: true }).waitFor();
    checks.push({ engine, width, lifecycle: 'choose, save, review, reload, original audio, unsave, invitation restored; progress and scheduled review retained' });
   }
  } finally { await browser.close(); }
 }
 assert.deepEqual(errors, []);
} finally { writeFileSync(`${out}/results.json`, JSON.stringify({ base, checks, errors }, null, 2)); }
console.log('PASS', checks.length, 'review states and save/reload/audio/unsave journeys in two engines');
