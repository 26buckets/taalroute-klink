import assert from 'node:assert/strict';
import { openGroupActivity } from './browser-route-helpers.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { extendedExercises } from '../lib/extended-practice.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const errors = [], checks = [], out = 'outputs/extended-practice-review-20261017';
mkdirSync(out, { recursive: true });
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
async function open(mode, index = 0) {
  await page.goto(`${base}/#learner/home`); await page.reload();
  await page.locator('.cp-package-grid > button').nth(index).click();
  await openGroupActivity(page, mode);
  await page.locator('.is-mixed-round').waitFor();
  const id = await page.locator('.is-mixed-round').getAttribute('data-exercise-id');
  return extendedExercises(packs[index], mode).find(item => item.exerciseId === id);
}
const forward = () => page.locator('.cp-exercise-feedback').getByRole('button', { name: 'Verder', exact: true });
try {
  let item = await open('text-question');
  assert.equal(await page.locator('.cp-source-text p').first().innerText(), item.sourceBlocks[0].text);
  const choices = page.locator('.cp-choice-grid .cp-extended-option > button:first-child');
  const before = await choices.allTextContents();
  await choices.nth(item.options.findIndex(option => option.id !== '0')).click();
  assert(await forward().isDisabled()); assert.deepEqual(await choices.allTextContents(), before);
  await choices.nth(item.options.findIndex(option => option.id === '0')).focus(); await page.keyboard.press('Enter');
  assert(await forward().isEnabled()); await page.waitForTimeout(800);
  assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'), item.exerciseId, 'Evidence must remain readable');
  await page.screenshot({ path: `${out}/comprehension-desktop.png`, fullPage: true });
  pass('Source, question, stable retry choices, keyboard answer and deliberate continuation');
  await forward().click();
  item = await open('text-evidence');
  await page.locator('.cp-evidence-options button').nth(item.options.findIndex(option => item.answer.correctOptionIds.includes(option.id))).click();
  assert(await forward().isEnabled());
  pass('Evidence selection is answered against an exact existing source sentence');

  const grammarIndex = packs.findIndex(pack => extendedExercises(pack, 'verb-choice').length);
  item = await open('verb-choice', grammarIndex);
  assert.equal(await page.locator('.cp-source-text').count(), 0, 'No answer in the displayed source');
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  assert((await page.locator('.cp-source-text').innerText()).includes(item.sourceModel));
  await page.locator('.cp-choice-grid .cp-extended-option > button:first-child').nth(item.options.findIndex(option => item.answer.correctOptionIds.includes(option.id))).click();
  let attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(attempt.helpUsed, true); assert.notEqual(attempt.independentReading, true);
  pass('Grammar target has no answer leak; help is recorded, not independent performance');

  item = await open('sound-compare');
  await page.waitForFunction(() => document.querySelector('.cp-choice-grid button')?.disabled === false);
  let played = await page.evaluate(() => window.__played.slice(-2));
  assert.deepEqual(played, item.textBlocks.map(block => block.audio.src));
  await page.evaluate(() => { window.__played = []; });
  await page.getByRole('button', { name: 'Luister naar beide woorden', exact: true }).click();
  await page.waitForTimeout(160); played = await page.evaluate(() => window.__played);
  assert.deepEqual(played, item.textBlocks.map(block => block.audio.src));
  assert.equal(await page.locator('.cp-source-text').count(), 0);
  pass('Both real word recordings play in order on start and replay, without revealing spellings');
  await page.evaluate(() => { window.__fail = true; });
  await page.getByRole('button', { name: 'Luister naar beide woorden', exact: true }).click();
  await page.waitForTimeout(100);
  await page.evaluate(() => { window.__fail = false; });

  item = await open('sentence-build');
  const pause = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true });
  if (await pause.count()) await pause.click();
  await page.waitForFunction(() => document.querySelector('.cp-tile-bank button')?.disabled === false);
  for (const id of item.answer.targetTileIds) {
    const token = item.tiles.find(tile => tile.id === id).token;
    await page.locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
  }
  assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Goed'));
  pass('Full sentence construction uses the existing tap player');

  item = await open('functional-message');
  assert(await forward().isDisabled());
  await page.getByRole('textbox', { name: 'Jouw bericht', exact: true }).fill('Mijn eigen oefenbericht.');
  await page.getByRole('button', { name: 'Kijk na', exact: true }).click();
  for (const checkbox of await page.locator('.cp-writing-check input').all()) await checkbox.check();
  await page.locator('.cp-writing-check').getByRole('button', { name: 'Klaar', exact: true }).click();
  attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(attempt.assessment, 'participation'); assert(!attempt.answer.includes('Mijn eigen'));
  await open('functional-message');
  assert.equal(await page.getByRole('textbox', { name: 'Jouw bericht', exact: true }).inputValue(), 'Mijn eigen oefenbericht.');
  await page.getByRole('button', { name: 'Wis', exact: true }).click();
  assert.equal(await page.getByRole('textbox', { name: 'Jouw bericht', exact: true }).inputValue(), '');
  pass('Writing has criteria, same-tab recovery, explicit finish and deletion; no invented grading or remote delivery');
  await open('functional-form');
  assert(await page.getByRole('button', { name: 'Kijk na', exact: true }).isDisabled());
  await page.locator('.cp-sender-choice button').first().click();
  await page.getByRole('textbox', { name: 'Jouw bericht', exact: true }).fill('Een bericht.');
  assert(await page.getByRole('button', { name: 'Kijk na', exact: true }).isEnabled());
  pass('Message card uses separate sender and message fields, not a false broad form-writing claim');
  item = await open('dialogue-role');
  await page.getByRole('button', { name: 'Klaar', exact: true }).waitFor();
  assert(!(await page.locator('.cp-exercise-stage').innerText()).includes(item.roleModel.text));
  assert(await forward().isDisabled());
  await page.getByRole('button', { name: 'Klaar', exact: true }).click();
  assert(await forward().isEnabled());
  pass('Role turn plays the other speaker and hides the response model; microphone is optional');
  for (const [width, height] of [[768,1024],[390,844]]) {
    await page.setViewportSize({ width, height }); await open('text-question');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const bad = await page.locator('.cp-extended-option button').evaluateAll(nodes => nodes.some(node => node.getBoundingClientRect().height < 48)); assert(!bad);
    await page.screenshot({ path: `${out}/comprehension-${width}.png`, fullPage: true });
    await forward().scrollIntoViewIfNeeded();
    const hit = await forward().evaluate(button => { const box = button.getBoundingClientRect(); const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2); return button === target || button.contains(target); });
    assert(hit, 'Bottom navigation must not cover Verder after scrolling');
  }
  pass('Tablet/mobile fit, 48px answer targets and existing layout retained');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/browser-checks.json`, JSON.stringify({ checks, errors, note: 'Playback sequencing uses a test double; actual recordings are checked separately.' }, null, 2));
  await browser.close();
}
