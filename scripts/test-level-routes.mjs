import {localGrammarExercises} from '../lib/local-grammar-lessons.ts';
import test from 'node:test';
import { importedItems } from '../lib/imported-practice.ts';
import { importedLevels } from '../lib/imported-practice-contract.ts';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { contentById, contentReadingConditions } from '../lib/connected-content.ts';
import { availableContentLevels, contentLevels, exerciseContentLevel, exerciseSetLevel, exerciseSetHelp, selectExerciseSet } from '../lib/content-levels.ts';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
import { chapterCollections, chapterHash, parseChapterHash } from '../lib/practice-chapters.ts';
import { defaultRouteSettings, parseRouteSettings, practiceStages, contextReadiness, lessonWordIds, scopeWordExercises, selectUsageExercises } from '../lib/learner-route.ts';

void test('Six levels and support are distinct; malformed preferences cannot change curriculum or grant a level', () => {
  assert.deepEqual(contentLevels.filter(item => !['all', 'support'].includes(item.id)).map(item => item.label), ['Alfa A', 'Alfa B', 'Alfa C', 'A1', 'A2', 'B1']);
  assert.deepEqual(['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1'].filter(level => availableContentLevels.has(level)), ['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1']);
  assert.deepEqual(parseRouteSettings('bad'), defaultRouteSettings);
  assert.deepEqual(parseRouteSettings('null'), defaultRouteSettings);
  assert.deepEqual(parseRouteSettings('{"literacy":"b1","language":"alfa-a","pictures":"anything"}'), defaultRouteSettings);
  assert.deepEqual(parseRouteSettings('{"literacy":"alfa-a","language":"a2","pictures":"request"}'), { literacy: 'alfa-a', language: 'a2', pictures: 'request' });
});

void test('All existing activities have exactly one place in the growth sequence', () => {
  for (const item of groupActivities) assert.equal(practiceStages.filter(stage => stage.activities.includes(item.id)).length, 1, item.id);
});

void test('A difficult context never inherits Alfa A from a matching target word', () => {
  const source = [...contentById.values()].find(item => item.sourceLevel === 'A2');
  assert.equal(exerciseContentLevel({ contextId: source.id, wordId: 'klink-woord-mat', learningPathId: 'path' }), 'a2');
  assert.equal(exerciseContentLevel({ contextId: 'not-a-source', wordId: 'klink-woord-mat' }), 'support');
  assert.equal(exerciseSetHelp([{ wordId: 'klink-woord-mat', access: 'supported-listening' }]), 'practice');
  assert.equal(exerciseSetHelp([{ wordId: 'klink-woord-mat', learningPathId: 'path' }]), 'guided');
});

void test('Filtering preserves whole boards and learning sequences, order, IDs and source bytes', () => {
  for (const pack of packs) for (const activity of groupActivities) {
    const source = groupExercises(pack, activity.id), before = JSON.stringify(source);
    assert.deepEqual(selectExerciseSet(source, { level: 'all' }), source);
    for (const level of ['alfa-a', 'alfa-b', 'alfa-c', 'a1', 'a2', 'b1', 'support']) {
      const selected = selectExerciseSet(source, { level });
      assert(selected.every(item => source.includes(item)));
      for (const item of selected) {
        if (item.boardId) assert.deepEqual(selected.filter(row => row.boardId === item.boardId), source.filter(row => row.boardId === item.boardId));
        if (item.learningPathId) assert.deepEqual(selected.filter(row => row.learningPathId === item.learningPathId), source.filter(row => row.learningPathId === item.learningPathId));
      }
    }
    assert.equal(JSON.stringify(source), before);
  }
});

void test('The first mat step cannot invent a choice set or split a mixed board', () => {
  const pack = packs[0], ids = lessonWordIds(pack, pack.lessons[0]);
  assert.deepEqual(ids, ['klink-woord-mat']);
  assert.equal(scopeWordExercises(groupExercises(pack, 'meet'), ids).length, 1);
  assert.equal(scopeWordExercises(groupExercises(pack, 'word-bingo'), ids).length, 0);
  assert.equal(scopeWordExercises(groupExercises(pack, 'listen'), ids).length, 0);
  const path = [
    { exerciseId: 'example', learningPathId: 'whole-path', wordId: ids[0] },
    { exerciseId: 'practice', learningPathId: 'whole-path', wordId: ids[0], prerequisiteWordIds: ['unprepared-word'] },
  ];
  assert.deepEqual(scopeWordExercises(path, ids), []);
  assert.deepEqual(scopeWordExercises(path, [...ids, 'unprepared-word']), path);
  assert.deepEqual(scopeWordExercises([{ exerciseId: 'board', wordId: ids[0], cells: [{ cellId: 'unprepared-word' }] }], ids), []);
});

void test('Readiness retains higher and unprepared sources for later; no invented independent reading', () => {
  for (const pack of packs) for (const item of [...pack.texts, ...pack.dialogues]) {
    const placement = contextReadiness(item.id, pack, pack.lessons[0], defaultRouteSettings);
    assert.notEqual(placement.status, 'independent');
    if (placement.level === 'a2') {
      assert.equal(placement.status, 'later');
      assert.equal(contextReadiness(item.id, pack, undefined, { ...defaultRouteSettings, language: 'a1' }).status, 'later');
      const source = contentById.get(item.id);
      const conditions = contentReadingConditions(source, { id: pack.id, known: pack.words.map(word => word.id) });
      const unpreparedSentence = source.kind === 'sentence' && (conditions.otherWords.length || conditions.outsideWordBank.length || conditions.unitsOutsideStep.length);
      assert.equal(contextReadiness(item.id, pack, undefined, { ...defaultRouteSettings, language: 'a2' }).status, unpreparedSentence ? 'later' : 'guided');
    }
  }
});

void test('All contextual exercises remain reachable across readiness buckets without splitting chains', () => {
  for (const pack of packs) for (const activity of practiceStages.find(stage => stage.id === 'use').activities) {
    const original = groupExercises(pack, activity), before = JSON.stringify(original);
    const buckets = ['independent', 'guided', 'later'].map(status => selectUsageExercises(original, pack, undefined, defaultRouteSettings, status));
    assert.equal(buckets.flat().length, original.length);
    assert.deepEqual(new Set(buckets.flat().map(item => item.exerciseId)), new Set(original.map(item => item.exerciseId)));
    for (const bucket of buckets) for (const item of bucket) if (item.learningPathId) assert.deepEqual(bucket.filter(row => row.learningPathId === item.learningPathId), original.filter(row => row.learningPathId === item.learningPathId));
    assert.equal(JSON.stringify(original), before);
  }
});

void test('Chapter navigation retains level, help and old supported path links', () => {
  const location = { level: 'alfa-c', help: 'guided' };
  assert.deepEqual(parseChapterHash(chapterHash(location)), location);
  const collection = chapterCollections('sound-path')[0];
  assert.equal(collection.level, exerciseSetLevel(collection.exercises));
  const old = parseChapterHash(chapterHash({ chapter: 'sounds', activity: 'sound-path', level: 'support', collection: collection.id }));
  assert.equal(old.collection, collection.id);
  assert.equal(old.level, collection.level);
  for (const activity of groupActivities) for (const collection of chapterCollections(activity.id).filter(item=>['alfa-c','b1'].includes(item.level))) assert(collection.exercises.every(exercise=>localGrammarExercises.some(row=>JSON.stringify(row)===JSON.stringify(exercise) && row.contentLevel===collection.level) || importedItems.some(item=>exercise.exerciseId===`content:${item.id}` && importedLevels[item.level]===collection.level) || (collection.pack.practiceActivities?.includes(activity.id) && exercise.vocabularyLevels?.includes(collection.level))), 'New levels require exact admitted content');
});
