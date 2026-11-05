import { lessonPackages } from '../lib/package-content.ts';
import { lessonContentLevel } from '../lib/learner-route.ts';
import assert from 'node:assert/strict';
import { groupExercises } from '../lib/group-practice.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const out = new URL('../outputs/lesson-extension-20261016/', import.meta.url);
mkdirSync(out, { recursive: true });
const errors = [], checks = [];
const pass = label => { checks.push(label); console.log('PASS', label); };
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__audioMode = 'play';
  window.__played = [];
  window.Audio = class extends EventTarget {
    dataset = {};
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() { if (window.__audioMode === 'fail') return Promise.reject(new Error('test audio unavailable')); this.paused = false; window.__played.push(this.src); this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 80); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
async function openLesson(pack, lesson) {
  await page.goto(`${base}/#learner/home`);
  await page.reload();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-package-grid > button').nth(packs.indexOf(pack)).click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await page.locator('.cp-start-lesson').nth(pack.lessons.indexOf(lesson)).click();
}
async function seedAt(pack, lesson, exercise) {
  await page.evaluate(level => localStorage.setItem('klink.taalroute.practice-navigation.v1', JSON.stringify({ level, help: 'practice' })), lessonContentLevel(pack, lesson));
  await page.evaluate(position => localStorage.setItem('klink.taalroute.route.v1', JSON.stringify({ position, completed: [] })), { packageId: pack.id, lessonId: lesson.id, exerciseId: exercise.exerciseId });
  await page.reload();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: /^Verder met /  }).click();
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
}
try {
  const core = packs.find(pack => pack.lessons.some(item => item.id === 'klink-leesstap-06')), coreLesson = core.lessons.find(item => item.id === 'klink-leesstap-06');
  await openLesson(core, coreLesson);
  for (const exercise of exercisesForLesson(core, coreLesson)) await answerActivity(page, exercise);
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Volgende les', exact: true }).click();
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), core.lessons[1].guidedExerciseIds[0]);
  pass('Complete core route includes new gap tasks, image choice, matching, recall and next lesson');

  const longPack = packs.find(item => item.kind === 'route');
  const longLesson = longPack.lessons[0];
  const longRoute = exercisesForLesson(longPack, longLesson);
  await openLesson(longPack, longLesson);
  for (const exercise of longRoute) await answerActivity(page, exercise);
  await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  pass('Complete longer-word route includes actual dictation without a visible model');

  const audioChoice = exercisesForLesson(core, coreLesson).find(item => item.mode === 'heard-word');
  await seedAt(core, coreLesson, audioChoice);
  await page.evaluate(() => { window.__audioMode = 'fail'; });
  await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await page.getByText('Probeer Luister opnieuw', { exact: true }).waitFor();
  assert(await page.locator('.cp-choice-grid button').first().isDisabled());
  assert(await page.locator('.cp-exercise-feedback button').isDisabled());
  await page.evaluate(() => { window.__audioMode = 'play'; });
  await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  const resume = page.getByRole('button', { name: 'Automatisch verder aanzetten', exact: true });
  if (await resume.count()) await resume.click();
  await answerActivity(page, audioChoice, { advance: false, checkFocus: false });
  const current = audioChoice.exerciseId;
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), current);
  await page.locator('.cp-exercise-feedback button').click();
  assert.notEqual(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), current);
  assert.equal(await page.locator('.cp-exercise-feedback').getAttribute('class'), 'cp-exercise-feedback idle');
  pass('Failed sound cannot be answered; retry works and a correct choice waits for Verder');

  const gap = exercisesForLesson(core, coreLesson).find(item => item.mode === 'missing-grapheme');
  await seedAt(core, coreLesson, gap);
  await answerActivity(page, gap, { advance: false });
  assert.equal(await page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true }).count(), 0);
  await page.waitForTimeout(1600);
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), gap.exerciseId);
  await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Woorden bekijken', exact: true }).click();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: /^Verder met /  }).click();
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), gap.exerciseId);
  assert(await page.locator('.cp-exercise-feedback button').isDisabled());
  await page.reload();
  await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: /^Verder met /  }).click();
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), gap.exerciseId);
  pass('Pause, navigating away, Verder and reloading resume the exact exercise without restoring a correct answer');

  const dictation = longRoute.find(item => item.mode === 'word-dictation');
  await seedAt(longPack, longLesson, dictation);
  assert(!(await page.locator('.cp-lesson-player').innerText()).includes(dictation.fields[0].acceptedAnswers[0]));
  await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.cp-text-entry input')?.disabled === false);
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  assert.equal(await page.locator('.cp-word-hint strong').innerText(), dictation.helpWord);
  await page.getByRole('button', { name: 'Verberg voorbeeld', exact: true }).click();
  await page.locator('.cp-text-entry input').fill(dictation.fields[0].acceptedAnswers[0]);
  await page.locator('.cp-text-entry input').press('Enter');
  const pauseAfterHelp = page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true });
  if (await pauseAfterHelp.count()) await pauseAfterHelp.click();
  const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(attempt.helpUsed, true); assert.equal(attempt.assessment, 'answer'); assert(attempt.elapsedMs >= 0); assert.equal(attempt.attempts, 1);
  pass('Explicit word help is hidden by default and recorded as assistance, not independent success');

  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 700 ? 900 : 844 });
    await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
    await page.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Start', exact: true }).click(); await page.getByRole('button', { name: 'Stap voor stap', exact: true }).click();
    assert.equal(await page.locator('.cp-photo-section').count(), lessonPackages.length);
    assert(!/Bouwgroep|kernwoorden|oefeningen|Bekende woorden/.test(await page.locator('.cp-library-page').innerText()));
    await page.waitForFunction(() => [...document.querySelectorAll('.cp-section-photo img')].filter(image => image.getBoundingClientRect().top < innerHeight).every(image => image.complete && image.naturalWidth > 0));
    await page.screenshot({ path: new URL(`fotostrook-${width}.png`, out).pathname });
    const matching = exercisesForLesson(packs[0], packs[0].lessons[1]).find(item => item.mode === 'word-image-match');
    await seedAt(packs[0], packs[0].lessons[1], matching);
    await page.getByRole('button', { name: 'Nu jij', exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('.cp-match-board img')].every(image => image.naturalWidth > 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.cp-exercise-feedback').scrollIntoViewIfNeeded();
    assert(await page.locator('.cp-exercise-feedback > button').evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    const footer = await page.locator('.cp-exercise-feedback').boundingBox();
    assert(footer.y + footer.height <= (width > 700 ? 900 : 844) + 2);
    assert.equal(await page.locator('.cp-match-board > div').first().locator('button').first().innerText(), matching.sources[0].label);
    if (width < 760) assert.equal(await page.locator('.cp-exercise-menu-options button[aria-pressed="true"]').textContent(), 'Oefen');
    await page.screenshot({ path: new URL(`koppelen-${width}.png`, out).pathname });
    for (const selector of ['.cp-match-board button', '.cp-exercise-record-head nav button', '.cp-exercise-feedback button']) for (const button of await page.locator(selector).all()) {
      const box = await button.boundingBox(); assert(box.width >= 44 && box.height >= 44, `${width}: ${selector}`);
    }
  }
  pass('Photo strips and matching preserve all sections and approved control sizes at desktop, tablet, 390px and 320px');
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto(`${base}/#teacher`);
  await page.locator('.staff-nav').getByRole('button', { name: 'Oefenen', exact: true }).click();
  assert.equal(await page.locator('.cp-coverage-filters select').first().locator('option').count(), lessonPackages.length);
  for (const pack of packs) {
    await page.locator('.cp-coverage-filters select').first().selectOption(pack.id);
    assert.equal(await page.locator('.cp-coverage-filters select').nth(1).locator('option').count(), pack.lessons.length);
  }
  await page.locator('.cp-coverage-filters select').first().selectOption(packs[0].id);
  const checklist = page.locator('[data-build-checklist]');
  assert.equal(await checklist.locator('tbody tr').count(), 15);
  assert.equal(await checklist.getAttribute('data-lesson-id'), packs[0].lessons[0].id);
  assert((await checklist.innerText()).includes('Bewust anders'));
  assert((await checklist.locator('[data-check-id="sentence-reading"]').innerText()).includes('Ontbreekt'));
  await page.locator('[data-exercise-inventory] summary').click();
  assert((await page.getByRole('region', { name: 'De route per leesstap' }).innerText()).includes('Bewust niet nodig'));
  await page.locator('[data-exercise-inventory] summary').click();
  await page.locator('.cp-coverage-filters select').first().selectOption('groep-1');
  await page.locator('.cp-coverage-filters select').nth(1).selectOption('klink-leesstap-04');
  await page.locator('[data-sentence-bridge] summary').click();
  assert((await page.locator('[data-sentence-bridge]').innerText()).includes('Dit is een pan.'));
  assert((await page.locator('[data-sentence-bridge]').innerText()).includes('nog geen zelfstandig lezen'));
  assert.equal(await page.locator('[data-sentence-bridge] ol li').count(), 6);
  for (const width of [390, 320, 1366]) {
    await page.setViewportSize({ width, height: width > 700 ? 900 : 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await page.locator('[data-sentence-bridge]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: new URL('docent-routeoverzicht.png', out).pathname });
  pass('Teacher checklist covers every step, distinguishes listening from reading, and opens the sentence bridge at desktop/390/320px');

  await openLesson(packs[0], packs[0].lessons[0]);
  assert.equal(await page.locator('[data-build-checklist], [data-sentence-bridge]').count(), 0);
  await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
  await page.locator('.cp-tabs').getByRole('button', { name: 'Oefenen met deze woorden', exact: true }).click(); await page.locator('.cp-step-scope select').selectOption('');
  await page.locator('[data-activity="dictation"]').click();
  assert.equal(await page.locator('.cp-example-listen').count(), 0);
  assert(await page.locator('.cp-text-entry input').isDisabled());
  const listen = page.getByRole('button', { name: 'Luister naar het woord', exact: true });
  await listen.focus(); await page.keyboard.press('Enter');
  const freeId = await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id');
  const freeDictation = groupExercises(packs[0], 'dictation').find(item => item.exerciseId === freeId);
  await page.locator('.cp-text-entry input').fill(freeDictation.fields[0].acceptedAnswers[0]);
  await page.locator('.cp-text-entry input').press('Enter');
  assert(await page.locator('.cp-exercise-feedback').evaluate(element => element.classList.contains('right')));
  pass('Free practice visibly separates copying from dictation and works with keyboard submission');

  const noStorage = await browser.newPage();
  await noStorage.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new Error('storage blocked'); };
    Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
  });
  noStorage.on('pageerror', error => errors.push(error.message));
  await noStorage.goto(`${base}/#learner/home`);
  await noStorage.getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await noStorage.locator('.cp-photo-section').first().click();
  await noStorage.locator('.cp-tabs').getByRole('button', { name: 'Stap voor stap', exact: true }).click();
  await noStorage.locator('.cp-start-lesson').first().click();
  await noStorage.locator('.cp-model-content').waitFor();
  assert((await noStorage.locator('.toast-message').filter({hasText:'Oefenen kan doorgaan'}).innerText()).includes('Oefenen kan doorgaan'));
  await noStorage.close();
  pass('Blocked browser storage does not prevent starting a lesson');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(new URL(base.endsWith(':18817') ? 'production-browser-check.json' : 'browser-check.json', out), JSON.stringify({ base, checks, errors }, null, 2));
  await browser.close();
}
