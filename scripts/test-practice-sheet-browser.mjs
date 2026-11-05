import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections, chapterHash, practiceChapters } from '../lib/practice-chapters.ts';
const engines = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = process.env.KLINK_SHEET_OUTPUT || 'outputs/practice-sheet-20261018';
mkdirSync(out, { recursive: true });
const browser = await engines[process.env.KLINK_TEST_ENGINE || 'chromium'].launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__played = []; window.__fail = false; window.__duration = 150;
  window.Audio = class extends EventTarget {
    dataset = {};
    play() {
      window.__played.push(this.src);
      if (window.__fail) return Promise.reject(Error('Audio failed'));
      this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), window.__duration);
      return Promise.resolve();
    }
    pause() { clearTimeout(this.timer); }
  };
});
const pass = text => { checks.push(text); console.log('PASS', text); };
async function open(activity, collection = chapterCollections(activity)[0]) {
  const chapter = practiceChapters.find(c => c.activities.includes(activity)).id;
  await page.goto(`${base}/#learner/chapters`);
  await page.locator('[data-chapter-page="all"]').waitFor();
  await page.goto(`${base}/${chapterHash({ chapter, activity, collection: collection.id, level: collection.level })}`);
  await page.locator('.cp-exercise-browser').waitFor();
  await page.getByRole('button', { name: 'Op één blad', exact: true }).focus();
  await page.evaluate(() => { window.__played = []; });
  await page.keyboard.press('Enter');
  await page.locator('.cp-practice-sheet').waitFor();
  assert.equal(await page.locator('[data-sheet-exercise]').count(), collection.exercises.length);
  assert.equal(await page.locator('.cp-exercise-browser').count(), 0);
  return collection;
}
const row = index => page.locator('[data-sheet-exercise]').nth(index);
try {
  const c = await open('meet');
  const wordRoute = await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1'));
  assert.equal(await page.evaluate(() => window.__played.length), 0, 'No simultaneous automatic audio');
  await row(0).locator('[data-practice-listen]').click();
  await row(0).getByText('Beluisterd', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-sheet-exercise]').count(), c.exercises.length);
  const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(attempt.assessment, 'participation'); assert.equal(attempt.independentReading, false);
  await page.getByRole('button', { name: 'Eén voor één', exact: true }).click();
  await page.locator('.cp-exercise-browser').waitFor();
  await page.getByRole('button', { name: 'Op één blad', exact: true }).click();
  await row(0).getByText('Beluisterd', { exact: true }).waitFor();
  pass('Every eligible word stays on one page; audio is selected, not automatic; switching preserves sheet state without a mastery claim');

  const dictation = await open('dictation');
  const first = row(0), second = row(1);
  assert(await first.locator('input').isDisabled());
  await page.evaluate(() => { window.__fail = true; });
  await first.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await first.getByText('Luisteren lukt niet. Tik opnieuw.').waitFor();
  assert(await first.locator('input').isDisabled());
  await page.evaluate(() => { window.__fail = false; window.__duration = 1500; });
  await first.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await second.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await page.waitForFunction(() => !document.querySelectorAll('.cp-sheet-item input')[1].disabled);
  assert(await first.locator('input').isDisabled(), 'Interrupted audio does not unlock another word');
  await page.evaluate(() => { window.__duration = 150; });
  await first.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.cp-sheet-item input').disabled);
  await first.locator('input').fill('zzzz'); await first.locator('input').press('Enter');
  assert(await first.evaluate(el => el.classList.contains('wrong')));
  await first.locator('input').fill(dictation.exercises[0].fields[0].acceptedAnswers[0]);
  await first.locator('input').press('Enter');
  await first.getByText('Goed', { exact: true }).waitFor();
  assert.equal(await page.locator('[data-sheet-exercise]').count(), dictation.exercises.length);
  pass('Each dictation row has its own audio gate; errors, interruption, retry, typing and keyboard submission work without moving other words');

  const build = await open('build-model');
  for (const id of build.exercises[0].answer.targetTileIds) {
    const tile = build.exercises[0].tiles.find(t => t.id === id);
    await row(0).locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${tile.token}$`) }).first().click();
  }
  await row(0).getByText('Goed', { exact: true }).waitFor();
  for (const id of build.exercises[1].answer.targetTileIds) {
    const tile = build.exercises[1].tiles.find(t => t.id === id);
    const source = row(1).locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${tile.token}$`) }).first();
    const index = build.exercises[1].answer.targetTileIds.indexOf(id);
    await source.dragTo(row(1).locator('.cp-build-slots button').nth(index));
  }
  await row(1).getByText('Goed', { exact: true }).waitFor();
  pass('Existing letter-building player works per row, with tap alternative and no forced next-word screen');

  for (const activity of ['same-word', 'listen', 'hear-word', 'read', 'missing']) {
    const collection = await open(activity);
    const exercise = collection.exercises[0];
    if (exercise.requiresAudio) {
      await row(0).getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
      await page.waitForFunction(() => !document.querySelector('.cp-sheet-item .cp-choice-grid button').disabled);
    }
    const options = row(0).locator('.cp-choice-grid button');
    const labels = await options.allTextContents();
    const incorrect = exercise.options.findIndex(o => !exercise.answer.correctOptionIds.includes(o.id));
    if (incorrect >= 0) { await options.nth(incorrect).click(); assert.deepEqual(await options.allTextContents(), labels); }
    await options.nth(exercise.options.findIndex(o => exercise.answer.correctOptionIds.includes(o.id))).click();
    await row(0).getByText('Goed', { exact: true }).waitFor();
  }
  pass('Word/image/letter choices reuse the existing targets and distractors; errors keep all positions');

  for (const [width, height] of [[1366, 950], [820, 950], [390, 844], [320, 640], [844, 390]]) {
    await page.setViewportSize({ width, height });
    for (const activity of ['meet', 'build-model', 'build', 'copy', 'dictation', 'read']) {
      await open(activity);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${activity}/${width}: overflow`);
      const done = page.locator('.cp-practice-sheet > footer').getByRole('button', { name: 'Klaar', exact: true });
      await done.evaluate(el => el.scrollIntoView({block:'center',behavior:'instant'}));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.locator('.toast-message').waitFor({state:'hidden'});
      const footer = await done.evaluate(el => { const r = el.getBoundingClientRect(), hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { width: r.width, height: r.height, reachable: el.contains(hit), coveredBy: el.contains(hit) ? null : hit?.className }; });
      assert(footer.width >= 44 && footer.height >= 44 && footer.reachable, `${activity}/${width}: reachable footer ${JSON.stringify(footer)}`);
    }
    await open('meet');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${out}/sheet-${width}.png`, fullPage: true });
  }
  const largest = chapterCollections('meet').reduce((a, b) => a.exercises.length > b.exercises.length ? a : b);
  await open('meet', largest);
  assert.equal(await page.locator('[data-sheet-exercise]').count(), largest.exercises.length, 'No arbitrary four-word cutoff');
  assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), wordRoute);
  assert(!(await page.evaluate(() => window.__played)).some(src => /instructions|instructie|hulp/.test(src)));
  pass(`Desktop/tablet/phone/landscape fit; all ${largest.exercises.length} eligible words in the largest collection appear on one scrollable page`);
  await page.goto(`${base}/#learner/home`);
  await page.getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-package-grid > button').first().click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click(); await page.locator('.cp-step-scope select').selectOption('');
  await page.locator('[data-activity="meet"]').click();
  await page.getByRole('button', { name: 'Op één blad', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.locator('.cp-practice-sheet').waitFor();
  assert.equal(await page.locator('[data-sheet-exercise]').count(), 6);
  pass('The same sheet is accessible from the existing lesson-group practice page, including keyboard selection');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-${base.startsWith('https') ? 'live' : 'local'}.json`, JSON.stringify({ base, checkedAt: new Date().toISOString(), checks, errors }, null, 2));
} finally { await browser.close(); }
