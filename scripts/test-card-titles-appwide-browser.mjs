import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { practiceChapters, chapterHash, displayedChapterCollections } from '../lib/practice-chapters.ts';
import { learnerCollectionLabel, learnerListName } from '../lib/learner-copy.ts';
import { lessonPackages, allPackageWords } from '../lib/package-content.ts';
import { teacherGroups, teacherTasks } from '../lib/alfa-c-docent.ts';
import { progressKey } from '../lib/learner-progress.ts';
import { levelLabel } from '../lib/content-levels.ts';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_CARD_OUTPUT || 'outputs/card-titles-appwide-20261101';
mkdirSync(out, { recursive: true });
const levels = ['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1'];
const scopes = [], seen = new Set();
for (const chapter of practiceChapters) for (const activity of chapter.activities) for (const level of levels) for (const help of ['practice', 'guided']) {
  const key = `${activity}/${level}/${help}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const location = { chapter: chapter.id, activity, level, help };
  const collections = displayedChapterCollections(activity, location);
  if (collections.length) scopes.push({ location, collections });
}
const results = [], extras = [], errors = [];
const seed = { [progressKey]: JSON.stringify({ completed: [lessonPackages[0].lessons[0].id] }), 'klink.taalroute.savedWords.v1': JSON.stringify(allPackageWords.slice(0, 3).map(w => w.id)), 'klink.alfa-c.docent.v1': JSON.stringify({ version: 1, sessions: [] }) };
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.setDefaultTimeout(20000);
    page.on('pageerror', e => errors.push(`${engine}: ${e.message}`));
    await page.addInitScript(seed => { for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value); }, seed);
    async function storage() { assert.deepEqual(await page.evaluate(keys => Object.fromEntries(keys.map(k => [k, localStorage.getItem(k)])), Object.keys(seed)), seed); }
    async function equal(selector, description) {
      const boxes = await page.locator(selector).evaluateAll(nodes => nodes.map(e => { const r = e.getBoundingClientRect(); return { height: r.height, width: r.width, fits: e.scrollWidth <= e.clientWidth + 1 }; }));
      assert(boxes.length, description);
      assert(Math.max(...boxes.map(b => b.height)) - Math.min(...boxes.map(b => b.height)) <= 1, `${description}: unequal heights`);
      assert(boxes.every(b => b.fits), `${description}: clipped content`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${description}: horizontal overflow`);
      return boxes.length;
    }
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: width === 1366 ? 950 : 844 });
      for (const [index, { location, collections }] of scopes.entries()) {
        await page.goto(`${base}/${chapterHash(location)}`);
        const expected = collections.slice(0, 12).map(c => c.id);
        await page.waitForFunction(ids => JSON.stringify([...document.querySelectorAll('[data-collection]')].map(e => e.dataset.collection)) === JSON.stringify(ids), expected);
        assert.deepEqual(await page.locator('[data-collection] strong').allTextContents(), collections.slice(0, 12).map(c => learnerCollectionLabel(c.title).title));
        assert.deepEqual(await page.locator('[data-collection] .cp-beta-count').allTextContents(), collections.slice(0, 12).map(c => {
          const n = c.wordRound?.wordIds.length ?? c.readingSelection?.exerciseIds.length ?? c.exerciseCount ?? c.exercises.length;
          return `${n} ${c.wordRound ? n === 1 ? 'woord' : 'woorden' : n === 1 ? 'oefening' : 'oefeningen'}`;
        }));
        const metadata = await page.locator('[data-collection] .cp-collection-meta').allTextContents();
        for (const [n, c] of collections.slice(0, 12).entries()) {
          assert((c.levels ?? [c.level]).every(l => metadata[n].includes(levelLabel(l))));
          const round = learnerCollectionLabel(c.title).round ?? c.id.match(/~words-(\d+)$/)?.[1];
          if (round) assert(metadata[n].startsWith(`Ronde ${round} · `));
        }
        await equal('[data-collection]', `${engine}/${width}/${location.activity}/${location.level}/${location.help}`);
        const more = page.getByRole('button', { name: 'Meer opdrachten', exact: true });
        if (collections.length > 12) { await more.click(); assert.equal(await page.locator('[data-collection]').count(), Math.min(24, collections.length)); await equal('[data-collection]', 'Next page'); }
        await storage();
        results.push({ engine, width, ...location, available: collections.length, cardsEqual: true, titles: true, counts: true, sourceIds: true, storagePreserved: true });
        if ((index + 1) % 60 === 0) console.log(`${engine}/${width}: ${index + 1}/${scopes.length} lists`);
      }
      for (const level of levels) for (const help of ['practice', 'guided']) {
        await page.goto(`${base}/${chapterHash({ level, help })}`);
        await page.locator('[data-chapter]').first().waitFor();
        assert.deepEqual(await page.locator('[data-chapter]').evaluateAll(nodes => nodes.map(e => e.dataset.chapter)), practiceChapters.map(c => c.id));
        await equal('[data-chapter]', `${engine}/${width}/categories/${level}/${help}`);
        extras.push({ engine, width, view: 'categories', level, help });
      }
      await page.goto(`${base}/#learner/packages`);
      await page.locator('.cp-photo-section').first().waitFor();
      assert.deepEqual(await page.locator('.cp-photo-section strong').allTextContents(), lessonPackages.map(p => learnerCollectionLabel(learnerListName(p)).title));
      await equal('.cp-photo-section', 'All 15 package cards');
      for (const pack of lessonPackages) {
        await page.goto(`${base}/#learner/package/${pack.id}`);
        await page.getByRole('button', { name: 'Stap voor stap', exact: true }).click();
        await page.locator('.cp-lesson-list article').first().waitFor();
        assert.equal(await page.locator('.cp-lesson-list article').count(), pack.lessons.length);
        assert.equal(await page.locator('.cp-lesson-list .cp-card-meta').count(), pack.lessons.length);
        await equal('.cp-lesson-list article', `${engine}/${width}/lessons/${pack.id}`);
        await page.getByRole('button', { name: 'Woorden', exact: true }).click();
        await equal('.cp-word-grid article', `${engine}/${width}/words/${pack.id}`);
        extras.push({ engine, width, view: 'package', id: pack.id, lessons: pack.lessons.length, words: pack.words.length });
      }
      for (const group of teacherGroups) {
        await page.goto(`${base}/#learner/alfa-c/docent-${group.id}?level=alfa-c&help=guided`);
        const cards = page.locator('.ac-docent .cp-chapter-grid .cp-activity-button');
        await cards.first().waitFor();
        assert.equal(await cards.count(), teacherTasks.filter(t => t.group === group.id).length);
        await equal('.ac-docent .cp-chapter-grid .cp-activity-button', `${engine}/${width}/teacher/${group.id}`);
        extras.push({ engine, width, view: 'teacher', id: group.id, tasks: await cards.count() });
      }
      for (const [route, selector] of [['words', '.cp-global-word-grid article'], ['review', '.review-word-list > div > button']]) {
        await page.goto(`${base}/#learner/${route}`);
        await page.locator(selector).first().waitFor();
        await equal(selector, `${engine}/${width}/${route}`);
        extras.push({ engine, width, view: route });
      }
      for (const [route, selector] of [['plus', '.kpd-lesson-choice'], ['materials', '.kpd-worksheet-lesson']]) {
        await page.goto(`${base}/#teacher/${route}`);
        await page.locator(selector).first().waitFor();
        await equal(selector, `${engine}/${width}/teacher/${route}`);
        extras.push({ engine, width, view: `teacher/${route}` });
      }
      await storage();
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`${base}/${chapterHash({ chapter: 'sentences', activity: 'sentence-speak', level: 'a2', help: 'practice' })}`);
    await page.locator('[data-collection]').first().waitFor();
    await equal('[data-collection]', `${engine}/dark`);
    await page.addStyleTag({ content: '.cp-chapter-collection strong { font-size: 40px !important; } .cp-chapter-collection small { font-size: 28px !important; }' });
    await equal('[data-collection]', `${engine}/200% text`);
    await page.screenshot({ path: `${out}/${engine}-mobile-large-text.png` });
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(`${out}/checks.json`, JSON.stringify({ scopes: scopes.length, activities: new Set(scopes.map(s => s.location.activity)).size, results, extras, errors }, null, 2));
console.log(`PASS ${results.length} full-app lists and ${extras.length} other views; all levels, both modes, desktop/mobile, Chromium/WebKit, unchanged IDs and storage.`);
