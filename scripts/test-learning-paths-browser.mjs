import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chapterCollections, chapterHash } from '../lib/practice-chapters.ts';
import { learningReviewKey } from '../lib/learning-review.ts';
import { answerActivity } from './browser-route-helpers.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:18830';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1366, height: 950 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.addInitScript(() => {
  window.__audioFail = false;
  window.__played = [];
  window.Audio = class extends EventTarget {
    constructor(src) { super(); this.src = src; this.paused = true; }
    play() { if (window.__audioFail) return Promise.reject(Error('test unavailable')); window.__played.push(this.src); this.paused = false; this.timer = setTimeout(() => { this.paused = true; this.dispatchEvent(new Event('ended')); }, 30); return Promise.resolve(); }
    pause() { clearTimeout(this.timer); this.paused = true; }
  };
});
const forward = () => page.locator('.cp-exercise-feedback').getByRole('button', { name: /Verder|Ronde afronden/ });
async function open(chapter, activity, collection = chapterCollections(activity)[0], step) {
  await page.goto(`${base}/${chapterHash({ chapter, activity, collection: collection?.id, level: 'all' })}`);
  await page.reload();
  if (step) {
    // Let the mounted player finish restoring its initial position before seeding the test step.
    await page.locator('.is-mixed-round').waitFor();
    await page.evaluate(({ key, id }) => localStorage.setItem(key, JSON.stringify({ version: 1, exerciseId: id, done: false })), { key: `klink.group.v1:chapter:${activity}:${collection.id}:${activity}`, id: step.exerciseId });
    await page.reload();
  }
  if (collection) await page.locator('.is-mixed-round').waitFor();
  return collection;
}
try {
  const sound = await open('sounds', 'sound-path');
  assert(await forward().isEnabled(), 'A model needs one deliberate Continue, not two confirmation clicks');
  await forward().focus();
  await page.keyboard.press('Enter');
  const first = sound.exercises[1];
  await page.waitForFunction(() => !document.querySelector('.cp-learning-task .cp-choice-grid button')?.disabled);
  assert.equal(await page.locator('.cp-learning-example').count(), 0);
  assert.equal(await page.locator('.cp-learning-task img').count(), 0);
  assert.equal(await page.locator('.cp-chapters h1').innerText(), 'Klanken in woorden', 'Collection example must not give away the current target word');
  const choices = page.locator('.cp-learning-task .cp-choice-grid button');
  const labels = await choices.allTextContents();
  const wrong = first.options.find(option => !first.answer.correctOptionIds.includes(option.id));
  await choices.filter({ hasText: new RegExp(`^${wrong.label}$`) }).click();
  assert(await forward().isDisabled());
  assert.deepEqual(await choices.allTextContents(), labels);
  await page.getByRole('button', { name: 'Voorbeeld', exact: true }).click();
  assert((await page.locator('.cp-learning-task .cp-source-text').innerText()).includes(first.helpWord));
  await choices.filter({ hasText: new RegExp(`^${first.answer.correctOptionIds[0]}$`) }).click();
  assert(await forward().isEnabled());
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'), first.exerciseId);
  const attempt = await page.evaluate(() => JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).at(-1));
  assert.equal(attempt.helpUsed, true); assert.equal(attempt.independentReading, false);
  console.log('PASS model, sound gating, stable error recovery, help tracking and deliberate continuation');

  const spelling = chapterCollections('spelling-path').find(item => item.id.includes('spelling-open'));
  await open('spelling', 'spelling-path', spelling, spelling.exercises[1]);
  assert.equal(await page.locator('.cp-missing-word').innerText(), spelling.exercises[1].maskedWord);
  for (const width of [1366, 820, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `overflow at ${width}`);
    for (const button of await page.locator('.cp-learning-task button').all()) {
      const box = await button.boundingBox(); assert(box.width >= 47 && box.height >= 47, `tap target at ${width}`);
    }
    await forward().scrollIntoViewIfNeeded();
    assert(await forward().evaluate(button => {
      const box = button.getBoundingClientRect();
      const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
      return button === hit || button.contains(hit);
    }), `Continue remains reachable above navigation at ${width}`);
  }
  mkdirSync('outputs/learning-paths-review-20261018', { recursive: true });
  await page.screenshot({ path: 'outputs/learning-paths-review-20261018/spelling-mobile.png' });
  await page.setViewportSize({ width: 1366, height: 950 });
  await page.screenshot({ path: 'outputs/learning-paths-review-20261018/spelling-desktop.png' });
  console.log('PASS canonical spelling mask, five viewport widths and 48px targets');

  const grammar = chapterCollections('grammar-path').find(item => item.id.includes('grammar-we'));
  const trial = grammar.exercises.find(item => item.mode === 'learning-choice');
  await open('grammar', 'grammar-path', grammar, trial);
  assert.equal(await page.locator('.cp-learning-task h4').innerText(), trial.question);
  assert.equal(await page.locator('.cp-source-text').count(), 0, 'Grammar source must not reveal the answer');
  assert(await forward().isDisabled());
  console.log('PASS original grammar question without visible answer model');

  for (const [chapter, activity] of [['texts', 'reading-path'], ['practical', 'practical-path']]) {
    const collection = await open(chapter, activity);
    for (const exercise of collection.exercises) {
      assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'), exercise.exerciseId);
      if (exercise.mode.startsWith('connected-')) {
        await page.waitForFunction(() => !document.querySelector('.cp-exercise-feedback > button')?.disabled);
      } else if (exercise.mode === 'dialogue-role') {
        await page.locator('.cp-recorder').getByRole('button', { name: 'Klaar', exact: true }).click();
      } else if (exercise.mode === 'functional-message') {
        await page.getByRole('textbox', { name: 'Jouw bericht', exact: true }).fill(exercise.writingTask.example);
        await page.getByRole('button', { name: 'Kijk na', exact: true }).click();
        await page.getByRole('button', { name: 'Samen nakijken', exact: true }).click();
      } else if (exercise.standardTask?.kind === 'mark') {
        for (const id of exercise.standardTask.acceptedSelections[0]) await page.locator(`[data-word-token="${id}"]`).click();
        await page.getByRole('button', { name: 'Controleer', exact: true }).click();
      } else {
        const answer = exercise.options.find(option => exercise.answer.correctOptionIds.includes(option.id));
        await page.locator('.cp-extended-task').getByRole('button', { name: answer.label, exact: true }).click();
      }
      await forward().click();
    }
    await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  }
  console.log('PASS complete text and dialogue paths, own speaking turn and writing criteria finish without dead ends');

  await page.evaluate(key => localStorage.removeItem(key), learningReviewKey);
  await open('repeat', 'learning-review', null);
  assert.equal(await page.locator('[data-collection]').count(), 0, 'Never introduce unseen targets through review');
  const review = sound.exercises.find(item => item.reviewEligible);
  await page.evaluate(({ key, id }) => localStorage.setItem(key, JSON.stringify({ [id]: { due: 0, last: 1, streak: 0 } })), { key: learningReviewKey, id: review.exerciseId });
  await page.goto(`${base}/#learner/review`);
  await page.getByRole('link', { name: 'Oefen opnieuw', exact: true }).click();
  await page.locator('[data-collection]').first().waitFor();
  assert.equal(await page.locator('[data-collection]').count(), 1);
  await page.locator('[data-collection]').click();
  assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'), review.exerciseId);
  await page.waitForFunction(() => !document.querySelector('.cp-learning-task .cp-choice-grid button')?.disabled);
  await page.locator('.cp-learning-task .cp-choice-grid button').filter({ hasText: new RegExp(`^${review.answer.correctOptionIds[0]}$`) }).click();
  const schedule = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), learningReviewKey);
  assert(schedule[review.exerciseId].due > Date.now());
  await forward().click();
  await page.getByRole('button', { name: 'Andere opdracht', exact: true }).last().click();
  assert.equal(await page.locator('[data-collection]').count(), 0);
  console.log('PASS only due encountered work appears, successful recall schedules the next day');

  await open('sounds', 'sound-path', sound, sound.exercises[2]);
  await page.evaluate(() => { window.__audioFail = true; });
  await page.locator('.cp-learning-task').getByRole('button', { name: 'Luister', exact: true }).click();
  await page.waitForTimeout(120);
  assert(await page.locator('.cp-learning-task .cp-choice-grid button').first().isDisabled());
  await page.evaluate(() => { window.__audioFail = false; });
  await page.locator('.cp-learning-task').getByRole('button', { name: 'Luister', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('.cp-learning-task .cp-choice-grid button')?.disabled);
  for (const [chapter, activity] of [['sounds', 'sound-path'], ['spelling', 'spelling-path'], ['grammar', 'grammar-path']]) {
    const collection = chapterCollections(activity)[0];
    await open(chapter, activity, collection, collection.exercises[0]);
    for (const exercise of collection.exercises) {
      assert.equal(await page.locator('.is-mixed-round').getAttribute('data-exercise-id'), exercise.exerciseId);
      if (exercise.componentId === 'ALF-CMP-005') { await answerActivity(page, exercise, { checkFocus: false }); continue; }
      if (exercise.mode === 'learning-choice') {
        await page.waitForFunction(() => !document.querySelector('.cp-learning-task .cp-choice-grid button')?.disabled);
        const correctIndex = exercise.options.findIndex(option => exercise.answer.correctOptionIds.includes(option.id));
        await page.locator('.cp-learning-task .cp-choice-grid button').nth(correctIndex).click();
      }
      await forward().click();
    }
    await page.getByRole('heading', { name: 'Goed geoefend', exact: true }).waitFor();
  }
  console.log('PASS complete sound, spelling and grammar routes, including the existing word/sentence builders');
  assert.deepEqual(errors, []);
  console.log('PASS failed audio blocks answers, retry restores the exercise, no page errors');
} finally { await browser.close(); }
