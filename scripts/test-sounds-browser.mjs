import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { soundCards, klankstudioUrl } from '../lib/sounds.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://localhost:18857';
const out = process.env.KLINK_SOUNDS_OUTPUT || 'outputs/klanken-controle';
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
const tile = id => page.locator(`[data-sound="${id}"]`);
const playTile = id => tile(id).locator('.cp-sound-play');
const openWords = id => tile(id).locator('.cp-sound-open').click();
async function heard(src, rate = 1) {
  try { await page.waitForFunction(src => window.__audios.at(-1)?.src.endsWith(src) && window.__audios.at(-1)?.ended && !window.__audios.at(-1)?.error, src); } catch (error) { console.error(src, await page.evaluate(() => window.__audios.map(a => ({src:a.src,paused:a.paused,ended:a.ended,error:a.error?.code,time:a.currentTime,duration:a.duration}))), page.url()); throw error; }
  assert.deepEqual(await page.evaluate(() => ({ rate: window.__audios.at(-1).playbackRate, defaultRate: window.__audios.at(-1).defaultPlaybackRate, pitch: window.__audios.at(-1).preservesPitch })), { rate, defaultRate: rate, pitch: true });
}
try {
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    await page.goto(`${base}/#learner/chapters`);
    await page.locator('.cp-practice-entry').getByRole('button', { name: /Met je docent/ }).click();
    await page.getByRole('button', { name: 'Klanken', exact: true }).click();
    await page.getByRole('link', { name: 'Klankenkaart', exact: true }).click();
    await page.getByRole('heading', { name: 'Klankenkaart', exact: true }).waitFor();
    assert.equal(await page.locator('[data-sound]').count(), 46);
    assert.equal(await page.locator('.learner-nav nav > button').count(), 5);
    assert(await noOverflow(), `Overview overflow at ${width}`);
    assert.equal(await page.locator('.cp-sounds').getByText(/Kijk op de poster|Kies een klank|Open de klankenkaart/).count(), 0);
    await page.screenshot({ path: `${out}/klanken-${width}.png` });
    await playTile('a').focus(); await page.keyboard.press('Enter');
    await heard(soundCards.find(sound => sound.id === 'a').audio);
    assert(page.url().endsWith('#learner/sounds'), 'Playing a letter must not navigate');
    await openWords('a');
    await page.getByRole('heading', { name: 'Woorden met a', exact: true }).waitFor();
    assert.equal(await page.locator('.cp-sound-detail a').getAttribute('href'), klankstudioUrl('a'));
    assert(await page.getByRole('button', { name: 'Oefen mat', exact: true }).isVisible());
    assert(await page.getByRole('button', { name: 'Oefen tas', exact: true }).isVisible());
    assert(await noOverflow(), `Detail overflow at ${width}`);
    await page.screenshot({ path: `${out}/a-${width}.png` });
    await page.reload();
    await page.getByRole('heading', { name: 'Woorden met a', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Alle klanken', exact: true }).click();
    await openWords('aa');
    await page.getByRole('heading', { name: 'Woorden met aa', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Oefen mat', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Alle klanken', exact: true }).click();
    await page.getByRole('button', { name: 'Terug naar Klanken', exact: true }).click();
    await page.getByRole('heading', { name: 'Klanken', exact: true }).waitFor();
    if (await page.locator('.cp-practice-entry').count()) await page.locator('.cp-practice-entry').getByRole('button', { name: /Met je docent/ }).click();
    assert.equal(await page.locator('[data-chapter-activity]').count(), 2);
    pass(`Direct letter playback, separate words, keyboard, quiet text and original chapter at ${width}px`);
  }
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${base}/#learner/sounds`);
  for (const sound of soundCards) {
    await playTile(sound.id).click(); await heard(sound.audio);
    assert(page.url().endsWith('#learner/sounds'));
    await openWords(sound.id);
    await page.getByRole('heading', { name: `Woorden met ${sound.label}`, exact: true }).waitFor();
    assert.equal(await page.locator('.cp-sound-detail a').getAttribute('href'), klankstudioUrl(sound.id));
    assert.equal(await page.locator('.cp-sound-anchor .cp-sound-glyph').innerText(), sound.label);
    assert(await page.locator('.cp-sound-word').count() > 0, sound.id);
    await page.locator('.cp-sound-anchor').click(); await heard(sound.audio);
    await page.getByRole('button', { name: 'Alle klanken', exact: true }).click();
  }
  pass('All 46 letters and detail letters play native audio at rate 1; all 46 word lists open separately');
  await openWords('a');
  await page.getByRole('button', { name: 'Luister naar het woord mat', exact: true }).click();
  await page.waitForFunction(() => window.__audios.at(-1)?.ended && !window.__audios.at(-1)?.error);
  assert.equal(await page.evaluate(() => window.__audios.at(-1).playbackRate), .85);
  await page.evaluate(() => { window.__playDescriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'play'); HTMLMediaElement.prototype.play = () => Promise.reject(new Error('Test unavailable audio')); });
  await page.locator('.cp-sound-anchor').click();
  await page.getByRole('status').getByText('Luisteren lukt nu niet. Probeer opnieuw.').waitFor();
  await page.evaluate(() => { Object.defineProperty(HTMLMediaElement.prototype, 'play', window.__playDescriptor); });
  await page.getByRole('button', { name: 'Luister naar het woord mat', exact: true }).click();
  await page.waitForFunction(() => window.__audios.some(audio => !audio.paused));
  await page.getByRole('button', { name: 'Alle klanken', exact: true }).click();
  assert(await page.evaluate(() => window.__audios.every(audio => audio.paused)));
  pass('Existing word speed retained; errors allow retry and navigation stops sound');
  await openWords('a');
  await page.getByRole('button', { name: 'Oefen mat', exact: true }).click();
  await page.locator('.cp-exercise-browser').waitFor();
  const exercise = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
  const progress = await page.evaluate(() => JSON.stringify(localStorage));
  await page.locator('.cp-word-sounds summary').click();
  assert.deepEqual(await page.locator('.cp-word-sounds [data-sound]').evaluateAll(nodes => nodes.map(node => node.dataset.sound)), ['m', 'a', 't']);
  for (const sound of soundCards.filter(sound => ['m','a','t'].includes(sound.id))) {
    await playTile(sound.id).click(); await heard(sound.audio);
    assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise);
  }
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
    assert(await noOverflow());
    await page.locator('.cp-word-sounds').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/mat-klanken-${width}.png` });
  }
  await page.locator('.cp-word-sounds summary').click();
  assert.equal(await page.evaluate(() => JSON.stringify(localStorage)), progress);
  pass('Inline m-a-t plays directly without leaving the lesson or changing saved progress');
  await page.goto(`${base}/#learner/sounds/a`);
  await page.getByRole('button', { name: 'Oefen tas', exact: true }).click();
  await page.locator('.cp-exercise-browser').waitFor();
  for (const route of ['#learner/sounds/not-a-sound', '#learner/sounds/%E0%A4%A']) {
    await page.goto(`${base}/${route}`); await tile('a').waitFor();
  }
  await openWords('a');
  await page.goBack(); await tile('a').waitFor();
  await page.goForward(); await page.getByRole('heading', { name: 'Woorden met a', exact: true }).waitFor();
  pass('Existing tas lesson, malformed links and browser history work');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/checks.json`, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
