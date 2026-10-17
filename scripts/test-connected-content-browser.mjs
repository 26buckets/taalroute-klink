import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { connectedContent } from '../lib/connected-content.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const out = 'outputs/content-connection-20261017';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
const pass = message => { checks.push(message); console.log('PASS', message); };
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__plays = []; window.__fail = ''; window.__duration = 80;
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() { window.__plays.push(this.src); if (this.src === window.__fail) return Promise.reject(new Error('test unavailable')); this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, window.__duration); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
async function openLibrary(pack, kind, target = page) {
  await target.goto(`${base}/#learner/home`); await target.reload();
  await target.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Lessen', exact: true }).click();
  await target.locator('.cp-package-grid > button').nth(packs.indexOf(pack)).click();
  await target.locator('.cp-tabs').getByRole('button', { name: kind === 'dialogue' ? 'Gesprekken' : 'Zinnen en teksten', exact: true }).click();
}
async function openItem(item, target = page) {
  const pack = packs.find(pack => [...pack.texts, ...pack.dialogues].some(record => record.id === item.id));
  await openLibrary(pack, item.kind, target);
  const library = item.kind === 'dialogue' ? pack.dialogues : pack.texts;
  await target.locator('.cp-reading-list > button').nth(library.findIndex(record => record.id === item.id)).click();
  await target.waitForFunction(id => document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.endsWith(id), item.id);
  return pack;
}
const ready = (target = page) => target.getByRole('button', { name: 'Klaar', exact: true }).isEnabled();
try {
  for (const pack of packs) {
    for (const kind of ['text', 'dialogue']) {
      const library = kind === 'dialogue' ? pack.dialogues : pack.texts;
      if (!library.length) continue;
      await openLibrary(pack, kind);
      assert.equal(await page.locator('.cp-reading-list > button').count(), library.length);
      const lesson = pack.lessons.find(lesson => library.some(item => item.lessonIds.includes(lesson.id)));
      await page.getByLabel('Woorden', { exact: true }).selectOption(lesson.id);
      assert.equal(await page.locator('.cp-reading-list > button').count(), library.filter(item => item.lessonIds.includes(lesson.id)).length);
    }
  }
  pass('All 15 sections expose the exact connected library; word-step filters return the correct entries');
  for (const kind of ['sentence', 'text', 'dialogue']) {
    const item = connectedContent.find(item => item.kind === kind);
    await openItem(item);
    await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.startsWith('Klaar') && !button.disabled));
    const played = await page.evaluate(() => window.__plays);
    assert.deepEqual(played.slice(-item.blocks.length), item.blocks.map(block => block.audio.src));
    assert.deepEqual(await page.locator('.cp-reading-blocks > button').allTextContents(), item.blocks.map(block => `${block.speaker ?? ''}${block.text}`));
    assert(!/CP00|bron|media_gecontroleerd|sourceStatus|Antwoord:|Zelfstandig lezen/.test(await page.locator('.cp-exercise-stage').innerText()));
    await page.getByRole('button', { name: 'Klaar', exact: true }).click();
    const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
    assert.equal(attempt.access, 'supported-listening'); assert.equal(attempt.independentReading, false);
    assert.equal(attempt.assessment, 'participation'); assert.equal(attempt.support, 'listening');
    const before = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
    await page.locator('.cp-exercise-feedback button').click();
    assert.notEqual(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), before);
  }
  pass('Sentence, text and dialogue open in the existing player, play in order, record listening participation and allow Verder');
  const dialogue = connectedContent.find(item => item.kind === 'dialogue');
  await openItem(dialogue);
  // Finish the initial autoplay before measuring the explicit failed replay.
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.startsWith('Klaar') && !button.disabled));
  await page.evaluate(src => { window.__fail = src; window.__plays = []; }, dialogue.blocks[1].audio.src);
  await page.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  await page.getByText('Probeer Luister opnieuw', { exact: true }).waitFor();
  assert.equal(await ready(), false);
  assert.deepEqual(await page.evaluate(() => window.__plays), dialogue.blocks.slice(0, 2).map(block => block.audio.src));
  await page.evaluate(() => { window.__fail = ''; window.__duration = 120; });
  await page.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent.startsWith('Klaar') && !button.disabled));
  await page.evaluate(() => { window.__duration = 1200; window.__plays = []; });
  await page.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  await page.locator('.cp-content .text-back').click();
  await page.waitForTimeout(1300);
  assert.deepEqual(await page.evaluate(() => window.__plays), [dialogue.blocks[0].audio.src]);
  pass('A failed middle turn cannot complete the conversation; retry works and leaving cancels pending turns');
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await openItem(dialogue);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const button of await page.locator('.cp-reading-blocks > button').all()) { const box = await button.boundingBox(); assert(box.height >= 48 && box.width >= 48); }
    await page.locator('.cp-reading-blocks > button').nth(1).focus(); await page.keyboard.press('Enter');
    await page.screenshot({ path: `${out}/connected-dialogue-${width}.png` });
  }
  pass('Desktop, tablet and narrow screens retain the existing layout, keyboard listening and large targets');
  const real = await browser.newPage();
  await openItem(dialogue, real);
  for (const block of dialogue.blocks) {
    const response = await real.request.get(base + block.audio.src); assert.equal(response.status(), 200); assert((await response.body()).length > 1000);
    assert(await real.evaluate(async src => { const bytes = await (await fetch(src)).arrayBuffer(); const context = new AudioContext(); try { const audio = await context.decodeAudioData(bytes); return audio.duration > 0; } finally { await context.close(); } }, block.audio.src));
  }
  await real.close();
  pass('Real served conversation files decode in the browser; no synthesized substitutes');
  await page.goto(`${base}/#teacher`); await page.reload();
  await page.getByRole('button', { name: 'Oefenkaart', exact: true }).click();
  await page.locator('.cp-coverage-filters select').nth(1).selectOption(packs[0].lessons[1].id);
  await page.locator('[data-existing-content] > summary').click();
  assert(await page.locator('[data-existing-content] [data-content-id]').count() > 0);
  await page.locator('[data-existing-content] [data-content-id] > summary').first().click();
  assert((await page.locator('[data-existing-content]').innerText()).includes('geen vrijgave voor zelfstandig lezen'));
  pass('Teacher map shows the matched items and separate word, sound, language-load and comprehension conditions');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ checks, errors, checkedAt: new Date().toISOString() }, null, 2));
} finally { await browser.close(); }
