import assert from 'node:assert/strict';
import { learnerListName } from '../lib/learner-copy.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson, lessonPreviewWords } from '../lib/taalroute-packages.ts';
import { answerActivity, openGroupActivity } from './browser-route-helpers.mjs';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const out = new URL('../outputs/existing-player-integration/', import.meta.url);
mkdirSync(out, { recursive: true });
const pass = name => { checks.push(name); console.log('PASS', name); };
async function home() { await page.goto(`${base}/#learner/home`); await page.evaluate(() => localStorage.removeItem('klink.taalroute.route.v1')); await page.reload(); await page.locator('.cp-home').waitFor(); }
async function library() { await page.getByRole('button', { name: 'Lessen', exact: true }).click(); await page.locator('.cp-package-grid').waitFor(); }
async function screenshot(name) { await page.screenshot({ path: new URL(`${name}.png`, out).pathname }); }
try {
  await home();
  assert.equal(await page.locator('.tr-app').count(), 0);
  assert.deepEqual(await page.getByRole('navigation', { name: 'Cursistnavigatie' }).locator('button span').allTextContents(), ['Start', 'Lessen', 'Oefenen', 'Woorden', 'Herhalen']);
  await screenshot('bestaande-home');
  await library();
  assert.equal(await page.locator('.cp-package-grid > button').count(), packs.length);
  for (let i = 0; i < packs.length; i++) {
    const pack = packs[i];
    await page.locator('.cp-package-grid > button').nth(i).click();
    assert.equal(await page.locator('.cp-player-bar strong').innerText(), learnerListName(pack));
    await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
    assert.deepEqual(await page.locator('.cp-lesson-list h2').allTextContents(), pack.lessons.map((lesson, index) => lessonPreviewWords(pack, lesson).map(word => word.word === 'pak' ? `pak (${word.id.endsWith('verpakking') ? 'verpakking' : 'kleding'})` : word.word).join(' · ') || `Les ${index + 1}`));
    assert.equal(await page.locator('.cp-lesson-list article button').count(), pack.lessons.length);
    assert(!/Leesstap|Bekend:|Nieuw:|Komt terug|Kijken|Kiezen|Bouwen|Tik op Start/.test(await page.locator('.cp-lesson-picker').innerText()));
    assert(!/CP00[12]/.test(await page.locator('.cp-player').innerText()));
    await page.getByRole('button', { name: 'Terug naar lessen', exact: true }).click();
  }
  pass('Existing package screens contain every core, recall, extension and additional word route');
  await page.locator('.cp-package-grid > button').first().click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await screenshot('bestaande-lessen');
  await page.locator('.cp-start-lesson').nth(1).click();
  const lesson = packs[0].lessons[1];
  const exercises = exercisesForLesson(packs[0], lesson);
  for (const exercise of exercises) {
    assert.equal(await page.getByRole('button', { name: 'Volgende oefening', exact: true }).count(), 0);
    if (exercise.prompt.audio) assert.equal((await page.request.get(base + exercise.prompt.audio.src)).status(), 200);
    await answerActivity(page, exercise);
  }
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
  await page.locator('.cp-lesson-list').waitFor();
  pass('Existing guided player runs model, same word, listening, building, error recovery and completion');
  await page.locator('.cp-tabs').getByRole('button', { name: 'Samen oefenen', exact: true }).click(); await page.locator('.cp-step-scope select').selectOption('');
  for (const activity of groupActivities.filter(item => item.id !== 'learning-review' && !item.id.startsWith('worksheet') && groupExercises(packs[0], item.id).length)) {
    await openGroupActivity(page, activity.id);
    assert(await page.locator('.cp-exercise-stage > section').isVisible());
    await page.getByRole('button', { name: 'Alle oefeningen', exact: true }).first().click();
  }
  pass('All eligible group activities render in the existing exercise players');
  await page.getByRole('button', { name: 'Woorden', exact: true }).first().click();
  assert.equal(await page.locator('.cp-global-word-grid article').count(), 338);
  for (const meaning of ['pak (kleding)', 'pak (verpakking)']) {
    assert.equal(await page.locator('.cp-global-word-grid strong').filter({ hasText: new RegExp(`^${meaning.replace(/[()]/g, '\\$&')}$`) }).count(), 1);
    await page.getByRole('button', { name: `${meaning} bewaren`, exact: true }).click();
  }
  await page.getByRole('button', { name: 'sap bewaren', exact: true }).click();
  await page.getByRole('button', { name: 'mat bewaren', exact: true }).click();
  await page.getByRole('button', { name: 'Herhalen', exact: true }).click();
  assert((await page.locator('.review-word-list').innerText()).includes('mat'));
  const sap = page.locator('.review-word-list button').filter({ has: page.locator('strong', { hasText: /^sap$/ }) });
  assert(await sap.isEnabled());
  assert((await sap.innerText()).includes('Luister'));
  assert.equal(await sap.locator('svg').count(), 1);
  assert((await page.locator('.review-word-list').innerText()).includes('pak (verpakking)'));
  assert((await page.locator('.review-word-list').innerText()).includes('pak (kleding)'));
  pass('The existing word bank and saved-word review share the new stable meaning IDs');
  await library();
  await page.locator('.cp-package-grid > button').first().click();
  for (const name of ['Woorden', 'Stap voor stap', 'Samen oefenen', 'Gebruiken']) {
    await page.locator('.cp-tabs').getByRole('button', { name, exact: true }).click();
    assert(!/CP00[12]|ALF-CMP|Beeldbinding|assetId|contractVersion|renderer|scope|publicatiestatus|1 oefeningen|1 spellen|zichtbare woorden/i.test(await page.locator('.cp-content').innerText()));
  }
  await page.locator('.cp-tabs').getByRole('button', { name: 'Woorden', exact: true }).click();
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: width > 700 ? 900 : 844 });
    await screenshot(`woorden-na-eindreview-${width}`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const save = page.locator('.cp-save-button').first();
    assert((await save.innerText()).includes('Bewaar'));
    const box = await save.boundingBox();
    assert(box.width >= 48 && box.height >= 48);
  }
  pass('Learner tabs have no known system labels; meaning and missing-audio help are explicit');
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 700 ? 900 : 844 });
    await home();
    await page.getByRole('button', { name: 'Begin hier', exact: true }).click();
    await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
    await page.locator('.cp-start-lesson').first().click();
    await page.waitForFunction(() => document.querySelector('.cp-model-content img')?.naturalWidth > 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const footer = await page.locator('.cp-exercise-feedback').boundingBox();
    assert(footer.y + footer.height <= (width > 700 ? 900 : 844) + 2);
    await screenshot(`bestaande-speler-${width}`);
  }
  pass('Existing shell and player retain usable controls at desktop, tablet and 390/320px widths');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${base}/#teacher`);
  await page.locator('.staff-app').waitFor();
  assert(!/CP00[12]|1\.187/.test(await page.locator('body').innerText()));
  await page.locator('.staff-nav').getByRole('button', { name: 'Oefenen', exact: true }).click();
  assert((await page.locator('.cp-activity-matrix').textContent()).includes('Bouwgroepen'));
  pass('Existing teacher screens use actual Taalroute totals instead of CP sample counts');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(new URL('browser-check.json', out), JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
