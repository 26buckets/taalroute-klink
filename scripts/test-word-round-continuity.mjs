import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { wordRoundActivities, chapterWordRounds, selectChapterWords } from '../lib/word-rounds.ts';
import { chapterCollections, displayedChapterCollections, chapterExerciseChoices, selectedChapterCollection, chapterHash, parseChapterHash, practiceChapters } from '../lib/practice-chapters.ts';
import { collectionProgressId, roundProgressCount, recordRoundSteps, roundProgressPrefix } from '../lib/round-progress.ts';
const sorted = ids => [...new Set(ids)].sort((a,b)=>a.localeCompare(b));
let collections = 0, rounds = 0, tasks = 0, switches = 0;
for (const activity of wordRoundActivities) {
  const chapter = practiceChapters.find(c => c.activities.includes(activity)).id;
  for (const source of chapterCollections(activity)) {
    const children = chapterWordRounds(source);
    if (!children[0].wordRound) continue;
    const es = source.contentUrl ? JSON.parse(readFileSync('public' + source.contentUrl)).exercises : source.exercises;
    const before = JSON.stringify(source);
    assert.deepEqual(sorted(children.flatMap(c => c.wordRound.exerciseIds)), sorted(es.map(e => e.exerciseId)), `${source.id}: all original tasks remain`);
    assert.equal(children.flatMap(c => c.wordRound.exerciseIds).length, es.length, 'No task copied into two rounds');
    for (const child of children) {
      assert(child.wordRound.wordIds.length > 0 && child.wordRound.wordIds.length <= 8);
      assert.equal(new Set(child.wordRound.wordIds).size, child.wordRound.wordIds.length);
      const location = { chapter, activity, collection: child.id, level: source.level, help: source.help };
      assert.equal(parseChapterHash(chapterHash(location)).collection, child.id);
      assert.equal(selectedChapterCollection(location), child, 'Stable exercise references protect player state');
      const selected = new Set(child.wordRound.exerciseIds);
      for (const boardId of new Set(es.filter(e => e.boardId && selected.has(e.exerciseId)).map(e => e.boardId))) {
        assert(es.filter(e => e.boardId === boardId).every(e => selected.has(e.exerciseId)), 'A board remains complete');
      }
    }
    assert.equal(JSON.stringify(source), before, 'Original exercises, choices, audio, media and IDs never mutate');
    collections++; rounds += children.length; tasks += es.length;
  }
  for (const level of ['alfa-a','alfa-b','alfa-c','a1','a2','b1']) for (const help of ['practice','guided']) {
    const base = { chapter, activity, level, help };
    const children = displayedChapterCollections(activity, base).filter(c => c.wordRound);
    for (const child of [children[0], children.at(-1)].filter(Boolean)) {
      const location = { ...base, collection: child.id };
      const choices = chapterExerciseChoices(location);
      assert(choices.some(c => c.id === activity), `${activity}/${child.id}: current mode remains available`);
      for (const choice of choices) {
        const next = { ...base, chapter: choice.chapter, activity: choice.id, collection: choice.collection, words: choice.words };
        assert.deepEqual(parseChapterHash(chapterHash(next)), next);
        const selected = selectedChapterCollection(next);
        assert.deepEqual(sorted(selected.wordRound.wordIds), sorted(child.wordRound.wordIds), 'Every offered mode retains exactly the selected word set');
        const source = chapterCollections(choice.id).find(c => c.id === choice.collection);
        const es = source.contentUrl ? JSON.parse(readFileSync('public' + source.contentUrl)).exercises : source.exercises;
        const actual = es.filter(e => selected.wordRound.exerciseIds.includes(e.exerciseId));
        assert.deepEqual(sorted(actual.flatMap(e => e.targetWordIds?.length ? e.targetWordIds : [e.wordId])), sorted(child.wordRound.wordIds));
        assert.equal(new Set(selected.wordRound.allExerciseIds).size, es.length, 'Progress uses the complete original parent, never the smaller total');
        assert.deepEqual(selectChapterWords(source, next.words), selected);
        switches++;
      }
    }
  }
}
// Full historical links and large fixed word boards also never switch to a different pool.
for (const activity of ['meet', 'word-sort', 'match']) for (const source of chapterCollections(activity).filter(c => c.exercises.length && !c.exercises.some(e => e.contextId || e.learningPathId))) {
  const original = sorted(source.exercises.flatMap(e => e.targetWordIds?.length ? e.targetWordIds : e.wordId ? [e.wordId] : []));
  const location = { chapter: practiceChapters.find(c => c.activities.includes(activity)).id, activity, collection: source.id, level: source.level, help: source.help };
  const current = selectedChapterCollection(location);
  if (current?.wordRound || !original.length) continue;
  for (const choice of chapterExerciseChoices(location)) {
    const destination = selectedChapterCollection({ ...location, chapter: choice.chapter, activity: choice.id, collection: choice.collection });
    assert.deepEqual(sorted(destination.exercises.flatMap(e => e.targetWordIds?.length ? e.targetWordIds : [e.wordId])), original, 'Historical full links and fixed boards retain their entire original word set');
  }
}
const base = { chapter: 'words', activity: 'meet', level: 'b1', help: 'practice' };
const round = displayedChapterCollections('meet',base).find(c => c.wordRound);
for (const invalid of [['unknown-word'], [''], Array(9).fill(round.wordRound.wordIds[0]), [round.wordRound.wordIds[0],round.wordRound.wordIds[0]]]) {
  assert.equal(parseChapterHash(chapterHash({...base,collection:round.wordRound.sourceId,words:invalid})).collection, undefined, 'Invalid selections never silently open the full bank');
}
const memory = new Map(); globalThis.window = new EventTarget(); globalThis.localStorage = {getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
for(const choice of chapterExerciseChoices({...base,collection:round.id})) {
  const selected = selectedChapterCollection({...base,chapter:choice.chapter,activity:choice.id,collection:choice.collection,words:choice.words});
  const ids = selected.wordRound.allExerciseIds, selectedIds = selected.wordRound.exerciseIds;
  const outside = ids.find(id=>!selectedIds.includes(id));
  const key = collectionProgressId(choice.id,choice.collection,selected.contentUrl);
  const before = JSON.stringify({version:1,total:ids.length,done:outside?[outside]:[]}); memory.set(roundProgressPrefix+key,before);
  assert.equal(roundProgressCount(key,ids.length,selectedIds),0); assert.equal(memory.get(roundProgressPrefix+key),before);
  recordRoundSteps(key,ids,[selectedIds[0]]);
  assert.equal(roundProgressCount(key,ids.length,selectedIds),1);
  if(outside) assert(JSON.parse(memory.get(roundProgressPrefix+key)).done.includes(outside), 'Completion from other rounds survives');
}
console.log(`PASS continuity: ${collections} collections, ${rounds} small rounds, ${tasks} unchanged tasks, ${switches} exact-word switches; whole boards, old/new links, invalid selections and shared progress`);
