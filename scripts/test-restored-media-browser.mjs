import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
const out = 'outputs/media-completion-20261016';
const checks = [];
try {
  await page.goto(`${process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816'}/#learner/home`);
  await page.reload();
  await page.getByRole('button', { name: 'Woorden', exact: true }).click();
  const selected = JSON.parse(readFileSync(`${out}/symbol-review.json`)).filter(item => item.decision === 'linked-for-review');
  for (const item of selected) {
    const card = page.getByRole('button', { name: `Luister naar ${item.word}`, exact: true });
    const img = card.locator('img');
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el => el.decode());
    const state = await img.evaluate(el => ({ src: new URL(el.src).pathname, width: el.naturalWidth, height: el.naturalHeight, fit: getComputedStyle(el).objectFit }));
    assert.equal(state.src, item.output); assert(state.width > 0 && state.height > 0); assert.equal(state.fit, 'contain');
    checks.push(`${item.word}: original image loaded with preserved proportions`);
  }
  await page.getByRole('button', { name: 'Luister naar cirkel', exact: true }).screenshot({ path: `${out}/cirkel-in-bestaande-app.png` });
  await page.goto(pathToFileURL(resolve(`${out}/luistercontrole.html`)).href);
  assert.equal(await page.locator('audio').count(), 7);
  for (const player of await page.locator('audio').all()) {
    const duration = await player.evaluate(el => new Promise((resolve, reject) => {
      el.onloadedmetadata = () => resolve(el.duration);
      el.onerror = () => reject(Error('Missing or unreadable word candidate'));
      el.load();
    }));
    assert(duration >= 0.2 && duration <= 8);
  }
  checks.push('Seven review recordings load with readable duration; not a pronunciation review');
  await page.screenshot({ path: `${out}/luistercontrole.png`, fullPage: true });
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ date: new Date().toISOString(), checks, humanReview: 'open' }, null, 2));
  console.log(checks.join('\n'));
} finally { await browser.close(); }
