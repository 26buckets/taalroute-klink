import test from 'node:test';
import assert from 'node:assert/strict';
import { contentPackages, getPackage, allPackageWords } from '../lib/package-content.ts';
import { taalroutePackages } from '../lib/taalroute-packages.ts';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import pack from '../data/klink-lexicon-wordbuild-20.json' with { type: 'json' };
test('Twenty additional words preserve every existing package and are reachable', () => {
  assert.deepEqual(contentPackages.slice(0, taalroutePackages.length), taalroutePackages);
  assert.equal(getPackage(pack.id), contentPackages.find(item => item.id === pack.id));
  assert.equal(pack.exercises.length, 20);
  assert.equal(pack.words.length, 20);
  assert.equal(new Set(allPackageWords.map(word => word.id)).size, allPackageWords.length);
  assert.equal(pack.media.publication, 'blocked');
  assert.equal(chapterCollections('build-model').filter(row => row.pack.id === pack.id).flatMap(row => row.exercises).length, 20);
  for (const word of pack.words) assert.equal(allPackageWords.filter(row => row.id === word.id).length, 1);
});
test('No listening activity is offered without audio; model answers stay exact', () => {
  for (const activity of ['dictation', 'build', 'worksheet-heard', 'listen', 'hear-word', 'hear-match', 'paper-dictation']) assert.equal(groupExercises(pack, activity).length, 0, activity);
  assert.equal(groupExercises(pack, 'build-model').length, 20);
  assert.equal(groupExercises(pack, 'worksheet').length, 20);
  for (const activity of groupActivities.filter(item => !pack.practiceActivities.includes(item.id))) assert.equal(groupExercises(pack, activity.id).length, 0, activity.id);
  for (const ex of pack.exercises) {
    assert.equal(ex.requiresAudio, false); assert.equal(ex.prompt.audio, undefined);
    assert.equal(ex.answer.targetTileIds.map(id => ex.tiles.find(tile => tile.id === id).token).join(''), ex.exampleWord);
  }
  assert.equal(new Set(pack.lessons.flatMap(lesson => lesson.guidedExerciseIds)).size, 20);
});
