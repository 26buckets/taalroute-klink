import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sourceSpellingReview, sourceSpellingRecallExercises, sourceSpellingRecallIds } from '../lib/source-spelling-review.ts';
import { productionIndex, validateProductionCollection } from '../lib/production-practice.ts';
import { availableChapterCollections } from '../lib/practice-chapters.ts';
import { parseLearningReview, updateLearningReview } from '../lib/learning-review.ts';

const day = 86400000, now = 1800000000000;
assert.equal(sourceSpellingRecallIds.size, 10);
const bankRows = productionIndex.filter(row => ['production:spelling-path:alfa-a:ZSH-A01', 'production:spelling-path:alfa-a:ZSH-A02'].includes(row.id));
let enabled = 0;
for (const row of bankRows) {
  const bank = JSON.parse(readFileSync('public' + row.url));
  const before = structuredClone(bank);
  const items = validateProductionCollection(bank, row.id, row.count);
  assert.deepEqual(bank, before);
  for (const item of items) {
    const original = before.exercises.find(e => e.exerciseId === item.exerciseId);
    const recall = sourceSpellingRecallExercises.find(e => e.exerciseId === item.exerciseId);
    assert.deepEqual(item, recall ? { ...original, reviewEligible: true } : original);
    if (recall) { enabled++; assert.deepEqual(item, recall); }
  }
}
assert.equal(enabled, 10);
const due = (state, time) => availableChapterCollections('learning-review', { level: 'alfa-a', help: 'guided' }, state, time).find(c => c.id === sourceSpellingReview.collectionId)?.exercises ?? [];
assert.deepEqual(due({}, now), []);
for (const exercise of sourceSpellingRecallExercises) {
  const attempt = { exerciseId: exercise.exerciseId, assessment: 'answer', reviewEligible: true, correct: true, attempts: 1, helpUsed: false, support: 'none' };
  const retained = { 'old:recall:word': { due: 1, last: 0, streak: 0 } };
  let state = updateLearningReview(retained, attempt, now);
  assert.deepEqual(parseLearningReview(JSON.stringify(state)), state);
  assert.deepEqual(state['old:recall:word'], retained['old:recall:word']);
  assert.deepEqual(due(state, now + day - 1), []);
  assert.deepEqual(due(state, now + day), [exercise]);
  assert.deepEqual(updateLearningReview(state, attempt, now + 1000), state);
  state = parseLearningReview(JSON.stringify(updateLearningReview(state, attempt, now + day)));
  assert.equal(state[exercise.exerciseId].due, now + 4 * day);
  state = parseLearningReview(JSON.stringify(updateLearningReview(state, attempt, now + 4 * day)));
  assert.equal(state[exercise.exerciseId].due, now + 11 * day);
  for (const change of [{ correct: false }, { helpUsed: true }, { attempts: 2 }, { support: 'model' }]) {
    const retry = updateLearningReview(state, { ...attempt, ...change }, now + 11 * day);
    assert.equal(retry[exercise.exerciseId].streak, 0);
    assert.equal(retry[exercise.exerciseId].due, now + 11 * day);
  }
}
assert.deepEqual(parseLearningReview('{broken'), {});
assert.deepEqual(parseLearningReview('{"not-recall":{"due":1,"last":0,"streak":1},"bad:recall":{"due":-1,"last":0,"streak":1}}'), {});
console.log('Ten original recalls: unchanged banks/IDs, due-only access, 1/3/7 intervals, reload, error/help and prior storage preservation passed.');
