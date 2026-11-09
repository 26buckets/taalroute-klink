import { lessonContentLevel } from '../lib/learner-route.ts';
import assert from 'node:assert/strict';
import { isBeginnerLesson } from '../lib/lesson-plan.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const out = 'outputs/continuous-flow-20261016';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
const pass = text => { checks.push(text); console.log('PASS', text); };
page.on('pageerror', error => errors.push(error.message));
// Keep real playback: these checks do not infer audio success from a mocked play promise.
await page.addInitScript(() => {
  window.__plays = [];
  const OriginalAudio = window.Audio;
  window.Audio = class extends OriginalAudio {
    play() { window.__plays.push(this.src); return super.play(); }
  };
});
async function openExercise(exercise) {
  const pack = packs.find(pack => pack.exercises.some(item => item.exerciseId === exercise.exerciseId));
  await page.goto(`${base}/#learner/home`);
  await page.evaluate(level => localStorage.setItem('klink.taalroute.practice-navigation.v1', JSON.stringify({ level, help: 'practice' })), lessonContentLevel(pack, pack.lessons.find(item => item.id === exercise.lessonId)));
  await page.evaluate(position => localStorage.setItem('klink.taalroute.route.v1', JSON.stringify({ position, completed: [] })), { packageId: pack.id, lessonId: exercise.lessonId, exerciseId: exercise.exerciseId });
  await page.reload();
  await page.getByRole('button', { name: /^Verder met / }).click();
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
}
const ready = () => page.waitForFunction(() => !/Je hoort het geluid vanzelf|Probeer Luister opnieuw|Tik op Luister/.test(document.querySelector('.cp-exercise-feedback output')?.textContent ?? ''), undefined, { timeout: 20000 });
// Automatic pace remains available after the guided beginner lessons.
const automaticPack = packs.find(pack => pack.lessons.some(lesson => exercisesForLesson(pack, lesson).some(item => item.mode === 'heard-word' && !isBeginnerLesson(item, true))));
const automaticLesson = automaticPack.lessons.find(lesson => exercisesForLesson(automaticPack, lesson).some(item => item.mode === 'heard-word' && !isBeginnerLesson(item, true)));
const route = exercisesForLesson(automaticPack, automaticLesson);
const heard = route.find(item => item.mode === 'heard-word');
try {
  await openExercise(heard);
  await ready();
  assert.equal(await page.evaluate(src => window.__plays.filter(path => path.endsWith(src)).length, heard.prompt.audio.src), 1);
  assert.equal(await page.evaluate(src => window.__plays.filter(path => path.endsWith(src)).length, heard.instructionAudio.src), 0);
  const correct = heard.options.findIndex(option => heard.answer.correctOptionIds.includes(option.id));
  const id = heard.exerciseId;
  const start = Date.now();
  await page.locator('.cp-choice-grid button').nth(correct).click({position:{x:8,y:8}});
  await page.waitForFunction(id => document.querySelector('.cp-exercise-browser')?.dataset.exerciseId !== id, id);
  const elapsed = Date.now() - start;
  assert(elapsed >= 500 && elapsed < 1300, `Feedback took ${elapsed}ms`);
  pass('Real word audio starts automatically; one answer click advances in about 650ms');

  await openExercise(heard); await ready();
  assert.equal(await page.evaluate(src => window.__plays.filter(path => path.endsWith(src)).length, heard.instructionAudio.src), 0);
  assert.equal(await page.getByRole('button', { name: /^Luister naar de opdracht(?:$|:)/ }).count(), 0);
  await page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true }).click();
  await page.locator('.cp-choice-grid button').nth(correct).click({position:{x:8,y:8}});
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), id);
  await page.locator('.cp-exercise-feedback').getByRole('button', { name: 'Verder', exact: true }).click();
  assert.notEqual(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), id);
  pass('Self-paced mode stays put, and Verder always advances instead of becoming a pause action');

  await openExercise(heard); await ready();
  const choices = page.locator('.cp-choice-grid button');
  const labels = await choices.allTextContents();
  await choices.nth(1 - correct).click();
  await page.waitForTimeout(900);
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), id);
  assert.deepEqual(await choices.allTextContents(), labels);
  await choices.nth(correct).click();
  await page.locator('.cp-exercise-feedback').getByRole('button', { name: 'Verder', exact: true }).click();
  assert.notEqual(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), id);
  pass('Wrong answers preserve the choices; an immediate Verder click skips the feedback wait');

  const contextRecords = packs.flatMap(pack => pack.lessons.flatMap(lesson => exercisesForLesson(pack, lesson))).filter(item => item.contextId);
  for (const mode of ['listen-sentence', 'listen-situation']) {
    const context = contextRecords.find(item => item.mode === mode);
    await openExercise(context); await ready();
    assert.equal(await page.evaluate(src => window.__plays.filter(path => path.endsWith(src)).length, context.prompt.audio.src), 1);
    assert.equal(await page.locator('.cp-reading-blocks').innerText(), context.textBlocks[0].text);
    await page.waitForTimeout(900);
    assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), context.exerciseId);
    assert(!/Goed gedaan|zelfstandig gelezen/.test(await page.locator('.cp-exercise-feedback').innerText()));
    await page.locator('[data-practice-listen]').first().click();
    assert.equal(await page.evaluate(() => window.__plays.at(-1)), base + context.prompt.audio.src);
  }
  pass('Sentence and situation recordings play automatically; text replays them and participation is not marked independent reading');

  const situation = contextRecords.find(item => item.mode === 'listen-situation');
  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await openExercise(situation); await ready();
    await page.waitForFunction(() => document.querySelector('.cp-context-image img')?.naturalWidth > 0);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.locator('.cp-exercise-feedback button').scrollIntoViewIfNeeded();
    assert(await page.locator('.cp-exercise-feedback button').evaluate(e => { const r = e.getBoundingClientRect(); return e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); }));
    const next = await page.locator('.cp-exercise-feedback button').boundingBox();
    assert(next.y + next.height <= (width < 700 ? 844 : 900) + 2);
    for (const selector of ['.cp-context-image', '.cp-reading-blocks button', '.cp-exercise-feedback button', '.cp-exercise-record-head nav button']) {
      for (const button of await page.locator(selector).all()) {
        const box = await button.boundingBox(); assert(box.width >= 44 && box.height >= 44, `${width}: ${selector}`);
      }
    }
    await page.screenshot({ path: `${out}/situatie-${width}.png` });
  }
  pass('Context presentation keeps its image proportions, large targets and reachable Verder at four screen widths');
  const model = route.find(item => item.mode === 'model');
  await openExercise(model);
  assert.equal(await page.locator('button.cp-model-content').count(), 1);
  assert.equal(await page.getByRole('button', { name: 'Luister naar het woord', exact: true }).count(), 0);
  pass('The model retains its large photo/word listening target and separate playback toolbar');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/${base.endsWith(':18817') ? 'production-' : ''}browser-check.json`, JSON.stringify({ checks, errors, base }, null, 2));
  await browser.close();
}
