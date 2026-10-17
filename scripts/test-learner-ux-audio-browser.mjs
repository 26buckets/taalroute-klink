import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__started = [];
  const original = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play').value;
  HTMLMediaElement.prototype.play = function (...args) {
    this.addEventListener('playing', () => window.__started.push(this.src), { once: true });
    return original.apply(this, args);
  };
});
try {
  await page.goto(`${base}/#learner/home`);
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Lessen', exact: true }).click();
  await page.locator('.cp-package-grid > button').nth(2).click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefeningen', exact: true }).click();
  const id = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
  const model = packs[2].exercises.find(item => item.exerciseId === id);
  await page.waitForFunction(src => window.__started.some(path => path.endsWith(src)), model.prompt.audio.src, { timeout: 20000 });
  checks.push('Free-practice model starts the actual instruction and word recording automatically');
  await page.locator('.cp-exercise-workspace aside button').filter({ hasText: 'Het woord schrijven' }).click();
  const writingId = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
  const writing = packs[2].exercises.find(item => item.exerciseId === writingId);
  await page.waitForFunction(src => window.__started.some(path => path.endsWith(src)), writing.instructionAudio.src);
  await page.evaluate(() => { window.__started = []; });
  await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await page.waitForFunction(src => window.__started.some(path => path.endsWith(src)), writing.prompt.audio.src, { timeout: 20000 });
  checks.push('The writing button plays the actual matching word file');
  await page.locator('.cp-exercise-workspace aside button').filter({ hasText: 'Kies het woord of beeld' }).click();
  const heard = packs[2].exercises.find(item => item.mode === 'heard-word');
  await page.route(`**${heard.prompt.audio.src}`, route => route.abort());
  await page.locator('.cp-mode-picker select').selectOption('heard-word');
  await page.getByText('Probeer Luister opnieuw', { exact: true }).waitFor({ timeout: 20000 });
  assert(await page.locator('.cp-choice-grid button').first().isDisabled());
  await page.unroute(`**${heard.prompt.audio.src}`);
  await page.getByRole('button', { name: 'Opnieuw luisteren', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.cp-choice-grid button')?.disabled, undefined, { timeout: 20000 });
  assert.equal(await page.locator('.cp-audio-retry').count(), 0);
  checks.push('Failed automatic playback exposes a working retry and does not unlock listening answers early');
  assert.deepEqual(errors, []);
} finally {
  mkdirSync('outputs/ux-review-20261017', { recursive: true });
  writeFileSync('outputs/ux-review-20261017/real-audio-check.json', JSON.stringify({ base, checks, errors }, null, 2));
  await browser.close();
}
console.log(checks.map(check => `PASS ${check}`).join('\n'));
