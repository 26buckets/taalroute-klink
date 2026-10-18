import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { practiceChapters, chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const out = 'outputs/practice-chapters-20261017';
mkdirSync(out, { recursive: true });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__played = []; window.__fail = false;
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; }
    play() { if (window.__fail) return Promise.reject(Error('failed')); window.__played.push(this.src); this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 25); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const pass = text => { checks.push(text); console.log('PASS', text); };
async function open(chapter, activity, index = 0) {
  const collection = chapterCollections(activity)[index];
  await page.goto(`${base}/${chapterHash({ chapter, activity, collection: collection.id, level: collection.level })}`);
  await page.locator('[data-exercise-id]').waitFor();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'), collection.exercises[0].exerciseId);
  return collection;
}
try {
  await page.goto(`${base}/#learner/home`);
  await page.locator('.cp-home').waitFor();
  assert.equal(await page.locator('.cp-package-grid > button').count(), 15);
  assert.equal(await page.locator('.cp-home [data-chapter]').count(), 12);
  const before = await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1'));
  for (const chapter of practiceChapters) {
    await page.goto(`${base}/${chapterHash({ chapter: chapter.id, level: 'all' })}`);
    await page.locator(`[data-chapter-page="${chapter.id}"]`).waitFor();
    assert.equal(await page.locator('[data-chapter-activity]').count(), chapter.activities.length);
    const activity = chapter.activities.find(id => id !== 'learning-review');
    await page.locator(`[data-chapter-activity="${activity}"]`).click();
    await page.locator('[data-collection]').first().click();
    await page.locator('[data-exercise-id], .cp-word-worksheet').waitFor();
    assert.equal(await page.locator('.cp-lesson-list').count(), 0);
  }
  pass('All 12 chapters open real exercises directly, without a word lesson gate');
  await page.goto(`${base}/#learner/chapters/texts/texts`);
  await page.locator('[data-my-route]').getByRole('button', { name: 'A2', exact: true }).click();
  await page.locator('[data-collection]').first().click();
  const url = page.url(), id = await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
  await page.reload(); await page.locator('[data-exercise-id]').waitFor();
  assert.equal(await page.locator('[data-exercise-id]').getAttribute('data-exercise-id'), id);
  await page.getByRole('button', { name: 'Andere opdracht', exact: true }).first().click();
  assert.equal(await page.locator('[data-my-route]').getByRole('button', { name: 'A2', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.goBack(); await page.locator('[data-exercise-id]').waitFor(); assert.equal(page.url(), url);
  await page.goBack(); await page.locator('[data-collection]').first().waitFor();
  pass('Source-level selection, shareable deep links, reload and browser Back retain the correct content');

  const collection = await open('grammar', 'verb-choice');
  const exercise = collection.exercises[0];
  const choices = page.locator('.cp-choice-grid .cp-extended-option > button:first-child');
  const labels = await choices.allTextContents();
  await choices.nth(exercise.options.findIndex(option => !exercise.answer.correctOptionIds.includes(option.id))).click();
  assert.deepEqual(await choices.allTextContents(), labels);
  const forward = page.locator('.cp-exercise-feedback').getByRole('button', { name: 'Verder', exact: true });
  assert(await forward.isDisabled());
  await choices.nth(exercise.options.findIndex(option => exercise.answer.correctOptionIds.includes(option.id))).focus(); await page.keyboard.press('Enter');
  assert(await forward.isEnabled());
  assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), before);
  const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.notEqual(attempt.independentReading, true);
  pass('Existing answer/retry/keyboard player works, without completing the word route or inventing mastery');

  await open('sounds', 'sound-compare');
  await page.waitForFunction(() => document.querySelector('.cp-choice-grid button')?.disabled === false);
  await page.evaluate(() => { window.__fail = true; });
  await page.getByRole('button', { name: 'Luister naar beide woorden', exact: true }).click();
  await page.waitForTimeout(100);
  assert((await page.locator('.cp-exercise-browser').innerText()).match(/geluid|Luisteren lukt/i));
  await page.evaluate(() => { window.__fail = false; });
  await page.getByRole('button', { name: 'Luister naar beide woorden', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.cp-choice-grid button')?.disabled === false);
  assert(!(await page.evaluate(() => window.__played)).some(src => /instructions|instructie|hulp/.test(src)));
  pass('Word-contrast audio recovers from errors; withdrawn instruction audio stays off');

  await page.goto(`${base}/#learner/chapters/texts/texts`);
  const firstTwelve = await page.locator('[data-collection]').count(); assert.equal(firstTwelve, 12);
  await page.getByRole('button', { name: 'Meer opdrachten', exact: true }).click(); assert.equal(await page.locator('[data-collection]').count(), 24);
  pass('Long chapter libraries show a small first page, with more real content available');

  for (const width of [1366, 820, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 950 });
    await page.goto(`${base}/#learner/chapters`);
    await page.locator('[data-chapter]').first().waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const button of await page.locator('[data-chapter]').all()) {
      const box = await button.boundingBox(); assert(box.height >= 48 && box.width >= 48);
    }
    await page.screenshot({ path: `${out}/chapters-${width}.png` });
    await open('texts', 'text-question');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const next = page.locator('.cp-exercise-feedback').getByRole('button', { name: /^(Verder|Ronde afronden)$/ });
    await next.scrollIntoViewIfNeeded();
    assert(await next.evaluate(button => { const box = button.getBoundingClientRect(); const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2); return button === hit || button.contains(hit); }));
    await page.screenshot({ path: `${out}/chapter-exercise-${width}.png` });
  }
  await page.setViewportSize({ width: 390, height: 640 });
  const textCollections = chapterCollections('text-question');
  const longest = textCollections.reduce((best, item, index) => String(item.exercises[0].sourceText).length > String(textCollections[best].exercises[0].sourceText).length ? index : best, 0);
  await open('texts', 'text-question', longest);
  const finish = page.locator('.cp-exercise-feedback').getByRole('button', { name: 'Ronde afronden', exact: true });
  await finish.scrollIntoViewIfNeeded();
  assert(await finish.evaluate(button => { const box = button.getBoundingClientRect(); const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2); return button === hit || button.contains(hit); }), 'Long text must remain scrollable past the fixed mobile navigation');
  pass('Desktop/tablet/phone fit, 48px chapter targets, accessible Verder and unchanged player layout');
  await page.goto(`${base}/#learner/chapters/unknown/%ED`); await page.locator('[data-chapter-page="all"]').waitFor();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Lessen', exact: true }).click();
  assert.equal(await page.locator('.cp-package-grid > button').count(), 15);
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-${base.startsWith('https') ? 'live' : 'local'}.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), checks, errors }, null, 2));
} finally { await browser.close(); }
