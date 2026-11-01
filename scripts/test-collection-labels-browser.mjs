import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chapterHash, displayedChapterCollections } from '../lib/practice-chapters.ts';
import { learnerCollectionLabel } from '../lib/learner-copy.ts';
import { collectionProgressId, roundProgressPrefix } from '../lib/round-progress.ts';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_LABEL_OUTPUT || 'outputs/collection-labels-20261101';
mkdirSync(out, { recursive: true });
const routes = [
  { chapter: 'sentences', activity: 'sentence-speak', level: 'a2', help: 'practice' },
  { chapter: 'sentences', activity: 'sentences', level: 'a2', help: 'practice' },
  { chapter: 'texts', activity: 'text-question', level: 'a2', help: 'practice' },
  { chapter: 'words', activity: 'meet', level: 'b1', help: 'practice' },
];
const results = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    for (const width of [1366, 390, 320]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: width === 1366 ? 950 : 844 });
      await page.emulateMedia({ colorScheme: theme });
      for (const route of routes) {
        await page.goto(`${base}/${chapterHash(route)}`);
        const cards = page.locator('[data-collection]');
        await cards.first().waitFor();
        const source = displayedChapterCollections(route.activity, route);
        assert.equal(await cards.count(), Math.min(12, source.length));
        assert.deepEqual(await cards.evaluateAll(nodes => nodes.map(n => n.dataset.collection)), source.slice(0, 12).map(c => c.id));
        assert.deepEqual(await cards.locator('strong').allTextContents(), source.slice(0, 12).map(c => learnerCollectionLabel(c.title).title));
        const sizes = await cards.evaluateAll(nodes => nodes.map(n => {
          const r = n.getBoundingClientRect(), text = n.querySelector('.cp-collection-copy');
          return { width: r.width, height: r.height, fits: text.getBoundingClientRect().right <= r.right && text.scrollWidth <= text.clientWidth + 1 };
        }));
        assert(Math.max(...sizes.map(r => r.height)) - Math.min(...sizes.map(r => r.height)) < 1, `${engine}/${width}/${route.activity}: unequal heights`);
        assert(sizes.every(r => r.fits), `${engine}/${width}/${route.activity}: clipped text`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        results.push({ engine, width, theme, activity: route.activity, cards: sizes.length, height: sizes[0].height });
        if (engine === 'chromium' && theme === 'light' && route.activity === 'sentence-speak' && width !== 320) {
          await page.screenshot({ path: `${out}/klink-kaartjes-${width === 1366 ? 'desktop' : 'mobiel'}.png` });
        }
      }
    }
    const route = routes[0], collection = displayedChapterCollections(route.activity, route)[0];
    const bank = JSON.parse(readFileSync(`public${collection.contentUrl}`));
    const key = roundProgressPrefix + collectionProgressId(route.activity, collection.id, collection.contentUrl);
    const progress = JSON.stringify({ version: 1, total: collection.exerciseCount, done: [bank.exercises[0].exerciseId] });
    await page.evaluate(({ key, progress }) => localStorage.setItem(key, progress), { key, progress });
    await page.goto(`${base}/${chapterHash(route)}`);
    const card = page.locator(`[data-collection="${collection.id}"]`);
    await card.locator('.cp-round-status').waitFor();
    await card.click();
    await page.locator('[data-exercise-id]').first().waitFor();
    assert.equal(await page.locator('[data-exercise-id]').first().getAttribute('data-exercise-id'), bank.exercises[0].exerciseId);
    await page.reload();
    await page.locator('[data-exercise-id]').first().waitFor();
    await page.getByRole('button', { name: 'Andere opdracht', exact: true }).first().click();
    await card.waitFor();
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key), progress);
    await page.waitForFunction(id => document.activeElement?.getAttribute('data-collection') === id, collection.id);
    await page.addStyleTag({ content: '.cp-chapter-collection strong { font-size: 40px !important; } .cp-chapter-collection small { font-size: 28px !important; }' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.equal(await card.locator('strong').textContent(), 'Zinnen oefenen');
    assert(await card.locator('.cp-collection-copy').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(`${out}/browser-results.json`, JSON.stringify({ results, errors, preserved: ['source IDs', 'exercise', 'reload', 'back focus', 'saved progress'], textZoom: '200%' }, null, 2));
console.log(`PASS ${results.length} layouts: equal cards, full labels, source order, light/dark, desktop/mobile, exercise/reload/back and saved progress.`);
