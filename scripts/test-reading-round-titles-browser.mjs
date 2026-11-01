import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { learnerCollectionLabel } from '../lib/learner-copy.ts';
import { collectionProgressId, roundProgressPrefix } from '../lib/round-progress.ts';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_READING_TITLES_OUTPUT || 'outputs/reading-round-titles-20261101';
mkdirSync(out, { recursive: true });
const checks = [], flows = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1366, 390, 320]) for (const theme of ['light', 'dark']) for (const level of ['a1', 'a2']) {
      await page.setViewportSize({ width, height: width === 1366 ? 950 : 844 });
      await page.emulateMedia({ colorScheme: theme });
      const route = { chapter: 'texts', activity: 'text-question', level, help: 'practice' };
      const rows = chapterCollections('text-question').filter(r => r.level === level && r.title.startsWith('Leesronde'));
      await page.goto(base + '/' + chapterHash(route));
      const cards = page.locator('[data-collection]');
      await cards.first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      if (engine === 'chromium' && theme === 'light' && level === 'a2' && width !== 320) {
        await page.waitForTimeout(250);
        await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0; });
        await page.screenshot({ path: `${out}/klink-teksten-inhoudelijke-titels-a2-${width === 1366 ? 'desktop' : 'mobiel'}.png` });
      }
      while (await cards.count() < rows.length) await page.getByRole('button', { name: 'Meer opdrachten', exact: true }).click();
      assert.deepEqual(await cards.evaluateAll(elements => elements.map(e => e.dataset.collection)), rows.map(r => r.id));
      assert.deepEqual(await cards.locator('strong').allTextContents(), rows.map(r => learnerCollectionLabel(r.title).title));
      const metadata = await cards.locator('.cp-collection-meta').allTextContents();
      rows.forEach((r, i) => {
        assert.equal(metadata[i], `Ronde ${i + 1} · ${level.toUpperCase()} · ${r.exerciseCount} oefeningen`);
      });
      const boxes = await cards.evaluateAll(elements => elements.map(e => {
        const r = e.getBoundingClientRect(), title = e.querySelector('strong');
        return { height: r.height, width: r.width, fits: e.scrollWidth <= e.clientWidth + 1 && title.scrollWidth <= title.clientWidth + 1 };
      }));
      assert.equal(boxes.length, 34);
      assert(Math.max(...boxes.map(b => b.height)) - Math.min(...boxes.map(b => b.height)) < 1);
      assert(boxes.every(b => b.fits));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      checks.push({ engine, width, theme, level, rounds: rows.length, sourceIds: true, contentTitles: true, metadataSeparate: true, cardsEqual: true, cardHeight: boxes[0].height, noOverflow: true });
      if (width !== 320 && theme === 'light') {
        const row = rows[22], bank = JSON.parse(readFileSync('public' + row.contentUrl));
        const key = roundProgressPrefix + collectionProgressId('text-question', row.id, row.contentUrl);
        const progress = JSON.stringify({ version: 1, total: row.exerciseCount, done: [bank.exercises[0].exerciseId] });
        await page.evaluate(({ key, progress }) => { localStorage.setItem(key, progress); localStorage.setItem('klink.topic-title-retention', 'kept'); }, { key, progress });
        await page.reload();
        while (await cards.count() < 24) await page.getByRole('button', { name: 'Meer opdrachten', exact: true }).click();
        const card = page.locator(`[data-collection="${row.id}"]`);
        await card.locator('.cp-round-status').waitFor();
        await card.click();
        await page.locator('[data-exercise-id]').waitFor();
        assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'), bank.exercises[0].exerciseId);
        await page.reload();
        await page.locator('[data-exercise-id]').waitFor();
        await page.getByRole('button', { name: 'Andere opdracht', exact: true }).click();
        await card.waitFor();
        assert.equal(await page.evaluate(key => localStorage.getItem(key), key), progress);
        assert.equal(await page.evaluate(() => localStorage.getItem('klink.topic-title-retention')), 'kept');
        assert.equal(await card.locator('strong').textContent(), learnerCollectionLabel(row.title).title);
        flows.push({ engine, width, level, round: 23, sourceExerciseUnchanged: true, reload: true, progressPreserved: true, newTitleOnReturn: true });
      }
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
assert.equal(checks.length, 24);
assert.equal(flows.length, 8);
writeFileSync(out + '/checks.json', JSON.stringify({ base, readingRounds: 68, checks, flows, errors, physicalDeviceTested: false }, null, 2) + '\n');
console.log('PASS 68 source-bound titles across 24 responsive light/dark lists and 8 exercise/reload/progress flows.');
