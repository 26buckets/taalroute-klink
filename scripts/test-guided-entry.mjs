import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterCollections, chapterHash, matchesChapterSelection, parseChapterHash, practiceChapters } from '../lib/practice-chapters.ts';
import { exerciseSetHelp } from '../lib/content-levels.ts';

test('Every collection has exactly one practice entrance; legacy direct links retain it', () => {
  let checked = 0;
  for (const chapter of practiceChapters) for (const activity of chapter.activities) {
    for (const item of chapterCollections(activity)) {
      const location = { chapter: chapter.id, activity, collection: item.id, level: 'all' };
      const mode = exerciseSetHelp(item.exercises);
      const other = mode === 'guided' ? 'practice' : 'guided';
      assert(matchesChapterSelection(item, { ...location, help: mode }));
      assert(!matchesChapterSelection(item, { ...location, help: other }));
      const restored = parseChapterHash(chapterHash(location));
      assert.equal(restored.collection, item.id);
      assert.equal(restored.help, mode);
      assert.equal(parseChapterHash(chapterHash({ ...location, help: other })).collection, undefined);
      if (mode === 'practice') assert(item.exercises.every(e => e.access !== 'teacher-supported' && !e.learningPathId && (!e.contextId || (e.mode === 'connected-dialogue' && e.access === 'supported-listening' && e.assessment === 'participation'))));
      checked++;
    }
  }
  assert(checked > 100);
  console.log('Collections checked:', checked);
});

test('Root choice and bookmarked mode survive route serialization', () => {
  assert.deepEqual(parseChapterHash('#learner/chapters'), { level: 'all' });
  for (const help of ['practice', 'guided']) assert.deepEqual(parseChapterHash(chapterHash({ level: 'all', help })), { level: 'all', help });
  const spelling = parseChapterHash('#learner/chapters/spelling/content-spelling');
  assert.equal(spelling.help, 'guided');
});

test('Only recorded dialogue listening moves to independent practice; participation never implies comprehension', () => {
  const dialogues = chapterCollections('dialogues');
  assert.equal(dialogues.length, 128);
  for (const item of dialogues) {
    assert.equal(exerciseSetHelp(item.exercises), 'practice');
    for (const exercise of item.exercises) {
      assert.equal(exercise.assessment, 'participation');
      assert.equal(exercise.independentReading, false);
      assert.notEqual(exercise.reviewEligible, true);
      assert.equal(exerciseSetHelp([{...exercise, access:'teacher-supported'}]), 'guided');
      assert.equal(exerciseSetHelp([{...exercise, assessment:'answer'}]), 'guided');
      assert.equal(exerciseSetHelp([{...exercise, learningPathId:'retained-path'}]), 'guided');
      assert.equal(exerciseSetHelp([exercise, {...exercise, access:'teacher-supported'}]), 'guided');
    }
  }
  for (const chapter of practiceChapters) for (const activity of chapter.activities.filter(id => id !== 'dialogues')) {
    for (const item of chapterCollections(activity)) {
      assert(item.exercises.every(e => e.mode !== 'connected-dialogue' || e.learningPathId));
    }
  }
});
