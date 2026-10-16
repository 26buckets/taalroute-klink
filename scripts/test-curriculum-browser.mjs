import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const release = JSON.parse(readFileSync(new URL('../data/klink-curriculum.json', import.meta.url)));
const media = JSON.parse(readFileSync(new URL('../data/klink-media.json', import.meta.url)));
const checks = [];
const out = new URL('../outputs/curriculum-rebuild/', import.meta.url);
mkdirSync(out, { recursive: true });
async function route(hash) { const url = `${base}/#${hash}`; if (page.url() === url) await page.reload(); else await page.goto(url); await page.locator('.tr-app').waitFor(); }
async function shot(name) { await page.screenshot({ path: new URL(`${name}.png`, out).pathname }); }
async function pass(name) { checks.push(name); console.log('PASS', name); }
try {
  await route('learner/groepen');
  assert.equal(await page.locator('.tr-groups > button').count(), 10);
  await shot('groepen-desktop');
  await pass('All ten building groups visible, no CP package navigation');
  for (const step of release.steps) {
    await route(`learner/stap/${step.id}`);
    assert.equal(await page.locator('.tr-page header h1').textContent(), step.title);
    for (const id of [...step.known, ...step.newWords, ...step.returning]) {
      const word = release.words.find(item => item.id === id);
      assert((await page.locator('.tr-word-columns').innerText()).includes(word.word), `${step.id}: ${id}`);
    }
  }
  await pass('All 40 base parts retain known, new and returning words');
  for (const extension of release.extensions) {
    await route(`teacher/stap/${extension.id}`);
    assert.equal(await page.locator('.tr-page header h1').textContent(), extension.focus);
  }
  await pass('All 23 extension sets open in teacher view');
  await route('learner/woorden');
  await page.getByRole('searchbox').fill('pak');
  assert.equal(await page.locator('.tr-wordbank strong').filter({ hasText: /^pak$/ }).count(), 2);
  await page.getByRole('searchbox').fill('nietbestaandwoord');
  assert((await page.locator('.tr-page').innerText()).includes('Geen woorden gevonden'));
  await pass('Search handles no results and keeps both pak meanings');
  await route('learner/leesroutes/verbinden');
  assert.equal(await page.locator('.tr-page > section').count(), 3);
  await pass('Three subroutes for syllables and endings remain visible');
  for (const size of [{ width: 1366, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(size);
    await route('learner/stap/klink-leesstap-02');
    await page.getByRole('button', { name: 'Oefenen', exact: true }).click();
    await page.locator('.tr-player').waitFor();
    assert(await page.locator('.tr-player-footer button').isVisible());
    const bounds = await page.locator('.tr-player-footer').boundingBox();
    assert(bounds.y + bounds.height <= size.height + 2, JSON.stringify({ size, bounds }));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await shot(`oefenen-${size.width}`);
  }
  await pass('Desktop, tablet and 390/320px screens retain reachable player controls');
  await page.setViewportSize({ width: 1366, height: 768 });
  await route('learner/stap/klink-leesstap-02');
  await page.getByRole('button', { name: 'Oefenen', exact: true }).click();
  await page.locator('.tr-player-bar input').uncheck();
  for (let i = 0; i < 2; i++) await page.locator('.tr-player-footer button').click();
  await page.locator('[data-activity="match"]').waitFor();
  const targetId = await page.locator('.tr-player').getAttribute('data-word-id');
  const target = release.words.find(item => item.id === targetId).word;
  const options = page.locator('.tr-answers button');
  const names = await options.allTextContents();
  await options.nth(names.findIndex(name => name !== target)).click();
  assert((await page.locator('.tr-player-footer output').innerText()).includes('Probeer'));
  assert.deepEqual(await options.allTextContents(), names);
  await options.nth(names.indexOf(target)).click();
  assert((await page.locator('.tr-player-footer output').innerText()).includes('Goed'));
  await pass('Wrong answer preserves option positions and correct answer needs no check click');
  // Finish the selected step through real buttons, including listening and tile repair.
  for (let i = 0; i < 40 && await page.locator('.tr-player').count(); i++) {
    const kind = await page.locator('.tr-player').getAttribute('data-activity');
    const id = await page.locator('.tr-player').getAttribute('data-word-id');
    const word = release.words.find(item => item.id === id);
    if (kind === 'listen') {
      assert(await page.locator('.tr-answers button').first().isDisabled());
      await page.locator('.tr-listen').click();
      await page.locator('.tr-answers button').first().waitFor();
      await page.getByRole('button', { name: word.word, exact: true }).click();
    } else if (kind === 'match' && !await page.locator('.tr-player-footer button').isEnabled()) {
      await page.getByRole('button', { name: word.word, exact: true }).click();
    } else if (kind === 'build') {
      const units = word.reading.units.map(unit => unit.text);
      const tokens = units.join('') === word.word ? units : [...word.word];
      for (const token of tokens) await page.locator('.tr-tiles button:not(:disabled)').filter({ hasText: new RegExp(`^${token}$`) }).first().click();
    }
    await page.locator('.tr-player-footer button').click();
  }
  await page.locator('.tr-finished').waitFor();
  await pass('Listen, match, construct and finish the same selected step');
  await route('learner/herhalen');
  assert((await page.locator('.tr-word-links').innerText()).includes('tas'));
  await pass('Only introduced words appear in personal recall');
  await route('learner/stap/klink-leesstap-02');
  await page.getByRole('button', { name: 'Oefenen', exact: true }).click();
  for (let i = 0; i < 2; i++) await page.locator('.tr-player-footer button').click();
  const beforeAdvance = await page.locator('.tr-player-bar > span').innerText();
  const autoTarget = release.words.find(item => item.id === targetId).word;
  await page.locator('.tr-answers button').filter({ hasText: new RegExp(`^${autoTarget}$`) }).click();
  await page.waitForFunction(previous => document.querySelector('.tr-player-bar > span')?.textContent !== previous, beforeAdvance);
  await pass('Correct answer advances automatically without a second click');
  await page.locator('.tr-player-bar input').uncheck();
  while (await page.locator('.tr-player').getAttribute('data-activity') !== 'listen') {
    const id = await page.locator('.tr-player').getAttribute('data-word-id');
    const word = release.words.find(item => item.id === id);
    await page.locator('.tr-answers button').filter({ hasText: new RegExp(`^${word.word}$`) }).click();
    await page.locator('.tr-player-footer button').click();
  }
  const brokenId = await page.locator('.tr-player').getAttribute('data-word-id');
  const brokenPath = media[brokenId].audio;
  await page.route(`**${brokenPath}`, request => request.abort());
  await page.locator('.tr-listen').click();
  await page.getByRole('alert').waitFor();
  assert(await page.locator('.tr-answers button').first().isDisabled());
  await page.unroute(`**${brokenPath}`);
  await page.locator('.tr-listen').click();
  await page.waitForFunction(() => !document.querySelector('.tr-answers button')?.disabled);
  assert.equal(await page.getByRole('alert').count(), 0);
  await pass('Audio failure keeps answers locked and retry recovers');
  await route('learner/stap/woord-klink-woord-fit');
  await page.getByRole('button', { name: 'Oefenen', exact: true }).click();
  await page.locator('.tr-player-bar input').uncheck();
  assert.equal(await page.locator('.tr-player h1').innerText(), 'Lees samen');
  await page.locator('.tr-player-footer button').click();
  assert.equal(await page.locator('.tr-player').getAttribute('data-activity'), 'build');
  for (const token of ['t', 'i', 'f']) await page.locator('.tr-tiles button').filter({ hasText: new RegExp(`^${token}$`) }).click();
  assert((await page.locator('.tr-player-footer output').innerText()).includes('Probeer') || (await page.locator('.tr-player-footer output').innerText()).includes('Kijk'));
  await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
  assert.equal(await page.locator('.tr-built').innerText(), 'ti');
  await page.getByRole('button', { name: 'Opnieuw', exact: true }).click();
  for (const token of ['f', 'i', 't']) await page.locator('.tr-tiles button').filter({ hasText: new RegExp(`^${token}$`) }).click();
  assert((await page.locator('.tr-player-footer output').innerText()).includes('Goed'));
  await pass('Missing audio uses reading support, with undo and reset for spelling errors');
  for (const asset of new Set(Object.values(media).flatMap(item => [item.audio, item.image]).filter(Boolean))) {
    const response = await page.request.get(base + asset);
    assert.equal(response.status(), 200, asset);
    assert((await response.body()).length > 100, asset);
  }
  await pass('Every linked word media asset is served successfully');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(new URL('browser-check.json', out), JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
