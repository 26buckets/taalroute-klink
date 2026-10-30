import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { synonymCollections, synonymBank, synonymExercises } from '../lib/synonyms.ts';
import { chapterHash } from '../lib/practice-chapters.ts';
const { chromium, webkit } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18883';
const out = new URL('../../', import.meta.url);
const checks = [], errors = [];
const question = entry => entry.id;
const location = collection => chapterHash({ chapter: 'words', activity: 'synonyms', collection: collection.id, level: collection.level, help: 'practice' });

async function answer(page, exercise, wrongFirst = false) {
  await page.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
  assert.equal(await page.locator('.cp-synonym-word').innerText(), exercise.prompt.text);
  assert.equal(await page.locator('.cp-task-card img, .cp-task-card audio, .cp-task-card video').count(), 0);
  const options = page.locator('.cp-choice-grid .cp-extended-option > button');
  assert.equal(await options.count(), 4);
  assert.deepEqual(await options.allTextContents(), exercise.options.map(option => option.label));
  const correct = exercise.options.findIndex(option => exercise.answer.correctOptionIds.includes(option.id));
  if (wrongFirst) {
    await options.nth((correct + 1) % 4).click();
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes('iets anders'));
  }
  await options.nth(correct).click();
  await page.locator('.cp-exercise-feedback.right').waitFor();
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes(exercise.correctFeedback));
  assert(await options.evaluateAll(nodes => nodes.every(node => node.disabled)));
  await page.locator('.cp-exercise-feedback > button').click();
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/#learner/words');
  await page.locator('.word-library-page').waitFor();
  await page.evaluate(() => localStorage.setItem('klink.taalroute.savedWords.v1', JSON.stringify(['klink-woord-map'])));
  await page.reload();
  await page.locator('.word-library-page').waitFor();
  assert.equal(await page.getByRole('link', { name: 'Synoniemen', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Synoniemen', exact: true }).count(), 0);
  checks.push('Word library has no duplicate synonym entrance; saved word state retained.');
  for (const [level, expected] of [['a1', 30], ['a2', 85], ['b1', 210]]) {
    await page.goto(base + '/' + chapterHash({ chapter: 'words', activity: 'synonyms', level, help: 'practice' }));
    await page.locator('.cp-chapter-collection').first().waitFor();
    assert.equal(await page.getByRole('button', { name: level.toUpperCase(), exact: true }).getAttribute('aria-pressed'), 'true');
    const ids = synonymCollections.filter(collection => collection.levels.includes(level)).map(collection => collection.id);
    while (await page.getByRole('button', { name: 'Meer opdrachten', exact: true }).count()) await page.getByRole('button', { name: 'Meer opdrachten', exact: true }).click();
    assert.deepEqual((await page.locator('[data-collection]').evaluateAll(nodes => nodes.map(node => node.dataset.collection))).sort(), ids.sort());
    assert.equal(synonymBank.entries.filter(entry => entry.levels.includes(level)).length, expected);
  }
  checks.push('A1/A2/B1 show the correct cumulative collections and counts: 30/85/210.');
  for (const collection of synonymCollections) {
    await page.goto(base + '/' + location(collection));
    for (const [at, exercise] of collection.exercises.entries()) await answer(page, exercise, at === 0);
  }
  checks.push('All 210 real questions: target word, four text choices, wrong/right feedback, manual next step, no media.');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.savedWords.v1')));
  assert.deepEqual(saved, ['klink-woord-map']);
  const review = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.learning-review.v1')));
  assert.equal(Object.keys(review).filter(id => id.startsWith('synonyms:recall:')).length, 210);
  const first = synonymCollections[0], firstExercise = first.exercises[0];
  await page.goto(base + '/' + chapterHash({ chapter: 'repeat', activity: 'learning-review', collection: first.id, level: 'a1', help: 'practice' }));
  await page.locator('.cp-synonym-word').waitFor();
  assert.equal(await page.locator('.cp-synonym-word').innerText(), firstExercise.prompt.text);
  checks.push('Existing saved words remain unchanged. Wrong-first questions are due in the existing review queue.');
  const pending = synonymCollections.find(collection => collection.exercises.length > 3);
  await page.goto(base + '/' + location(pending));
  await page.locator('.honest-empty').getByRole('button', { name: 'Nog een keer', exact: true }).click();
  await page.locator('.cp-synonym-word').waitFor();
  const mixed = synonymExercises(pending.pack, 'synonyms', 2);
  await answer(page, mixed[0]);
  await page.locator(`[data-exercise-id="${mixed[1].exerciseId}"]`).waitFor();
  await page.reload();
  await page.locator(`[data-exercise-id="${mixed[1].exerciseId}"]`).waitFor();
  checks.push('A partially completed list resumes at the same question after reload.');
  await fs.mkdir(new URL('../outputs/synoniemen/', out), { recursive: true });
  await page.screenshot({ path: new URL('../outputs/synoniemen/synoniemen-desktop.png', out).pathname, fullPage: true });
  for (const width of [390, 320]) {
    const small = await browser.newPage({ viewport: { width, height: 844 } });
    const length = entry => width === 390 ? entry.word.length : Math.max(...entry.options.map(option => option.length));
    const longest = synonymBank.entries.toSorted((a, b) => length(b) - length(a))[0];
    const collection = synonymCollections.find(collection => collection.exercises.some(exercise => exercise.exerciseId === question(longest)));
    await small.goto(base + '/' + location(collection));
    await small.locator('.cp-synonym-word').waitFor();
    for (const exercise of collection.exercises) {
      if (exercise.exerciseId === longest.id) break;
      await answer(small, exercise);
    }
    await small.locator(`[data-exercise-id="${longest.id}"]`).waitFor();
    const heading = await small.locator('.cp-exercise-record-head h3').boundingBox();
    const header = await small.locator('.cp-chapters > .cp-context-header').boundingBox();
    assert(heading.y >= header.y + header.height - 1, 'The instruction stays below the fixed page header after advancing.');
    assert(await small.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    const boxes = await small.locator('.cp-choice-grid .cp-extended-option > button').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { width: r.width, height: r.height }; }));
    assert(boxes.every(box => box.width >= 44 && box.height >= 44));
    assert(await small.locator('.cp-synonym-word, .cp-choice-grid .cp-extended-option > button').evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth + 1)));
    if (width === 390) await small.screenshot({ path: new URL('../outputs/synoniemen/synoniemen-mobiel.png', out).pathname, fullPage: true });
    await small.close();
  }
  checks.push('390px/320px: no horizontal overflow, four readable answer cards, touch targets at least 44px.');
  assert.deepEqual(errors, []);
} finally { await browser.close(); }

const second = await webkit.launch({ headless: true });
try {
  const page = await second.newPage({ viewport: { width: 390, height: 844 } });
  page.on('pageerror', error => errors.push(error.message));
  for (const level of ['a1', 'a2', 'b1']) {
    const collection = synonymCollections.find(collection => collection.level === level);
    await page.goto(base + '/' + location(collection));
    await answer(page, collection.exercises[0], true);
  }
  checks.push('WebKit mobile: A1/A2/B1 each complete a real wrong/right interaction.');
  assert.deepEqual(errors, []);
} finally { await second.close(); }
await fs.writeFile(new URL('synonyms-browser-checks.json', out), JSON.stringify({ checks, errors }, null, 2));
console.log(JSON.stringify({ passed: checks.length, questions: 210, engines: ['Chromium', 'WebKit'], checks }));
