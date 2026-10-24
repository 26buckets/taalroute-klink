import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chapterCollections, chapterExerciseChoices, chapterHash, parseChapterHash, matchesChapterSelection } from '../lib/practice-chapters.ts';
const collection = chapterCollections('meet').find(item => item.title === 'pen · kip');
const location = { chapter: 'words', activity: 'meet', collection: collection.id, level: collection.level };
test('Exercise choices retain exact collection, filters and real routes across skills', () => {
  const choices = chapterExerciseChoices(location);
  for (const id of ['meet', 'listen', 'read', 'build-model', 'sound-compare', 'speak']) assert(choices.some(item => item.id === id), id);
  assert.equal(new Set(choices.map(item => item.id)).size, choices.length);
  for (const choice of choices) {
    const next = { ...location, chapter: choice.chapter, activity: choice.id, collection: choice.collection };
    assert.deepEqual(parseChapterHash(chapterHash(next)), next);
    const candidate = chapterCollections(choice.id).find(item => item.id === choice.collection);
    assert.equal(candidate.pack.id, collection.pack.id);
    assert(matchesChapterSelection(candidate, location));
  }
});
test('Unavailable collections and due-only review cannot acquire unrelated shortcuts', () => {
  assert.deepEqual(chapterExerciseChoices({ ...location, collection: 'does-not-exist' }), []);
  assert.deepEqual(chapterExerciseChoices({ ...location, activity: 'learning-review' }), []);
  assert.deepEqual(chapterExerciseChoices({ ...location, level: 'b1' }), []);
  assert.deepEqual(chapterExerciseChoices({ level: 'all' }), []);
});
