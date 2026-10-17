import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { createMixedRound, mixedStorageKey } from '../lib/mixed-practice.ts';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__started = [];
  const play = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play').value;
  HTMLMediaElement.prototype.play = function (...args) {
    this.addEventListener('playing', () => window.__started.push(this.src), { once: true });
    return play.apply(this, args);
  };
});
async function current(mode) {
  const session = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), mixedStorageKey(packs[0].id, mode));
  const id = await page.locator('.is-mixed-round').getAttribute('data-exercise-id');
  return createMixedRound(packs[0], mode, session.seed).find(item => item.exerciseId === id);
}
async function heard(src) {
  await page.waitForFunction(src => window.__started.some(path => path.endsWith(src)), src, { timeout: 20000 });
}
try {
  await page.goto(`${base}/#learner/home`);
  await page.locator('.cp-package-grid button').first().click();
  await page.getByRole('button', { name: 'Alles oefenen', exact: true }).click();
  const listen = await current('listen');
  await heard(listen.instructionAudio.src);
  await heard(listen.prompt.audio.src);
  await page.waitForFunction(() => !document.querySelector('.cp-choice-grid button')?.disabled);
  checks.push('Existing instruction and word files actually play in mixed listening');
  await page.evaluate(() => { window.__started = []; });
  await page.getByRole('button', { name: 'Lees en kies', exact: true }).click();
  const read = await current('read');
  await heard(read.instructionAudio.src);
  await page.waitForFunction(() => !document.querySelector('.cp-choice-grid button')?.disabled);
  assert.equal(await page.evaluate(src => window.__started.some(path => path.endsWith(src)), read.prompt.audio.src), false);
  await page.locator('.cp-example-listen').click();
  await heard(read.prompt.audio.src);
  checks.push('Reading plays the instruction only; target recording plays on explicit help');
  await page.getByRole('button', { name: 'Koppel', exact: true }).click();
  const match = await current('match');
  await heard(match.instructionAudio.src);
  await page.waitForFunction(() => !document.querySelector('.cp-match-board button')?.disabled);
  await page.locator('.cp-match-board > div').first().locator('button').first().click();
  await heard(match.sources[0].audio.src);
  checks.push('Pairing uses the existing spoken word on selection');
  for (const [width, height, name] of [[1366, 950, 'desktop'], [390, 844, 'mobile']]) {
    await page.setViewportSize({ width, height });
    await page.locator('.cp-match-board img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.waitForTimeout(250);
    if (name === 'mobile') await page.locator('.cp-exercise-feedback > button').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `outputs/mixed-practice-20261017/match-${name}-final.png` });
  }
  await page.getByRole('button', { name: 'Maak het woord', exact: true }).click();
  const build = await current('build');
  await heard(build.instructionAudio.src);
  await heard(build.prompt.audio.src);
  await page.waitForFunction(() => !document.querySelector('.cp-tile-bank button')?.disabled);
  checks.push('Existing instruction and word recordings unlock mixed word building');
  assert.deepEqual(errors, []);
} finally {
  mkdirSync('outputs/mixed-practice-20261017', { recursive: true });
  writeFileSync('outputs/mixed-practice-20261017/real-audio-check.json', JSON.stringify({ base, checks, errors }, null, 2));
  await browser.close();
}
console.log(checks.map(check => `PASS ${check}`).join('\n'));
