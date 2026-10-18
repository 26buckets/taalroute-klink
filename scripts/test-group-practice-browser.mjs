import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { groupActivities, groupExercises, groupSessionKey } from '../lib/group-practice.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const errors = [], checks = [];
const out = 'outputs/group-practice-review-20261017'; mkdirSync(out, { recursive: true });
page.on('pageerror', error => errors.push(error.message));
const pass = message => { checks.push(message); console.log('PASS', message); };
await page.addInitScript(() => {
  window.__audioFail = false; window.__played = [];
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() { if (window.__audioFail) return Promise.reject(Error('unavailable')); window.__played.push(this.src); this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 40); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
async function home(index = 0) {
  await page.goto(base + '/#learner/home'); await page.reload();
  await page.locator('.cp-package-grid > button').nth(index).click();
}
async function hub() { await page.locator('.cp-tabs').getByRole('button', { name: 'Oefeningen', exact: true }).click(); await page.locator('[data-group-practice]').waitFor(); }
async function open(mode) { await hub(); await page.locator(`[data-activity="${mode}"]`).click(); }
async function back() { await page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first().click(); }
async function pause() { const button = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true }); if (await button.count()) await button.click(); }
async function current(mode, pack = packs[0]) { const id = await page.locator('.is-mixed-round').getAttribute('data-exercise-id'); return groupExercises(pack, mode).find(item => item.exerciseId === id); }
async function ready(selector) { await page.waitForFunction(selector => [...document.querySelectorAll(selector)].some(button => !button.disabled), selector); }
async function next() { await page.locator('.cp-exercise-feedback > button').click(); }
try {
  await home();
  assert.equal(await page.locator('.cp-word-grid > article').count(), 6);
  await page.locator('.cp-content .cp-panel-heading').getByRole('button', { name: 'Oefeningen', exact: true }).click();
  assert.equal(await page.locator('[data-group-practice] select').count(), 0);
  assert.equal(await page.locator('[data-activity]').count(), groupActivities.filter(activity => activity.id !== 'learning-review' && groupExercises(packs[0], activity.id).length).length);
  await page.screenshot({ path: `${out}/exercise-hub-desktop.png`, fullPage: true });
  pass('Words first; all first-group activities available without a dropdown');

  const preserved = JSON.stringify({ completed: [packs[0].lessons[0].id] });
  await page.evaluate(value => localStorage.setItem('klink.taalroute.route.v1', value), preserved);
  await page.locator('[data-activity="build-model"]').click(); await pause();
  let item = await current('build-model');
  const tiles = new Map(item.tiles.map(tile => [tile.id, tile.token]));
  // Drag one tile, complete with keyboard: both pathways use the exact same answer state.
  await page.locator('.cp-tile-bank button').filter({ hasText: new RegExp(`^${tiles.get(item.answer.targetTileIds[0])}$`) }).first().dragTo(page.locator('.cp-build-slots button').first());
  assert.equal(await page.locator('.cp-build-slots button').first().innerText(), tiles.get(item.answer.targetTileIds[0]));
  for (const id of item.answer.targetTileIds.slice(1)) {
    const button = page.locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${tiles.get(id)}$`) }).first(); await button.focus(); await page.keyboard.press('Enter');
  }
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Goed'));
  await next(); const second = await current('build-model');
  await back(); await page.locator('[data-activity="build-model"]').click();
  assert.equal((await current('build-model')).exerciseId, second.exerciseId);
  assert.equal(await page.evaluate(() => localStorage.getItem('klink.taalroute.route.v1')), preserved);
  pass('Drag and keyboard construction, independent resume and preserved lesson data');

  await back(); await page.locator('[data-activity="worksheet"]').click();
  assert.equal(await page.locator('.cp-worksheet-row').count(), 4);
  await page.screenshot({ path: `${out}/worksheet-desktop.png`, fullPage: true });
  const sheet = groupExercises(packs[0], 'worksheet');
  for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
    const row = page.locator('.cp-worksheet-row').nth(rowIndex), ex = sheet[rowIndex];
    for (const id of ex.answer.targetTileIds) await row.locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${ex.tiles.find(t => t.id === id).token}$`) }).first().click();
    assert((await row.locator('output').innerText()).includes('Goed'));
  }
  await page.locator('.cp-word-worksheet > button').click();
  assert.equal(await page.locator('.cp-worksheet-row').count(), 2);
  pass('Multiword worksheet covers all six words in two manageable pages');

  await back(); await page.locator('[data-activity="word-bingo"]').click(); await pause();
  item = await current('word-bingo'); await ready('.cp-board-grid button');
  const initialBoard = await page.locator('.cp-board-grid').innerText();
  const wrong = item.cells.findIndex(cell => cell.cellId !== item.wordId);
  await page.locator('.cp-board-grid button').nth(wrong).click();
  assert.equal(await page.locator('.cp-board-grid').innerText(), initialBoard);
  let turns = 0;
  while (await page.locator('.cp-board-grid').count()) {
    item = await current('word-bingo'); await ready('.cp-board-grid button');
    assert.equal(await page.locator('.cp-preview-support').count(), 0);
    await page.locator('.cp-board-grid button').nth(item.cells.findIndex(cell => cell.cellId === item.wordId)).click();
    await next(); if (++turns > 6) throw Error('Unbounded bingo');
  }
  assert.equal(turns, 6);
  pass('Bingo retains board after error and visits every target without revealing the answer');

  await back(); await page.locator('[data-activity="image-bingo"]').click(); await pause();
  await ready('.cp-board-grid button'); assert(await page.locator('.cp-board-grid img').count() >= 2);
  await back(); await page.evaluate(() => { window.__audioFail = true; });
  await page.locator('[data-activity="dictation"]').click(); await page.locator('.cp-audio-retry').waitFor();
  assert(await page.locator('.cp-text-entry input').isDisabled());
  await page.evaluate(() => { window.__audioFail = false; }); await page.getByRole('button', { name: 'Opnieuw luisteren', exact: true }).click(); await ready('.cp-text-entry input');
  pass('Unavailable word audio blocks dictation; retry recovers');

  await back(); await page.locator('[data-activity="find-sentence"]').click(); await pause(); await ready('.cp-choice-grid button');
  item = await current('find-sentence');
  await page.locator('.cp-choice-grid button').nth(item.options.findIndex(option => option.id === item.contextId)).click();
  const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(attempt.independentReading, false); assert.equal(attempt.access, 'supported-listening');
  pass('Find sentence runs on existing source sentences and never claims independent comprehension');

  await back(); await page.locator('[data-activity="hear-match"]').click(); await pause();
  item = await current('hear-match');
  const sourceButtons = page.locator('.cp-match-board > div').first().locator('button');
  assert(!(await sourceButtons.first().innerText()).includes(packs[0].words[0].word));
  assert(await page.locator('.cp-match-board > div').last().locator('button').first().isDisabled());
  for (let index = 0; index < item.sources.length; index++) {
    await sourceButtons.nth(index).click(); await ready('.cp-match-board > div:last-child button');
    const targetIndex = item.targets.findIndex(target => target.id === item.answer.mapping[item.sources[index].id]);
    await page.locator('.cp-match-board > div').last().locator('button').nth(targetIndex).click();
  }
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Goed'));
  pass('Audio-to-word matching waits for each sound and has a tap alternative');

  await back(); await page.locator('[data-activity="worksheet-heard"]').click();
  const heardRow = page.locator('.cp-worksheet-row').first();
  assert.equal(await heardRow.locator('.cp-example-listen').count(), 0);
  assert(await heardRow.locator('.cp-tile-bank button').first().isDisabled());
  await heardRow.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await ready('.cp-worksheet-row:first-child .cp-tile-bank button');
  const heardExercise = groupExercises(packs[0], 'worksheet-heard')[0];
  await heardRow.locator('.cp-build-slots button').last().click();
  const lastToken = heardExercise.tiles.find(tile => tile.id === heardExercise.answer.targetTileIds.at(-1)).token;
  await heardRow.locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${lastToken}$`) }).first().click();
  assert.equal(await heardRow.locator('.cp-build-slots button').last().innerText(), lastToken);
  pass('Heard worksheet gates each row on its own audio; tapping can choose a destination');

  await back(); await page.locator('[data-activity="paper-dictation"]').click(); await pause();
  item = await current('paper-dictation');
  assert.equal(await page.locator('.cp-paper-model').count(), 0);
  await ready('.cp-task-card > button');
  await page.getByRole('button', { name: 'Vergelijk', exact: true }).click();
  assert.equal(await page.locator('.cp-paper-model').innerText(), item.target);
  await page.getByRole('button', { name: 'Klaar', exact: true }).click();
  const paper = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(paper.assessment, 'participation');
  pass('Paper dictation hides its model until comparison, without a handwriting mastery claim');

  await back(); await page.locator('[data-activity="read-series"]').click();
  assert.equal(await page.getByRole('button', { name: 'Eigen tempo', exact: true }).getAttribute('aria-pressed'), 'true');
  const start = await current('read-series');
  await page.getByRole('button', { name: '6 seconden', exact: true }).click();
  await page.waitForFunction(id => document.querySelector('.is-mixed-round')?.getAttribute('data-exercise-id') !== id, start.exerciseId, { timeout: 10000 });
  await page.getByRole('button', { name: 'Eigen tempo', exact: true }).click();
  const visibleId = (await current('read-series')).exerciseId;
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.getByRole('button', { name: '6 seconden', exact: true }).click();
  await page.waitForTimeout(6200);
  assert.equal((await current('read-series')).exerciseId, visibleId, 'Hidden tab must not consume reading turns');
  await page.getByRole('button', { name: 'Eigen tempo', exact: true }).click();
  await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  pass('Reading pace is optional, can be stopped and never advances in a hidden tab');

  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 }); await back();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Hub overflow ${width}`);
    assert(await page.locator('[data-activity]').evaluateAll(buttons => buttons.every(button => button.getBoundingClientRect().height >= 48)));
    await page.locator('[data-activity="worksheet"]').click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Worksheet overflow ${width}`);
    if (width === 390) await page.screenshot({ path: `${out}/worksheet-mobile.png`, fullPage: true });
  }
  pass('Desktop, tablet and 390/320px layouts fit with accessible targets');

  for (let index = 0; index < packs.length; index++) {
    await home(index); await hub();
    const expected = groupActivities.filter(activity => activity.id !== 'learning-review' && groupExercises(packs[index], activity.id).length).length;
    assert.equal(await page.locator('[data-activity]').count(), expected, packs[index].id);
  }
  pass('All 15 existing word groups expose their own eligible activity sets');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-checks.json`, JSON.stringify({ checkedAt: new Date().toISOString(), checks, errors, audio: 'Playback stub; real media checked separately. No human pronunciation review claimed.' }, null, 2));
} finally { await browser.close(); }
