import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import sharp from 'sharp';
import { practiceChapters, displayedChapterCollections, chapterHash } from '../lib/practice-chapters.ts';

const out = 'docs/first-download-20261105/lexicon-browser';
mkdirSync(out, { recursive: true });
const location = { chapter: practiceChapters.find(chapter => chapter.activities.includes('build-model')).id, activity: 'build-model', level: 'all', help: 'guided' };
const collections = displayedChapterCollections('build-model', location).filter(row => row.pack.id.startsWith('lexicon-woordbouw-'));
const fixtures = [collections[0], collections[Math.floor(collections.length / 2)], collections.at(-1)];
const checks = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    for (const width of [1280, 390]) for (const [index, collection] of fixtures.entries()) {
      const images = [];
      for (const [version, port] of [['before', 19122], ['after', 19120]]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        try {
          await page.goto(`http://127.0.0.1:${port}/${chapterHash({ ...location, collection: collection.id })}`, { waitUntil: 'domcontentloaded' });
          const exercise = collection.exercises[0];
          await page.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
          await page.locator('.klink-opening-loader').waitFor({ state: 'detached' });
          const tiles = page.locator('.cp-tile-bank button');
          assert.deepEqual(await tiles.allTextContents(), exercise.tiles.map(tile => tile.token));
          await page.evaluate(() => document.fonts.ready);
          await page.waitForFunction(() => [...document.images].filter(image => image.getClientRects().length).every(image => image.complete));
          const path = `${out}/${engine}-${width}-${index}-${version}.png`;
          await page.screenshot({ path, animations: 'disabled' });
          images.push(await sharp(path).ensureAlpha().raw().toBuffer());
          for (const id of exercise.answer.targetTileIds) await tiles.nth(exercise.tiles.findIndex(tile => tile.id === id)).click();
          await page.locator('.cp-exercise-feedback.right').waitFor();
          assert.equal((await page.locator('.cp-build-slots button').allTextContents()).join(''), exercise.exampleWord);
          checks.push({ engine, width, index, version, exercise: exercise.exerciseId, tileOrder: true, correctAnswer: true });
        } finally { await context.close(); }
      }
      assert(images[0].equals(images[1]), `${engine}/${width}/${index}: preserve the actual word-building screen`);
    }
  } finally { await browser.close(); writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2)); }
}
assert.equal(checks.length, 24); assert.deepEqual(errors, []);
console.log('PASS 24 source-bound word-building answers and 12 pixel-identical exercise screens');
