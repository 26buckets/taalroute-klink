import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import audioPlan from '../data/klink-comprehension-audio.json' with { type: 'json' };
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18816';
const out = 'outputs/sentence-comprehension-20261017';
mkdirSync(out, { recursive: true });
const checks = [], errors = [];
const pass = message => { checks.push(message); console.log('PASS', message); };
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__plays = []; window.__fail = ''; window.__duration = 100;
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() {
      window.__plays.push(this.src);
      if (this.src === window.__fail) return Promise.reject(new Error('test media unavailable'));
      this.paused = false;
      this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, window.__duration);
      return Promise.resolve();
    }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
const questions = packs.flatMap(pack => pack.exercises.filter(item => item.mode === 'sentence-question'));
const man = questions.find(item => item.questionId === 'begrip-man');
async function openQuestion(exercise, targetPage = page) {
  const pack = packs.find(pack => pack.exercises.includes(exercise));
  const lesson = pack.lessons.find(item => item.id === exercise.lessonId);
  await targetPage.goto(`${base}/#learner/home`);
  await targetPage.reload();
  if (lesson.guidedExerciseIds.includes(exercise.exerciseId)) {
    await targetPage.evaluate(position => localStorage.setItem('klink.taalroute.route.v1', JSON.stringify({ position, completed: [] })), { packageId: pack.id, lessonId: lesson.id, exerciseId: exercise.exerciseId });
    await targetPage.reload();
    await targetPage.getByRole('button', { name: 'Ga verder', exact: true }).click();
  } else {
    await targetPage.getByRole('navigation', { name: 'Cursistnavigatie' }).getByRole('button', { name: 'Lessen', exact: true }).click();
    await targetPage.locator('.cp-package-grid > button').nth(packs.indexOf(pack)).click();
    await targetPage.getByRole('button', { name: 'Oefeningen', exact: true }).click();
    await targetPage.locator('.cp-exercise-workspace aside button').filter({ hasText: 'Kies het woord of beeld' }).click();
    await targetPage.getByLabel('Wat wil je oefenen?').selectOption(exercise.exerciseId);
    const menu = targetPage.getByLabel('Wat wil je oefenen?');
    assert.match(await menu.locator('option:checked').innerText(), /^Luistervraag \d+: /);
    assert(!(await menu.locator('option').allTextContents()).join(' ').includes(pack.texts.find(text => text.id === exercise.contextId).text), 'The exercise menu must not reveal the sentence answer');
    await targetPage.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  }
  assert.equal(await targetPage.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), exercise.exerciseId);
}
const ready = (p = page) => p.waitForFunction(() => [...document.querySelectorAll('.cp-choice-grid button')].every(button => !button.disabled));
try {
  for (const question of questions) {
    await openQuestion(question); await ready();
    const plays = await page.evaluate(() => window.__plays);
    const from = plays.lastIndexOf(question.prompt.audio.src);
    assert(from >= 0);
    assert.deepEqual(plays.slice(from), [question.prompt.audio.src, question.questionAudio.src, ...question.options.flatMap(option => option.audio?.src ? [option.audio.src] : [])]);
    assert.equal(await page.locator('.cp-reading-blocks, .cp-example-listen, .cp-word-hint').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Controleer', exact: true }).count(), 0);
    const choices = page.locator('.cp-choice-grid button');
    const before = await choices.allTextContents();
    const correct = question.options.findIndex(option => question.answer.correctOptionIds.includes(option.id));
    await choices.nth(1 - correct).click(); await ready();
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes(question.feedback));
    assert.deepEqual(await choices.allTextContents(), before);
    assert.equal(await page.evaluate(() => window.__plays.at(-1)), question.feedbackAudio.src);
    await choices.nth(correct).click();
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Goed'));
    const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
    assert.equal(attempt.mode, 'sentence-question'); assert.equal(attempt.access, 'supported-listening');
    assert.equal(attempt.independentReading, false); assert.equal(attempt.support, 'listening');
    assert.equal(attempt.helpUsed, true); assert.equal(attempt.attempts, 2);
  }
  pass('All eight questions run in the existing player; sentence/question/answers play in order, the menu does not reveal the sentence, wrong choices stay put, and listening is not recorded as reading');

  await openQuestion(man); await ready();
  await page.getByRole('button', { name: 'Automatisch verder pauzeren', exact: true }).click();
  await page.evaluate(src => { window.__fail = src; }, man.questionAudio.src);
  await page.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  await page.getByText('Probeer Luister opnieuw', { exact: true }).waitFor();
  assert(await page.locator('.cp-choice-grid button').first().isDisabled());
  await page.evaluate(() => { window.__fail = ''; window.__duration = 300; });
  await page.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  assert(await page.locator('.cp-choice-grid button').first().isDisabled());
  await ready();
  const right = page.locator('.cp-choice-grid button').nth(man.options.findIndex(option => man.answer.correctOptionIds.includes(option.id)));
  await right.focus(); await page.keyboard.press('Enter');
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), man.exerciseId);
  await page.locator('.cp-exercise-feedback button').click();
  assert.notEqual(await page.locator('.cp-exercise-browser').getAttribute('data-exercise-id'), man.exerciseId);
  pass('Failed question audio keeps answers locked; retry, keyboard choice, pause and Verder work without a separate checking click');

  await openQuestion(man); await ready();
  await page.locator('.cp-choice-grid button').nth(man.options.findIndex(option => man.answer.correctOptionIds.includes(option.id))).click();
  await page.waitForFunction(id => document.querySelector('.cp-exercise-browser')?.dataset.exerciseId !== id, man.exerciseId);
  pass('A correct guided answer advances automatically');

  await openQuestion(man); await ready();
  await page.evaluate(() => { window.__duration = 1000; window.__plays = []; });
  await page.getByRole('button', { name: 'Luister opnieuw', exact: true }).click();
  await page.getByRole('button', { name: 'Terug naar alle lessen', exact: true }).click();
  await page.waitForTimeout(1100);
  assert.deepEqual(await page.evaluate(() => window.__plays), [man.prompt.audio.src]);
  pass('Leaving during the sentence cancels the pending question and answers');

  for (const width of [1366, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await openQuestion(man); await ready();
    await page.waitForFunction(() => [...document.querySelectorAll('.cp-choice-grid img')].every(image => image.complete && image.naturalWidth > 0));
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    for (const button of await page.locator('.cp-choice-grid button, .cp-task-prompt button, .cp-exercise-feedback button').all()) {
      const box = await button.boundingBox(); assert(box.width >= 48 && box.height >= 48);
    }
    const footer = await page.locator('.cp-exercise-feedback button').boundingBox();
    assert(footer.y + footer.height <= (width < 700 ? 844 : 900) + 2);
    assert((await page.locator('.cp-choice-grid').ariaSnapshot()).includes('button "man"'));
    await page.screenshot({ path: `${out}/begripsvraag-${width}.png` });
  }
  pass('Photo answers have accessible names, 48px targets, contained images and a reachable footer on desktop/tablet/390/320px');

  const real = await browser.newPage({ viewport: { width: 390, height: 844 } });
  real.on('pageerror', error => errors.push(error.message));
  await real.addInitScript(() => {
    window.__plays = []; const OriginalAudio = window.Audio;
    window.Audio = class extends OriginalAudio { play() { window.__plays.push(this.src); return super.play(); } };
  });
  await openQuestion(man, real); await ready(real);
  assert((await real.evaluate(() => window.__plays)).some(src => src.endsWith(man.questionAudio.src)));
  const biet = questions.find(item => item.questionId === 'begrip-biet');
  await openQuestion(biet, real);
  await real.waitForSelector('.cp-choice-grid button[data-speaking="true"]');
  assert(await real.locator('.cp-choice-grid button').first().isDisabled());
  await ready(real);
  assert.deepEqual((await real.evaluate(() => window.__plays)).slice(-4).map(src => new URL(src).pathname), [biet.prompt.audio.src, biet.questionAudio.src, ...biet.options.map(option => option.audio.src)]);
  await real.locator('.cp-choice-grid').scrollIntoViewIfNeeded();
  await real.screenshot({ path: `${out}/toestand-met-gesproken-antwoorden.png` });
  for (const item of audioPlan.items) {
    const response = await real.request.get(`${base}${item.src}`); assert(response.ok());
    const hash = buffer => createHash('sha256').update(buffer).digest('hex');
    assert.equal(hash(await response.body()), hash(readFileSync(`public${item.src}`)));
  }
  await real.close();
  pass('Real browser audio completes sentence, question and spoken answers; all eight served recordings match the branded source bytes');
  assert.deepEqual(errors, []);
} finally {
  writeFileSync(`${out}/browser-check.json`, JSON.stringify({ base, checks, errors }, null, 2));
  await browser.close();
}
