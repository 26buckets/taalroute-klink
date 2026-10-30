import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import { availableChapterCollections, displayedChapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { collectionProgressId, roundProgressPrefix } from '../lib/round-progress.ts';
import { groupSessionKey } from '../lib/group-practice.ts';

const base = process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:18971';
const out = process.env.KLINK_WORD_ROUNDS_OUTPUT ?? 'outputs/word-rounds-20261030/browser';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
const levels = ['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1'];
const selection = level => ({ chapter: 'words', activity: 'meet', level, help: 'practice' });
const url = location => base + '/' + chapterHash(location);
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => errors.push(error.message));
    const requests = []; page.on('request', request => requests.push(request.url()));
    await page.goto(url(selection('a1'))); await page.locator('[data-collection]').first().waitFor();
    assert(!requests.some(request => request.includes('/practice-content/')), 'The overview keeps exercise banks lazy');
    for (const [width, height] of [[1366, 900], [768, 1024], [390, 844], [320, 480]]) {
      await page.setViewportSize({ width, height });
      for (const level of levels) {
        await page.goto(url(selection(level))); await page.locator('[data-collection]').first().waitFor();
        const expected = displayedChapterCollections('meet', selection(level)).slice(0, 12);
        assert.deepEqual(await page.locator('[data-collection]').evaluateAll(elements => elements.map(element => element.dataset.collection)), expected.map(item => item.id));
        for (const item of expected) {
          const card = page.locator(`[data-collection="${item.id}"]`);
          assert.equal(await card.locator('strong').innerText(), item.title);
          if (item.wordRound) {
            assert.equal(await card.locator('.cp-beta-count').innerText(), `${item.wordRound.exerciseIds.length} ${item.wordRound.exerciseIds.length === 1 ? 'woord' : 'woorden'}`);
            assert.equal(await card.locator('img').count(), item.image ? 1 : 0);
            if (item.image) { const rendered = new URL(await card.locator('img').getAttribute('src'), base); assert.equal(rendered.searchParams.get('url') ?? rendered.pathname, item.image); }
          }
          const box = await card.boundingBox(); assert(box.width >= 48 && box.height >= 48);
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (level === 'alfa-a') await page.screenshot({ path: `${out}/${engine}-${width}.png` });
      }
    }
    let opened = 0;
    for (const level of levels) for (const item of displayedChapterCollections('meet', selection(level)).filter(item => item.wordRound)) {
      await page.goto(url({ ...selection(level), collection: item.id }));
      await page.locator(`[data-exercise-id="${item.wordRound.exerciseIds[0]}"]`).waitFor();
      await page.getByRole('button', { name: 'Andere opdracht', exact: true }).click();
      const card = page.locator(`[data-collection="${item.id}"]`); await card.waitFor();
      await page.waitForFunction(id => document.activeElement?.getAttribute('data-collection') === id, item.id);
      opened++;
    }
    checks.push({ engine, opened, widths: 4, levels: 6, metadata: true, lazyOverview: true, backAndFocus: true });
    console.log('PASS', engine, opened, 'word-round entrances and responsive cards');
    await page.close();

    const fresh = await browser.newPage({ viewport: { width: 390, height: 844 } });
    fresh.on('pageerror', error => errors.push(error.message));
    await fresh.addInitScript(() => {
      window.__wordAudio = [];
      const play = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play').value;
      HTMLMediaElement.prototype.play = function () { this.addEventListener('ended', () => window.__wordAudio.push(this.currentSrc), { once: true }); return play.call(this); };
    });
    const source = availableChapterCollections('meet', selection('alfa-a')).find(item => item.exercises.length === 68);
    const children = displayedChapterCollections('meet', selection('alfa-a')).filter(item => item.wordRound?.sourceId === source.id);
    const child = children[1], target = source.exercises.find(item => item.exerciseId === child.wordRound.exerciseIds[0]);
    const key = roundProgressPrefix + collectionProgressId('meet', source.id);
    const oldSessionKey = groupSessionKey(`chapter:meet:${source.id}`, 'meet');
    const prior = JSON.stringify({ version: 1, total: source.exercises.length, done: [source.exercises[0].exerciseId, source.exercises.at(-1).exerciseId] });
    const session = JSON.stringify({ version: 1, exerciseId: target.exerciseId, done: false });
    await fresh.goto(url(selection('alfa-a')));
    await fresh.evaluate(({ key, prior, oldSessionKey, session }) => { localStorage.setItem(key, prior); localStorage.setItem(oldSessionKey, session); localStorage.setItem('klink.word-round-preservation', 'unchanged'); }, { key, prior, oldSessionKey, session });
    await fresh.goto(url({ ...selection('alfa-a'), collection: child.id }));
    await fresh.locator(`[data-exercise-id="${target.exerciseId}"]`).waitFor();
    await fresh.locator('.cp-model-content').click();
    await fresh.waitForFunction(src => window.__wordAudio.some(url => url.endsWith(src)), target.prompt.audio.src);
    await fresh.locator('.cp-exercise-feedback').getByRole('button', { name: 'Verder', exact: true }).click();
    await fresh.waitForFunction(key => JSON.parse(localStorage.getItem(key)).done.length === 3, key);
    assert.equal(await fresh.evaluate(key => localStorage.getItem(key), oldSessionKey), session, 'The original resume position is retained byte for byte');
    await fresh.getByRole('button', { name: 'Andere opdracht', exact: true }).click();
    const card = fresh.locator(`[data-collection="${child.id}"]`); await card.waitFor();
    assert((await card.innerText()).includes(`1 van ${child.wordRound.exerciseIds.length} gedaan`));
    await fresh.reload(); await fresh.locator('[data-collection]').first().waitFor();
    while (!await card.isVisible() && await fresh.getByRole('button', { name: 'Meer opdrachten', exact: true }).isVisible()) await fresh.getByRole('button', { name: 'Meer opdrachten', exact: true }).click();
    await card.waitFor();
    assert.equal(await fresh.evaluate(() => localStorage.getItem('klink.word-round-preservation')), 'unchanged');

    // Original links continue to open the complete original collection and saved position.
    await fresh.goto(url({ ...selection('alfa-a'), collection: source.id }));
    await fresh.locator(`[data-exercise-id="${target.exerciseId}"]`).waitFor();
    const childSessionKey = groupSessionKey(`chapter:meet:${child.id}`, 'meet');
    const completeLegacy = JSON.stringify({ version: 1, exerciseId: target.exerciseId, done: true });
    await fresh.evaluate(({ oldSessionKey, childSessionKey, completeLegacy }) => { localStorage.removeItem(childSessionKey); localStorage.setItem(oldSessionKey, completeLegacy); }, { oldSessionKey, childSessionKey, completeLegacy });
    await fresh.goto(url({ ...selection('alfa-a'), collection: child.id }));
    await fresh.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
    await fresh.locator('.learner-main').getByRole('button', { name: 'Nog een keer', exact: true }).click();
    await fresh.locator(`[data-exercise-id="${target.exerciseId}"]`).waitFor();
    assert.equal(await fresh.evaluate(key => localStorage.getItem(key), oldSessionKey), completeLegacy);
    checks.push({ engine, nativeWordAudio: true, legacyPosition: true, legacyLink: true, sharedCompletion: true, reload: true, replay: true, oldStorageRetained: true });
    await fresh.close();
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({ base, checks, errors, physicalDevice: false }, null, 2));
console.log('PASS small word rounds browser: all 322 word-round entrances, four sizes, both engines, native audio, original progress, old links, reload and replay');
