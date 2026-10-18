import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { createMixedRound, mixedStorageKey, withMixedRetries } from '../lib/mixed-practice.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const errors = [], checks = [];
const pass = label => { checks.push(label); console.log('PASS', label); };
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__played = []; window.__audioFail = false;
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() {
      if (window.__audioFail) return Promise.reject(new Error('test unavailable'));
      window.__played.push(this.src); this.paused = false;
      this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 40);
      return Promise.resolve();
    }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
async function open(pack = packs[0]) {
  await page.goto(base + '/#learner/home'); await page.reload();
  await page.locator('.cp-package-grid > button').nth(packs.indexOf(pack)).click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click();
  await page.getByRole('button', { name: 'Woordenmix', exact: true }).click();
  await page.locator('.is-mixed-round, .cp-mixed-complete').waitFor();
}
async function exercise(pack, mode) {
  const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), mixedStorageKey(pack.id, mode));
  const records = withMixedRetries(createMixedRound(pack, mode, session.seed), session.retries);
  const id = await page.locator('.is-mixed-round').getAttribute('data-exercise-id');
  return records.find(record => record.exerciseId === id);
}
async function ready() { await page.waitForFunction(() => !document.querySelector('.cp-choice-grid button')?.disabled); }
async function pause() {
  const button = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true });
  if (await button.count()) await button.click();
}
async function answerChoice(item) {
  await ready();
  await page.locator('.cp-choice-grid button').nth(item.options.findIndex(option => option.id === item.answer.correctOptionIds[0])).click();
}
async function next() { await page.locator('.cp-exercise-feedback > button').click(); }
try {
  await open();
  assert.equal(await page.locator('.cp-mixed-modes button').count(), 4);
  assert(await page.getByRole('navigation', { name: 'Cursistnavigatie' }).isVisible());
  const unchanged = JSON.stringify({ completed: [packs[0].lessons[0].id], position: { packageId: packs[0].id, lessonId: packs[0].lessons[1].id, exerciseId: packs[0].lessons[1].guidedExerciseIds[0] } });
  await page.evaluate(value => localStorage.setItem('klink.taalroute.route.v1', value), unchanged);
  await pause();
  const first = await exercise(packs[0], 'listen'); await ready();
  const choices = page.locator('.cp-choice-grid button');
  const initialOrder = await choices.locator('img').evaluateAll(images => images.map(image => image.src));
  await choices.nth(first.options.findIndex(option => option.id !== first.wordId)).click();
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Probeer opnieuw'));
  assert.deepEqual(await choices.locator('img').evaluateAll(images => images.map(image => image.src)), initialOrder);
  await answerChoice(first); await next();
  const second = await exercise(packs[0], 'listen'); assert.notEqual(first.wordId, second.wordId);
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).exerciseId, mixedStorageKey(packs[0].id, 'listen')), second.exerciseId, 'The visible exercise is saved before leaving immediately');
  await open();
  assert.equal((await exercise(packs[0], 'listen')).exerciseId, second.exerciseId);
  await pause();
  let count = 1;
  while (await page.locator('.is-mixed-round').count()) {
    const item = await exercise(packs[0], 'listen'); await answerChoice(item); await next(); count++;
    if (count > 8) throw Error('Unbounded repetition');
  }
  assert.equal(count, 7, 'Six targets plus one later retry');
  assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), unchanged);
  pass('All six targets, bounded retry, stable choices, independent resume and unchanged lesson progress');

  await page.evaluate(() => { window.__played = []; });
  await page.getByRole('button', { name: 'Lees en kies', exact: true }).click();
  await pause();
  const read = await exercise(packs[0], 'read');
  await page.waitForTimeout(150);
  assert.equal(await page.evaluate(src => window.__played.filter(path => path === src).length, read.prompt.audio.src), 0, 'Reading mode must not pronounce the target automatically after reload');
  await answerChoice(read); await next();
  const unassisted = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(unassisted.independentReading, true); assert.equal(unassisted.support, 'none');
  const helped = await exercise(packs[0], 'read');
  await page.locator('.cp-example-listen').click(); await page.waitForTimeout(80);
  await answerChoice(helped);
  const assisted = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(assisted.helpUsed, true); assert.equal(assisted.independentReading, false);
  pass('Reading target is visible without automatic word audio; requested audio is recorded as help');

  await page.getByRole('button', { name: 'Koppel', exact: true }).click(); await pause();
  const match = await exercise(packs[0], 'match');
  const sources = page.locator('.cp-match-board > div').nth(0).locator('button');
  const targets = page.locator('.cp-match-board > div').nth(1).locator('button');
  assert.equal(await sources.count(), 3);
  await sources.first().focus(); await page.keyboard.press('Enter');
  await targets.nth(match.targets.findIndex(target => target.id !== match.answer.mapping[match.sources[0].id])).click();
  assert.equal(await sources.first().getAttribute('aria-pressed'), 'true');
  for (let i = 0; i < match.sources.length; i++) {
    await sources.nth(i).focus(); await page.keyboard.press('Enter');
    await targets.nth(match.targets.findIndex(target => target.id === match.answer.mapping[match.sources[i].id])).click();
    assert(await sources.nth(i).isDisabled());
  }
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Goed'));
  pass('Three words and photos share a board; keyboard/tap pairing and wrong-answer recovery preserve correct pairs');

  await page.getByRole('button', { name: 'Maak het woord', exact: true }).click(); await pause();
  const build = await exercise(packs[0], 'build');
  assert.equal(await page.locator('.cp-example-listen').count(), 0);
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.cp-tile-bank button')?.disabled);
  for (const id of build.answer.targetTileIds) await page.locator('.cp-tile-bank button').nth(build.tiles.findIndex(tile => tile.id === id)).click();
  const built = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(built.helpUsed, true);
  pass('Existing word-building player works with optional, explicitly recorded help');

  for (const label of ['Luister en kies', 'Lees en kies', 'Koppel', 'Maak het woord']) {
    await page.getByRole('button', { name: label, exact: true }).click();
    if (await page.locator('.cp-mixed-complete').count()) await page.getByRole('button', { name: 'Nog een ronde', exact: true }).click();
    for (const [width,height] of [[1366,950],[768,950],[390,844],[320,568],[667,375]]) {
      await page.setViewportSize({width,height});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label} overflow ${width}`);
      for (const button of await page.locator('.cp-mixed-modes button').all()) {
        assert(await button.evaluate(el => el.getBoundingClientRect().height >= 48));
      }
      await page.locator('.cp-exercise-feedback > button').scrollIntoViewIfNeeded();
  assert(await page.locator('.cp-exercise-feedback output').evaluate(el => el.getBoundingClientRect().width >= 100), `${label} feedback remains readable ${width}`);
      assert(await page.locator('.cp-exercise-feedback > button').evaluate(el => {
        const rect = el.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        return rect.height >= 48 && (hit === el || el.contains(hit));
      }), `${label} footer reachable ${width}`);
    }
  }
  pass('Four modes retain readable controls, no horizontal overflow and reachable feedback on five viewport sizes');
  await page.setViewportSize({width:1366,height:950});
  for (const pack of packs.slice(1)) { await open(pack); assert.equal(await page.locator('.cp-mixed-modes button').count(), 4); }
  pass('Same mixed page is reachable in all fifteen original sections');

  await page.evaluate(() => { window.__audioFail = true; });
  await page.getByRole('button', { name: 'Maak het woord', exact: true }).click();
  await page.locator('.cp-audio-retry').waitFor();
  assert(await page.locator('.cp-tile-bank button').first().isDisabled());
  await page.evaluate(() => { window.__audioFail = false; });
  await page.getByRole('button', { name: 'Opnieuw luisteren', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.cp-tile-bank button')?.disabled);
  pass('Audio failure blocks guessing and recovers with the existing retry control');

  await page.evaluate(completed => localStorage.setItem('klink.taalroute.route.v1', JSON.stringify({completed})), [packs[0].lessons[0].id,packs[1].lessons[0].id]);
  await page.reload();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Herhalen', exact: true }).click();
  await page.getByRole('button', { name: 'Woordenmix', exact: true }).click();
  assert((await page.locator('.is-mixed-round').getAttribute('data-exercise-id')).startsWith('mixed-review:mixed:'));
  pass('Existing Herhalen screen adds a prepared cross-section mix without removing saved words');

  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw Error('blocked'); }; Storage.prototype.setItem = () => { throw Error('blocked'); }; });
  await open();
  assert.equal(await page.locator('.cp-mixed-modes button').count(), 4);
  pass('Blocked storage does not prevent mixed practice');
  assert.deepEqual(errors, []);
} finally {
  mkdirSync('outputs/mixed-practice-20261017', {recursive:true});
  writeFileSync('outputs/mixed-practice-20261017/browser-check.json', JSON.stringify({base,checks,errors},null,2));
  await browser.close();
}
