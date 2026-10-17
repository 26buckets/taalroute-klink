import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { buildChecklist, buildStatusLabels, sentenceBridge } from '../lib/build-checklist.ts';

const find = id => {
  const pack = packs.find(item => item.lessons.some(lesson => lesson.id === id));
  return [pack, pack.lessons.find(item => item.id === id)];
};
test('Every existing step has the same goal checklist, exact bindings and no source mutations', () => {
  const before = JSON.stringify(packs);
  const statuses = new Set();
  let count = 0;
  for (const pack of packs) for (const lesson of pack.lessons) {
    count++;
    const rows = buildChecklist(pack, lesson);
    assert.equal(rows.length, 15);
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    const targets = lesson.newWords.length ? lesson.newWords : lesson.returning;
    for (const row of rows) {
      assert.equal(row.packageId, pack.id); assert.equal(row.lessonId, lesson.id);
      assert.deepEqual(row.wordIds, targets);
      assert(row.status in buildStatusLabels); statuses.add(row.status);
      assert(row.reason.length > 40);
      for (const id of row.exerciseIds) assert(pack.exercises.some(item => item.exerciseId === id && item.lessonId === lesson.id));
      for (const id of row.coveredWordIds) assert(targets.includes(id));
      for (const id of row.guidedWordIds) assert(row.coveredWordIds.includes(id));
      if (row.status === 'works') assert.deepEqual(row.guidedWordIds, targets);
    }
    assert.equal(rows.find(row => row.id === 'sentence-reading').status, 'missing');
    assert.equal(rows.find(row => row.id === 'sound-synthesis').status, 'missing');
    assert.equal(rows.find(row => row.id === 'sentence-building').status, 'missing');
    assert.notEqual(rows.find(row => row.id === 'repetition').status, 'works');
  }
  assert.equal(count, 302);
  assert.equal(statuses.size, 4);
  assert.equal(JSON.stringify(packs), before);
});
test('Works requires target coverage, guided connection, word media and instruction audio', () => {
  const [pack, lesson] = find('klink-leesstap-01');
  const row = (candidate, step = lesson) => buildChecklist(candidate, step).find(item => item.id === 'word-model');
  assert.equal(row(pack).status, 'works');
  assert.equal(row(pack, { ...lesson, guidedExerciseIds: [] }).status, 'partial');
  const words = pack.words.map(word => lesson.newWords.includes(word.id) ? { ...word, image: undefined } : word);
  assert.equal(row({ ...pack, words }).status, 'partial');
  const rejected = pack.words.map(word => lesson.newWords.includes(word.id) ? { ...word, audioStatus: 'rejected' } : word);
  assert.equal(row({ ...pack, words: rejected }).status, 'partial');
  const exercises = pack.exercises.map(item => ({ ...item, instructionAudio: undefined }));
  assert.equal(row({ ...pack, exercises }).status, 'partial');
  assert.equal(row({ ...pack, exercises: [] }).status, 'missing');
});
test('One word is consciously not made into a fake comparison; copying is not recognition', () => {
  const [pack, lesson] = find('klink-leesstap-01');
  const rows = buildChecklist(pack, lesson);
  assert.equal(rows.find(row => row.id === 'word-recognition').status, 'different');
  assert.equal(rows.find(row => row.id === 'word-meaning').status, 'different');
  const [pairPack, pairLesson] = find('klink-leesstap-02');
  const copyOnly = { ...pairPack, exercises: pairPack.exercises.filter(item => item.mode === 'same-word') };
  assert.equal(buildChecklist(copyOnly, pairLesson).find(row => row.id === 'word-recognition').status, 'missing');
});
test('Sentence bridge uses only contexts actually attached to the selected meaning and step', () => {
  let linked = 0;
  for (const pack of packs) for (const lesson of pack.lessons) {
    const bridge = sentenceBridge(pack, lesson);
    assert.equal(bridge.lessonId, lesson.id);
    assert.equal(bridge.packageId, pack.id);
    assert.equal(bridge.stages.length, 6);
    const prepared = new Set([...(lesson.known ?? []), ...lesson.newWords, ...lesson.returning]);
    const spellings = new Set(pack.words.filter(word => prepared.has(word.id)).map(word => word.word.toLowerCase()));
    for (const model of bridge.models) {
      linked++;
      assert.equal(model.independentReading, false);
      assert.equal(model.humanReview, 'approved');
      assert(model.wordIds.length > 0);
      for (const id of model.wordIds) assert(bridge.wordIds.includes(id));
      for (const id of model.exerciseIds) assert(pack.exercises.some(item => item.exerciseId === id && item.lessonId === lesson.id && item.contextId === model.id));
      for (const word of model.wordsOutsideStep) assert(!spellings.has(word));
    }
  }
  assert(linked > 12);
  const [pack, lesson] = find('klink-leesstap-04');
  const pan = sentenceBridge(pack, lesson).models.find(item => item.id === 'zin-pan');
  assert(pan);
  assert(pan.wordsOutsideStep.includes('een'));
  assert(!pan.wordsOutsideStep.includes('pan'));
  assert.equal(sentenceBridge(...find('klink-leesstap-01')).models.length, 0);
});
