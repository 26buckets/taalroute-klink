import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { curriculum, readingSteps, extensionSteps, wordsFor, wordStep, resolveStep, activitiesFor, spellingTiles, parseState, wordMedia, groupWords } from '../lib/klink-curriculum.ts';

test('Every meaning and all 40 base parts come from the fixed Lexicon edition', () => {
  assert.equal(curriculum.words.length, 338);
  assert.equal(new Set(curriculum.words.map(word => word.word)).size, 337);
  assert.equal(readingSteps.length, 40);
  assert.equal(readingSteps.filter(step => step.group).length, 37);
  assert.equal(extensionSteps.length, 23);
  assert.equal(curriculum.readingRoutes.routes.length, 5);
  assert.equal(curriculum.words.filter(word => word.firstReading.mode === 'reading-route').length, 78);
});
test('All words, core steps and extensions resolve and produce scaffolded activities', () => {
  for (const step of [...readingSteps, ...extensionSteps, ...curriculum.words.map(wordStep)]) {
    assert.equal(resolveStep(step.id).id, step.id);
    const activities = activitiesFor(step, curriculum.words.map(word => word.id));
    assert(activities.length > 0, step.id);
    assert.equal(new Set(activities.map(activity => activity.id)).size, activities.length);
    const models = new Set();
    for (const activity of activities) {
      assert.equal(wordsFor([activity.wordId]).length, 1);
      if (activity.kind === 'model') models.add(activity.wordId);
      else assert(models.has(activity.wordId));
      if (activity.kind === 'match' || activity.kind === 'listen') {
        assert.equal(activity.options.length, 2);
        assert(activity.options.includes(activity.wordId));
        assert.equal(new Set(wordsFor(activity.options).map(word => word.word)).size, 2);
        activity.options.forEach(id => assert(models.has(id), 'Every option is already modelled'));
      }
      if (activity.kind === 'listen') assert(wordMedia[activity.wordId]?.audio);
    }
  }
});
test('Recall never silently introduces words that have not yet been introduced', () => {
  const recall = readingSteps.find(step => step.kind === 'herhaalronde');
  assert.deepEqual(activitiesFor(recall, []), []);
  const introduced = [recall.returning[0]];
  assert(activitiesFor(recall, introduced).every(activity => introduced.includes(activity.wordId)));
});
test('Long-word prerequisites do not silently place the 78 words in a core group', () => {
  const grouped = curriculum.groups.flatMap(group => groupWords(group.group));
  assert.equal(new Set(grouped.map(word => word.id)).size, 253);
  assert(grouped.every(word => !['reading-route', 'preparation'].includes(word.firstReading.mode)));
});
test('Every spelling construction produces the original form, including repeated letters', () => {
  curriculum.words.forEach(word => assert.equal(spellingTiles(word).join(''), word.word));
});
test('The two pak meanings stay distinct and cannot be ambiguous distractors', () => {
  const meanings = curriculum.words.filter(word => word.word === 'pak');
  assert.equal(meanings.length, 2);
  assert.notEqual(meanings[0].meaning, meanings[1].meaning);
  assert(!wordMedia['klink-woord-pak-verpakking']?.image);
});
test('Storage is optional, validated and independent from old CP progress', () => {
  for (const raw of ['garbage', 'null', '[]', '{}']) assert.deepEqual(parseState(raw).introduced, []);
  assert.deepEqual(parseState(JSON.stringify({ introduced: ['bad', 1], completed: ['CP001'], lastStep: 'CP002' })), { introduced: [], completed: [], lastStep: undefined });
});
test('Every linked media file exists; no Drive links or rejected standalone sound', () => {
  for (const item of Object.values(wordMedia)) for (const path of [item.audio, item.image].filter(Boolean)) {
    assert(path.startsWith('/'));
    assert(!path.includes('..'));
    assert(existsSync(new URL(`../public${path}`, import.meta.url)), path);
    assert(!/\/t\.wav$|drive\.google|slash/i.test(path));
  }
  assert(!/drive\.google|diglin|CP00[1-9]/i.test(readFileSync(new URL('../data/klink-curriculum.json', import.meta.url), 'utf8')));
});
