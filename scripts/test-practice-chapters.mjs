import test from 'node:test';
import { exerciseSetHelp } from '../lib/content-levels.ts';
import { importedItems, importedExercise, importedRoutes } from '../lib/imported-practice.ts';
import assert from 'node:assert/strict';
import { practiceChapters, chapterCollections, chapterExerciseLevel, chapterHash, parseChapterHash } from '../lib/practice-chapters.ts';
import { contentPackages as packs } from '../lib/package-content.ts';
import { groupActivities, groupExercises } from '../lib/group-practice.ts';
import { contentById } from '../lib/connected-content.ts';
import { synonymCollections, synonymActivities } from '../lib/synonyms.ts';
import { wordUseCollections } from '../lib/word-use.ts';
import complete from '../docs/klink-complete-release-20261101/import-manifest.json' with {type:'json'};
import reviewedB1 from '../docs/b1-reviewed-release-20261101/b1-release-manifest.json' with {type:'json'};
import { writingDictationRounds } from '../lib/writing-dictation.ts';

void test('Twelve independent chapters cover all registered activities without changing Lexicon', () => {
  const before = JSON.stringify(packs);
  assert.equal(practiceChapters.length, 12);
  assert.equal(new Set(practiceChapters.map(item => item.id)).size, 12);
  for (const activity of groupActivities) {
    assert(practiceChapters.some(chapter => chapter.activities.includes(activity.id)), activity.id);
    const collections = chapterCollections(activity.id);
    assert(collections.length, activity.id);
    assert.equal(new Set(collections.map(item => item.id)).size, collections.length, `${activity.id}: unique collections`);
    for (const collection of collections) {
      const writing = writingDictationRounds.find(round => round.id === collection.id);
      if (writing) {
        assert.equal(activity.id, 'dictation');
        assert.deepEqual(collection.exercises, writing.exercises);
        assert([6, 7].includes(collection.exercises.length));
        continue;
      }
      if (collection.sourceRepeat) {
        assert.equal(activity.id, 'learning-review');
        assert.equal(collection.exercises.length, 0, 'Repetition references original banks');
        assert.equal(collection.exerciseCount, 12);
        assert.equal(collection.sourceRepeat.positions.length, 12);
        continue;
      }
      if (collection.contentUrl) {
        assert.equal(collection.exercises.length, 0, 'Deferred content stays out of the startup bundle');
        assert(collection.exerciseCount > 0);
        assert(/^\/practice-content\/(klink-20261029|word-self-20261031|reading-rounds-20261031|complete-20261101|klink-writing-20261101|klink-handwriting-20261102|b1-review-20261101|klink10-grammar-20261102)\//.test(collection.contentUrl));
        continue;
      }
      assert(collection.exercises.length);
      const source = new Map(groupExercises(collection.pack, activity.id).map(item => [item.exerciseId, item]));
      for (const item of collection.exercises) assert.deepEqual(item, source.get(item.exerciseId), 'Keep source IDs, answers, media, reading conditions and assessment unchanged');
    }
    const original = activity.id.startsWith('content-') ? importedItems.filter(item=>item.domain===importedRoutes.find(route=>route.id===activity.id).domain).map(importedExercise) : [...packs, ...([...synonymActivities, 'learning-review'].includes(activity.id) ? synonymCollections.map(collection => collection.pack) : []), ...wordUseCollections.filter(collection=>collection.pack.practiceActivities.includes(activity.id)).map(collection=>collection.pack)].flatMap(pack => groupExercises(pack, activity.id));
    const connected = collections.filter(item => !writingDictationRounds.some(round => round.id === item.id)).flatMap(item => item.exercises);
    const key = item => item.contextId && activity.id !== 'word-sentence' ? `${item.mode}:${item.contextId}` : item.exerciseId;
    assert.deepEqual(new Set(connected.map(key)), new Set(original.map(key)), `${activity.id}: no lost content`);
    for (const pack of packs) {
      const boards = Map.groupBy(original.filter(item => item.boardId && item.exerciseId.startsWith(pack.id + ':')), item => item.boardId);
      for (const [boardId, turns] of boards) {
        const owners = collections.filter(collection => collection.exercises.some(item => item.boardId === boardId));
        assert.equal(owners.length, 1, `${activity.id}/${boardId}: don't split a bingo card by level`);
        assert.deepEqual(owners[0].exercises.filter(item => item.boardId === boardId), turns);
      }
    }
  }
  assert.equal(JSON.stringify(packs), before);
});

void test('Source levels are honest, never inferred from matching words or a completed activity', () => {
  for (const activity of ['texts', 'text-question', 'dialogue-role', 'functional-message']) {
    for (const collection of chapterCollections(activity)) for (const exercise of collection.exercises) {
      assert.equal(exercise.independentReading, false);
      const source = contentById.get(exercise.contextId);
      assert(source);
      const levels = [source.sourceLevel, exercise.activityLevel].filter(Boolean);
      assert.equal(collection.level, levels.some(level => /^a2(?:_|$)/i.test(level)) ? 'a2' : /^a1(?:_|$)/i.test(source.sourceLevel) ? 'a1' : 'support');
    }
  }
  assert.equal(chapterExerciseLevel({ exerciseId: 'unknown', componentId: '', contractVersion: '', mode: '' }), 'support');
  assert(chapterCollections('texts').some(item => item.level === 'a2'));
  assert.equal(new Set(chapterCollections('texts').flatMap(item => item.exercises.map(exercise => exercise.contextId))).size, 192);
  assert.equal(chapterCollections('text-question').length, 268);
  assert.equal(chapterCollections('dialogues').length, 128);
});

void test('All 158 complete-release rounds are available through the existing level menus and links',()=>{
 for(const original of complete.rows){
  const revision=reviewedB1.rows.find(entry=>entry.before.id===original.id);
  if(revision){assert.deepEqual(revision.before,original);assert.deepEqual({...revision.after,url:original.url},original);}
  const row=revision?.after??original;
  const collection=chapterCollections(row.activity).find(c=>c.id===row.id);assert(collection,row.id);
  assert.equal(collection.level,row.level);assert.equal(collection.contentUrl,row.url);assert.equal(collection.exerciseCount,row.count);
  const chapter=practiceChapters.find(c=>c.activities.includes(row.activity));
  assert.equal(parseChapterHash(chapterHash({chapter:chapter.id,activity:row.activity,collection:row.id,level:row.level,help:'practice'})).collection,row.id);
 }
});

void test('Deep links validate chapter, activity, collection and level; stale links fail safely', () => {
  for (const chapter of practiceChapters) for (const activity of chapter.activities) {
    const collection = chapterCollections(activity)[0];
    const location = { chapter: chapter.id, activity, collection: collection.id, level: collection.level };
    assert.deepEqual(parseChapterHash(chapterHash(location)), { ...location, help: exerciseSetHelp(collection.exercises) });
  }
  assert.deepEqual(parseChapterHash('#learner/chapters/%ED'), { level: 'all' });
  assert.deepEqual(parseChapterHash('#learner/chapters/unknown/texts'), { level: 'all' });
  assert.equal(parseChapterHash('#learner/chapters/sounds/functional-form').activity, undefined);
  assert.equal(parseChapterHash('#learner/chapters/texts/texts/missing?level=b1').collection, undefined);
});
