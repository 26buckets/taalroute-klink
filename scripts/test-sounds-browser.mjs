import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { soundCards, klankstudioUrl } from '../lib/sounds.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://localhost:18831';
const out = process.env.KLINK_SOUNDS_OUTPUT || '../../outputs/klink-klanken/controles';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage();
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  const NativeAudio = window.Audio;
  window.__audios = [];
  window.Audio = function(src) { const audio = new NativeAudio(src); window.__audios.push(audio); return audio; };
});
const pass = message => { checks.push(message); console.log('PASS', message); };
const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('.learner-main').scrollWidth <= document.querySelector('.learner-main').clientWidth + 1);
try {
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await page.goto(`${base}/#learner/chapters`);
    await page.getByRole('link', { name: 'Klanken', exact: true }).click();
    await page.locator('[data-sound=a]').waitFor();
    assert.equal(await page.locator('[data-sound]').count(), 46);
    assert.equal(await page.locator('.learner-nav nav > button').count(), 5);
    assert.equal(await page.locator('.learner-nav button[title=Oefenen]').getAttribute('aria-current'), 'page');
    assert(await noOverflow(), `Overview overflow at ${width}`);
    await page.screenshot({ path: `${out}/klanken-${width}.png` });
    await page.locator('[data-sound=a]').focus();
    await page.keyboard.press('Enter');
    await page.getByRole('heading', { name: 'De klank a', exact: true }).waitFor();
    assert.equal(await page.locator('.cp-sound-detail a').getAttribute('href'), klankstudioUrl('a'));
    assert(await page.getByRole('button', { name: 'Oefen mat', exact: true }).isVisible());
    assert(await page.getByRole('button', { name: 'Oefen tas', exact: true }).isVisible());
    assert(await noOverflow(), `Detail overflow at ${width}`);
    await page.screenshot({ path: `${out}/a-${width}.png` });
    await page.reload();
    await page.getByRole('heading', { name: 'De klank a', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Alle klanken', exact: true }).click();
    await page.locator('[data-sound=aa]').click();
    await page.getByRole('heading', { name: 'De klank aa', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Oefen mat', exact: true }).count(), 0);
    pass(`Overview, keyboard, 46 cards, correct a/aa details and reload at ${width}px`);
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  for (const sound of soundCards) {
    await page.goto(`${base}/#learner/sounds/${sound.id}`);
    await page.getByRole('heading', { name: `De klank ${sound.label}`, exact: true }).waitFor();
    assert.equal(await page.locator('.cp-sound-detail a').getAttribute('href'), klankstudioUrl(sound.id));
    assert.equal(await page.locator('.cp-sound-anchor .cp-sound-glyph').innerText(), sound.label);
  }
  pass('All 46 detail links retain the exact canonical spelling, example and Klankstudio sound ID');
  await page.goto(`${base}/#learner/sounds/a`);
  await page.getByRole('button', { name: 'Luister naar het woord mat', exact: true }).click();
  await page.waitForFunction(() => window.__audios.some(audio => audio.ended && !audio.error), { timeout: 15000 });
  pass('Existing mat recording plays to the end with real browser audio');
  await page.evaluate(() => { window.__playDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play'); HTMLMediaElement.prototype.play = () => Promise.reject(new Error('Test unavailable audio')); });
  await page.getByRole('button', { name: 'Luister naar het woord mat', exact: true }).click();
  await page.getByText('Luisteren lukt nu niet.', { exact: false }).waitFor();
  await page.evaluate(() => { Object.defineProperty(HTMLMediaElement.prototype, 'play', window.__playDescriptor); });
  await page.getByRole('button', { name: 'Luister naar het woord mat', exact: true }).click();
  await page.waitForFunction(() => window.__audios.some(audio => !audio.paused));
  await page.getByRole('button', { name: 'Alle klanken', exact: true }).click();
  assert(await page.evaluate(() => window.__audios.every(audio => audio.paused)));
  pass('Audio errors allow retry; navigation stops playback');
  await page.locator('[data-sound=a]').click();
  await page.getByRole('button', { name: 'Oefen mat', exact: true }).click();
  await page.locator('.cp-exercise-browser').waitFor();
  const exercise = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
  const progress = await page.evaluate(() => JSON.stringify(localStorage));
  await page.locator('.cp-word-sounds summary').click();
  assert.deepEqual(await page.locator('.cp-word-sounds [data-sound]').evaluateAll(nodes => nodes.map(node => node.dataset.sound)), ['m', 'a', 't']);
  await page.locator('.cp-word-sounds [data-sound=a]').click();
  assert.equal(await page.locator('.cp-word-sounds a').getAttribute('href'), klankstudioUrl('a'));
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    assert(await noOverflow());
    await page.locator('.cp-word-sounds').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/mat-klanken-${width}.png` });
  }
  await page.locator('.cp-word-sounds summary').click();
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise);
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), progress);
  pass('mat opens m-a-t inline without leaving the lesson or changing progress; desktop/mobile stay in bounds');
  await page.goto(`${base}/#learner/sounds/a`);
  await page.getByRole('button', { name: 'Oefen tas', exact: true }).click();
  await page.locator('.cp-exercise-browser').waitFor();
  // The existing tas lesson starts by recalling mat, then introduces tas.
  assert(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'));
  for (const route of ['#learner/sounds/not-a-sound', '#learner/sounds/%E0%A4%A']) {
    await page.goto(`${base}/${route}`);
    await page.locator('[data-sound=a]').waitFor();
  }
  await page.locator('[data-sound=a]').click();
  await page.goBack(); await page.locator('[data-sound=a]').waitFor();
  await page.goForward(); await page.getByRole('heading', { name: 'De klank a', exact: true }).waitFor();
  pass('tas lesson entry, malformed links and browser Back/Forward work');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
