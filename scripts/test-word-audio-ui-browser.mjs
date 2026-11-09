import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { allPackageWords } from '../lib/package-content.ts';
import additional from '../data/klink-lexicon-wordbuild-rest.json' with { type: 'json' };
assert.equal(allPackageWords.length, 5127);
assert(allPackageWords.every(word => word.audio), 'Every word shown under Woorden must have audio');
const base = process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:18878';
const folder = process.env.KLINK_AUDIO_UI_OUT ?? 'outputs/wordaudio/ui-local';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
mkdirSync(folder, {recursive:true});
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if (response.url().includes('/woorden-20261025/')) requests.push({ url: response.url(), status: response.status() }); });
await page.addInitScript(() => {
  window.__wordAudio = [];
  const original = HTMLMediaElement.prototype.play; // oxlint-disable-line typescript/unbound-method -- Reflect.apply below supplies the original receiver.
  HTMLMediaElement.prototype.play = function (...args) {
    const record = { src: this.src, started: false, ended: false, error: null };
    window.__wordAudio.push(record);
    this.addEventListener('playing', () => { record.started = true; }, { once: true });
    this.addEventListener('ended', () => { record.ended = true; }, { once: true });
    this.addEventListener('error', () => { record.error = this.error?.message; }, { once: true });
    return Reflect.apply(original, this, args);
  };
});
try {
  await page.goto(base);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Start met oefenen', exact: true }).click();
  await page.locator('.learner-login').waitFor();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.locator('.cp-home').waitFor();
  await page.getByRole('button', { name: 'Woorden bekijken', exact: true }).click();
  const search = page.getByLabel('Zoek een woord', {exact:true});
  const firstWords = allPackageWords.filter(word => word.packageId === 'klink-lexicon-proefpakket-20-20261019');
  const buttons = page.locator('.cp-global-word-grid .cp-word-listen');
  assert((await buttons.count()) <= 24);
  for (let i = 0; i < 20; i++) {
    await search.fill(firstWords[i].word);
    assert.equal(await page.locator('.cp-word-listen').filter({has:page.getByText(firstWords[i].word,{exact:true})}).isDisabled(), false);
    await page.locator('.cp-word-listen').filter({has:page.getByText(firstWords[i].word,{exact:true})}).click();
    await page.waitForFunction(index => window.__wordAudio[index]?.ended || window.__wordAudio[index]?.error, i, { timeout: 15000 });
    const event = await page.evaluate(index => window.__wordAudio[index], i);
    assert(event.started && event.ended && !event.error, JSON.stringify(event));
    assert(event.src.endsWith('.mp3') && event.src.includes('/woorden-20261025/'));
  }
  await page.setViewportSize({ width: 390, height: 844 });
  assert((await buttons.count()) <= 24);
  const mobileIndex = await page.evaluate(() => window.__wordAudio.length);
  await buttons.nth(0).click();
  await page.waitForFunction(index => window.__wordAudio[index]?.ended, mobileIndex, { timeout: 15000 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  const lastPack = additional.packs.at(-1);
  assert(lastPack.words.every(word => allPackageWords.some(item => item.id === word.id)));
  await search.fill(lastPack.words.at(-1).word);
  const lastIndex = await page.evaluate(() => window.__wordAudio.length);
  await page.locator('.cp-word-listen').filter({has:page.getByText(lastPack.words.at(-1).word,{exact:true})}).click();
  await page.waitForFunction(index => window.__wordAudio[index]?.ended, lastIndex, { timeout: 15000 });
  const lastPlayed = await page.evaluate(() => window.__wordAudio.at(-1));
  assert(lastPlayed.started && !lastPlayed.error && lastPlayed.src.endsWith(`/${lastPack.words.at(-1).id}.mp3`));
  const repairedWords = ['pinnen', 'pinpas', 'leiding', 'zucht', 'vervoermiddel', 'man'];
  for (const text of repairedWords) {
    const word = allPackageWords.find(word => word.word === text);
    assert(word);
    await search.fill(word.word);
    const index = await page.evaluate(() => window.__wordAudio.length);
    await page.locator('.cp-word-listen').filter({has:page.getByText(text,{exact:true})}).click();
    await page.waitForFunction(index => window.__wordAudio[index]?.ended, index, { timeout: 15000 });
    const played = await page.evaluate(index => window.__wordAudio[index], index);
    assert(played.started && !played.error && played.src.endsWith(`/${word.id}.mp3`));
  }
  assert.deepEqual(errors, []);
  assert(requests.length >= 20 && requests.every(response => [200, 206].includes(response.status)));
  const result = { passed: true, totalWordCardsWithAudio: allPackageWords.length, firstPackWordCards: 20, desktopAudioPlayedToEnd: 20, mobileAudioPlayedToEnd: 8, repairedWordsPlayed: repairedWords, finalAddedWordPlayed: lastPack.words.at(-1).word, nativePlayback: true, audioRequests: requests.length, errors };
  writeFileSync(`${folder}/word-card-playback.json`, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} catch (error) {
  console.log(JSON.stringify({ failure: String(error), errors, url: page.url(), visible: (await page.locator('body').innerText({timeout:2000}).catch(() => '')).slice(0, 1000) }));
  throw error;
} finally { await browser.close(); }
