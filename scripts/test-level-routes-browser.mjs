import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { contentById } from '../lib/connected-content.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const out = 'outputs/level-routes-20261018';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
page.setDefaultTimeout(15000);
const checks = [], errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.Audio = class extends EventTarget {
    dataset = {};
    constructor(src) { super(); this.src = src; }
    play() { this.timer = setTimeout(() => this.dispatchEvent(new Event('ended')), 25); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); }
  };
});
const pass = text => { checks.push(text); console.log('PASS', text); };
const tab = label => page.locator('.cp-tabs').getByRole('button', { name: label, exact: true }).click();
async function openPack() { await page.goto(`${base}/#learner/package/groep-1`); await page.locator('.cp-word-grid').waitFor(); }
async function settings() { const block = page.locator('[data-my-route]'); await block.waitFor(); return block; }
try {
  await page.goto(`${base}/#learner/home`); await page.locator('.cp-home').waitFor();
  assert.deepEqual(await page.locator('.learner-nav nav button span').allTextContents(), ['Start', 'Woorden bekijken', 'Nog een keer']);
  // Legacy literacy/language preferences still govern package source filters.
  const preferences = { literacy: 'alfa-a', language: 'a2', pictures: 'always' };
  await page.evaluate(value => localStorage.setItem('klink.taalroute.preferences.v1', JSON.stringify(value)), preferences);
  await page.reload(); await settings();
  assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.preferences.v1'))), preferences);
  pass('Existing literacy and language preferences remain intact after reload');
  await openPack();
  assert.deepEqual(await page.locator('.cp-tabs button span').allTextContents(), ['Woorden', 'Stap voor stap', 'Oefenen met deze woorden', 'Gebruiken']);
  assert.equal(await page.locator('.cp-word-grid article').count(), 6);
  await tab('Stap voor stap'); await page.locator('.cp-start-lesson').first().click();
  await page.locator('.cp-exercise-browser').waitFor();
  await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
  // A deliberate word-step selection carries into both next entrances.
  await tab('Oefenen met deze woorden'); assert.equal(await page.locator('.cp-step-scope select').inputValue(), packs[0].lessons[0].id);
  assert.equal(await page.locator('[data-activity="word-bingo"]').count(), 0);
  await page.locator('[data-activity="meet"]').click();
  assert((await page.locator('[data-exercise-id]').getAttribute('data-exercise-id')).includes('mat'));
  await page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first().click();
  await tab('Gebruiken'); assert.equal(await page.locator('.cp-step-scope select').inputValue(), packs[0].lessons[0].id);
  pass('Four entrances share one word group and selected small step; mat does not get artificial bingo choices');
  await page.locator('.cp-step-scope select').selectOption('');
  const a2Choice = page.locator('[data-my-route]').getByRole('button', { name: 'A2', exact: true });
  if (await a2Choice.getAttribute('aria-pressed') !== 'true') await a2Choice.click();
  await page.getByRole('button', { name: 'Teksten en verhalen', exact: true }).click();
  await page.getByRole('button', { name: /^Met de docent/ }).click();
  const visible = await page.locator('.cp-reading-list [data-content-id]').evaluateAll(nodes => nodes.map(node => node.dataset.contentId));
  assert(visible.length > 0); assert(visible.every(id => /^a2(?:_|$)/i.test(contentById.get(id).sourceLevel)));
  await page.getByRole('button', { name: /^Nu zelf/ }).click(); assert.equal(await page.locator('.cp-reading-list > button').count(), 0);
  await page.getByRole('button', { name: /^Voor later/ }).click(); assert(await page.locator('.cp-reading-list > button').count() > 0);
  await page.locator('.cp-reading-list > button').first().click(); await page.locator('.cp-exercise-browser').waitFor();
  await page.getByRole('button', { name: 'Gebruiken', exact: true }).last().click();
  await page.getByRole('button', { name: 'Situaties', exact: true }).click();
  assert.equal(await page.locator('.cp-scene-gallery img').count(), packs[0].scenes.filter(item => item.image).length);
  pass('Source levels and readiness are separate; harder originals and all existing scene images remain reachable');
  await openPack(); await tab('Oefenen met deze woorden'); await page.locator('[data-activity="dictation"]').click();
  await page.locator('.cp-text-entry input').waitFor();
  const photo = page.locator('[data-view-toggle="photo"]');
  if (await photo.getAttribute('aria-pressed') === 'true') await photo.click();
  await page.waitForFunction(() => document.querySelector('[data-view-toggle="photo"]')?.getAttribute('aria-pressed') === 'false');
  await photo.click(); await page.waitForFunction(() => document.querySelector('[data-view-toggle="photo"]')?.getAttribute('aria-pressed') === 'true');
  const helpedId = await page.locator('[data-exercise-id]').getAttribute('data-exercise-id');
  const helpedItem = groupExercises(packs[0], 'dictation').find(item => item.exerciseId === helpedId);
  await page.locator('.cp-text-entry input').fill(helpedItem.fields[0].acceptedAnswers[0]);
  await page.getByRole('button', { name: 'Controleer', exact: true }).click();
  const helpedAttempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(helpedAttempt.helpUsed, true);
  assert.equal(helpedAttempt.pictureSupport, 'always');
  await page.reload(); await tab('Oefenen met deze woorden'); await page.locator('[data-activity="meet"]').click();
  assert.equal(await page.locator('[data-view-toggle="photo"]').getAttribute('aria-pressed'), 'true');
  assert(await page.locator('.cp-model-content img').isVisible());
  pass('Current photo controls retain their setting and record requested picture help in attempts');
  await page.goto(`${base}/#learner/chapters/texts/texts?level=b1`);
  await page.locator('.cp-chapters').waitFor(); assert.equal(await page.locator('[data-collection]').count(), 0);
  assert((await page.getByRole('status').filter({hasText:'Deze oefening is niet beschikbaar'}).innerText()).includes('B1'));
  await page.locator('[data-my-route]').getByRole('button', { name: 'A2', exact: true }).click();
  await page.locator('[data-collection]').first().click(); await page.locator('[data-exercise-id]').waitFor();
  const selectedUrl = page.url(); await page.reload(); await page.locator('[data-exercise-id]').waitFor();
  assert.equal(page.url(), selectedUrl);
  pass('The original texts activity has no B1; source level selection, deep links and reload keep the same content');
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 }); await openPack();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const button of await page.locator('.cp-tabs button').all()) { const box = await button.boundingBox(); assert(box.width >= 48 && box.height >= 48); }
    await page.screenshot({ path: `${out}/words-${width}.png` });
    await tab('Oefenen met deze woorden'); await page.screenshot({ path: `${out}/growth-${width}.png`, fullPage: true });
  }
  pass('Desktop, tablet and narrow layouts preserve compact cards and 48px navigation');
  await page.goto(`${base}/#teacher/activities`); await page.locator('[data-level-coverage] > summary').click();
  assert((await page.locator('[data-level-coverage]').innerText()).includes('Beeldopbouw'));
  pass('Teacher view connects six groups, progression, image support and source preparation');
  await page.goto(`${base}/#learner/home`); const finalSettings = await settings();
  assert(await finalSettings.getByRole('button', { name: 'Alfa C', exact: true }).isEnabled());
  assert(await finalSettings.getByRole('button', { name: 'B1', exact: true }).isEnabled());
  for (const level of ['Alfa C', 'B1']) {
    await finalSettings.getByRole('button', { name: level, exact: true }).click(); await page.reload(); await settings();
    assert.equal(await page.getByRole('button', { name: level, exact: true }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.cp-direct-resume').count(), 0);
  }
  pass('Start retains Alfa C or B1 without silently resuming a different-level lesson');
  const noStorage = await browser.newContext();
  await noStorage.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Storage denied'); }; Storage.prototype.setItem = () => { throw new Error('Storage denied'); }; });
  const privatePage = await noStorage.newPage();
  await privatePage.goto(`${base}/#learner/home`);
  await privatePage.locator('[data-my-route]').getByRole('button', { name: 'Alfa B', exact: true }).click();
  assert.equal(await privatePage.locator('[data-my-route]').getByRole('button', { name: 'Alfa B', exact: true }).getAttribute('aria-pressed'), 'true');
  assert((await privatePage.locator('[data-my-route] output').innerText()).includes('kan hier niet worden bewaard'));
  await noStorage.close();
  pass('Route choices remain usable when the browser denies storage, without claiming persistence');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ checks, errors, checkedAt: new Date().toISOString() }, null, 2));
} finally { await browser.close(); }
