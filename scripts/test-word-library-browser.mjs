import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { lessonPackages } from '../lib/package-content.ts';
import { libraryWords, wordLengths } from '../lib/word-library.ts';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18838';
const out = process.env.KLINK_WORD_LIBRARY_OUT || 'outputs/word-library';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  const play = HTMLMediaElement.prototype.play; // oxlint-disable-line typescript/unbound-method -- Applied to the original audio element below.
  HTMLMediaElement.prototype.play = function (...args) {
    this.addEventListener('ended', () => { window.__wordEnded = true; }, { once: true });
    return Reflect.apply(play, this, args);
  };
});
const source = page.getByLabel('Welke woorden?', { exact: true });
const lesson = page.getByLabel('Kies een lespakket', { exact: true });
const extra = page.getByLabel('Kies woorden', { exact: true });
const cards = page.locator('.cp-global-word-grid article');
async function checkCards(expected) {
  await page.waitForFunction(count => document.querySelectorAll('.cp-global-word-grid article').length === count, expected);
  assert.equal(await cards.count(), expected);
}
async function fits() {
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  for (const select of await page.locator('.word-filters select').all()) {
    const box = await select.boundingBox();
    assert(box.height >= 48 && box.x >= 0 && box.x + box.width <= page.viewportSize().width);
  }
  await page.waitForFunction(() => [...document.querySelectorAll('.cp-global-word-grid img')].filter(image => {
    const box = image.getBoundingClientRect();
    return box.top < innerHeight && box.bottom > 0;
  }).every(image => image.complete && image.naturalWidth > 0));
}
try {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${base}/#learner/words`);
  await source.waitFor();
  assert.equal(await source.inputValue(), 'lessons');
  assert.equal(await source.locator('option').count(), 3);
  assert.equal(await lesson.locator('option').count(), 16);
  await checkCards(338);
  for (const pack of lessonPackages) {
    await lesson.selectOption(pack.id);
    await checkCards(libraryWords('lessons', pack.id, []).length);
  }
  checks.push('All fifteen lesson filters retain their word cards');
  await source.selectOption('extra');
  assert.equal(await extra.inputValue(), '2-4');
  assert.equal(await extra.locator('option').count(), 7);
  for (const filter of [...wordLengths.map(item => item.id), 'signs', 'all']) {
    await extra.selectOption(filter);
    await checkCards(libraryWords('extra', filter, []).length);
  }
  checks.push('Five ascending lengths, punctuation and all extra words; no technical subseries');
  await extra.selectOption('signs');
  await page.getByRole('button', { name: "zo'n bewaren", exact: true }).click();
  await source.selectOption('lessons');
  await lesson.selectOption(lessonPackages[0].id);
  await page.getByRole('button', { name: 'mat bewaren', exact: true }).click();
  await source.selectOption('saved');
  await checkCards(2);
  assert.equal(await page.locator('.word-filters select').count(), 1);
  await page.reload();
  await source.selectOption('saved');
  await checkCards(2);
  await page.getByRole('button', { name: 'mat niet meer bewaren', exact: true }).click();
  await page.getByRole('button', { name: "zo'n niet meer bewaren", exact: true }).click();
  await page.getByRole('heading', { name: 'Nog geen woorden bewaard' }).waitFor();
  await page.getByRole('button', { name: 'Bekijk woorden uit de lessen' }).click();
  assert.equal(await source.inputValue(), 'lessons');
  checks.push('Saving across both sources, reload, removing and empty-state recovery');
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await source.selectOption('lessons');
    await lesson.selectOption(lessonPackages[0].id);
    await fits();
    await page.screenshot({ path: `${out}/lessons-${width}.png` });
    await source.selectOption('extra');
    await extra.selectOption('signs');
    await fits();
    await page.screenshot({ path: `${out}/extra-${width}.png` });
    checks.push(`${width}px: filters fit, 48px targets and original word cards`);
  }
  await page.getByRole('button', { name: 'Luister naar e-mail', exact: true }).click();
  await page.waitForFunction(() => window.__wordEnded === true);
  checks.push('Existing word recording plays from the regrouped card');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/checks.json`, JSON.stringify({ passed: true, checks, errors }, null, 2));
  console.log('PASS', checks.length, 'checks');
} finally { await browser.close(); }
