import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const out = new URL('../outputs/existing-player-integration/', import.meta.url);
mkdirSync(out, { recursive: true });
const pass = name => { checks.push(name); console.log('PASS', name); };
async function home() { await page.goto(`${base}/#learner/home`); await page.reload(); await page.locator('.cp-home').waitFor(); }
async function library() { await page.getByRole('button', { name: 'Lessen', exact: true }).click(); await page.locator('.cp-package-grid').waitFor(); }
async function screenshot(name) { await page.screenshot({ path: new URL(`${name}.png`, out).pathname }); }
try {
  await home();
  assert.equal(await page.locator('.tr-app').count(), 0);
  assert.deepEqual(await page.getByRole('navigation', { name: 'Cursistnavigatie' }).locator('button span').allTextContents(), ['Verder', 'Lessen', 'Woorden', 'Herhalen']);
  await screenshot('bestaande-home');
  await library();
  assert.equal(await page.locator('.cp-package-grid > button').count(), packs.length);
  for (let i = 0; i < packs.length; i++) {
    const pack = packs[i];
    await page.locator('.cp-package-grid > button').nth(i).click();
    assert.equal(await page.locator('.cp-player-bar strong').innerText(), pack.title);
    assert.deepEqual(await page.locator('.cp-lesson-list h2').allTextContents(), pack.lessons.map(lesson => lesson.title));
    assert(!/CP00[12]/.test(await page.locator('.cp-player').innerText()));
    await page.getByRole('button', { name: 'Terug naar lessen', exact: true }).click();
  }
  pass('Existing package screens contain every core, recall, extension and additional word route');
  await page.locator('.cp-package-grid > button').first().click();
  await screenshot('bestaande-lessen');
  await page.locator('.cp-start-lesson').nth(1).click();
  const lesson = packs[0].lessons[1];
  const exercises = exercisesForLesson(packs[0], lesson);
  for (const exercise of exercises) {
    assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
    assert.equal(await page.locator('.cp-exercise-feedback button').isDisabled(), exercise.mode !== 'model');
    assert.equal(await page.getByRole('button', { name: 'Volgende oefening', exact: true }).count(), 0);
    assert.equal(await page.locator('.cp-exercise-feedback output').getAttribute('aria-live'), 'polite');
    if (exercise.mode === 'model') {
      if (exercise.prompt.audio) {
        await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
        assert.equal((await page.request.get(base + exercise.prompt.audio.src)).status(), 200);
      }
      if (exercise.prompt.image) {
        await page.waitForFunction(() => document.querySelector('.cp-model-content img')?.naturalWidth > 0);
      }
      assert.equal(await page.getByRole('button', { name: 'Ik heb gekeken', exact: true }).count(), 0);
    } else if (exercise.componentId === 'ALF-CMP-002') {
      if (exercise.mode === 'heard-word') await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
      const answer = exercise.answer.correctOptionIds[0];
      const wrong = exercise.options.find(option => option.id !== answer);
      const options = await page.locator('.cp-choice-grid button').allTextContents();
      await page.locator('.cp-choice-grid button').filter({ hasText: new RegExp(`^${wrong.label}$`) }).click();
      assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Probeer opnieuw'));
      assert(await page.locator('.cp-exercise-feedback button').isDisabled());
      assert.deepEqual(await page.locator('.cp-choice-grid button').allTextContents(), options);
      await page.locator('.cp-choice-grid button').filter({ hasText: new RegExp(`^${exercise.options.find(option => option.id === answer).label}$`) }).click();
    } else if (exercise.componentId === 'ALF-CMP-005') {
      await page.locator('.cp-tile-bank button').first().click();
      await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
      for (const id of exercise.answer.targetTileIds) {
        const tile = exercise.tiles.find(item => item.id === id);
        await page.locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${tile.token}$`) }).first().click();
      }
      assert(!(await page.locator('.cp-exercise-feedback button').isDisabled()));
      await page.getByRole('button', { name: 'Eén terug', exact: true }).click();
      assert(await page.locator('.cp-exercise-feedback button').isDisabled());
      const last = exercise.tiles.find(item => item.id === exercise.answer.targetTileIds.at(-1));
      await page.locator('.cp-tile-bank button:not(:disabled)').filter({ hasText: new RegExp(`^${last.token}$`) }).first().click();
    } else throw Error(`Untested guided mode: ${exercise.mode}`);
    if (exercise.mode !== 'model') assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Goed'));
    await page.locator('.cp-exercise-feedback button').click();
  }
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Terug naar de leesstappen', exact: true }).click();
  await page.locator('.cp-lesson-list').waitFor();
  pass('Existing guided player runs model, same word, listening, building, error recovery and completion');
  await page.getByRole('button', { name: 'Oefeningen', exact: true }).click();
  for (let i = 0; i < packs[0].exerciseTypes.length; i++) {
    await page.locator('.cp-exercise-workspace aside button').nth(i).click();
    assert(await page.locator('.cp-exercise-stage > section').isVisible());
  }
  pass('All nine linked families render in the original free-practice browser');
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
  const noAudio = page.locator('.review-word-list button').filter({ has: page.locator('strong', { hasText: /^sap$/ }) });
  assert(await noAudio.isDisabled());
  assert((await noAudio.innerText()).includes('Lees samen met je docent'));
  assert.equal(await noAudio.locator('svg').count(), 0);
  assert((await page.locator('.review-word-list').innerText()).includes('pak (verpakking)'));
  assert((await page.locator('.review-word-list').innerText()).includes('pak (kleding)'));
  pass('The existing word bank and saved-word review share the new stable meaning IDs');
  await library();
  await page.locator('.cp-package-grid > button').first().click();
  for (const name of ['Overzicht', 'Woorden', 'Lessen', 'Oefeningen', 'Beeld en audio']) {
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
  await page.getByRole('button', { name: /Oefenkaart/ }).click();
  assert((await page.locator('.cp-activity-matrix').textContent()).includes('Bouwgroepen'));
  pass('Existing teacher screens use actual Taalroute totals instead of CP sample counts');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(new URL('browser-check.json', out), JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
