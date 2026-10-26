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
      if (mode === 'practice') assert(item.exercises.every(e => e.access !== 'teacher-supported' && !e.learningPathId && !e.contextId));
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
