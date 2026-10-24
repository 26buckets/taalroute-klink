import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { hasFirstLetterGuide, isBeginnerLesson, exerciseHelp } from '../lib/lesson-plan.ts';
import { teacherPracticePlan } from '../lib/teacher-practice-plan.ts';
import { readFileSync } from 'node:fs';
import { groupExercises } from '../lib/group-practice.ts';

test('The beginner route through kop/sok keeps letter guidance; later lessons and independent recall do not', () => {
  const all = packs.flatMap(pack => pack.lessons.flatMap(lesson => exercisesForLesson(pack, lesson)));
  const guided = all.filter(exercise => hasFirstLetterGuide(exercise, true));
  assert.deepEqual(guided.map(exercise => exercise.exampleWord), ['mat', 'tas', 'map', 'man', 'pan', 'jas', 'pen', 'pet', 'mes', 'kam', 'ik', 'kip', 'kin', 'pak', 'kat', 'in', 'en', 'is', 'kan', 'kast', 'mens', 'nek', 'kop', 'sok']);
  for (const exercise of guided) {
    assert.equal(exercise.mode, 'word-build');
    assert(exercise.prompt.audio.src);
    const ids = exercise.answer.targetTileIds;
    const tokens = ids.map(id => exercise.tiles.find(tile => tile.id === id).token);
    assert.equal(tokens.join(''), exercise.exampleWord);
    assert.equal(tokens.length, exercise.exampleWord.length, 'The diagram has exactly one slot for each letter');
    assert.equal(new Set(ids).size, ids.length, 'Each guided position has its own selectable tile');
    assert.match(exerciseHelp(exercise, true), /voorbeeld/);
  }
  assert(all.every(exercise => !hasFirstLetterGuide(exercise, false)), 'Free practice stays unchanged');
  for (const activity of ['build-model', 'worksheet', 'build']) {
    assert(groupExercises(packs[0], activity).every(exercise => !hasFirstLetterGuide(exercise, true)), `${activity}: guided rounds are not the beginner lesson route`);
  }
  assert(all.filter(exercise => exercise.mode === 'recall-word').every(exercise => !hasFirstLetterGuide(exercise, true)), 'Recall must not leak the model');
  assert(!hasFirstLetterGuide({ ...guided[0], lessonId: 'klink-leesstap-10' }, true));
  assert(!hasFirstLetterGuide({ ...guided[0], exampleWord: undefined }, true));
  assert(!hasFirstLetterGuide({ ...guided[0], learningPathId: 'reading' }, true));
});

test('Teacher preparation follows the new interaction and keeps sound preparation explicit', () => {
  for (const pack of packs) for (const lesson of pack.lessons.filter(item => /^(?:klink-leesstap-0[1-9]|klink-uitbreiding-[12]|woord-klink-woord-(?:en|is|kan|kast|mens|nek))$/.test(item.id))) {
    const plan = teacherPracticePlan(pack, lesson);
    assert.match(plan.blocks[1].action, /Nu jij/);
    assert.match(plan.blocks[1].action, /klankvoorbeeld/);
    assert.match(plan.blocks[1].action, /iedere volgende letter/);
    assert.match(plan.blocks[2].action, /iedere opdracht zelf Verder/);
    assert.equal(plan.blocks.reduce((total, block) => total + block.minutes, 0), 15);
  }
  assert.doesNotMatch(teacherPracticePlan(packs[2], packs[2].lessons[1]).blocks[1].action, /Nu jij/);
  for (const path of ['docs/KLINK-DOCENTHANDLEIDING.md', 'data/klink-teacher-manual.json']) {
    const text = readFileSync(path, 'utf8');
    assert.match(text, /Nu jij/);
    assert.match(text, /Kijk nog eens/);
    assert.match(text, /volgende letter en het bijbehorende lege vak/);
    assert.doesNotMatch(text, /Ik kies de eerste letter/);
  }
});


test('All 146 beginner through kop/sok steps use manual pace, without changing later lessons or practice rounds', () => {
  const all = packs.flatMap(pack => pack.lessons.flatMap(lesson => exercisesForLesson(pack, lesson)));
  const beginners = all.filter(exercise => isBeginnerLesson(exercise, true));
  assert.equal(beginners.length, 146);
  assert.deepEqual([...new Set(beginners.map(exercise => exercise.lessonId))], ['klink-leesstap-01', 'klink-leesstap-02', 'klink-leesstap-03', 'klink-leesstap-04', 'klink-leesstap-05', 'klink-leesstap-06', 'klink-leesstap-07', 'klink-leesstap-08', 'klink-uitbreiding-1', 'klink-uitbreiding-2', 'woord-klink-woord-en', 'woord-klink-woord-is', 'woord-klink-woord-kan', 'woord-klink-woord-kast', 'woord-klink-woord-mens', 'woord-klink-woord-nek', 'klink-leesstap-09']);
  assert(beginners.some(exercise => exercise.mode === 'recall-word'));
  assert(beginners.some(exercise => exercise.mode === 'word-image-match'));
  assert(all.every(exercise => !isBeginnerLesson(exercise, false)));
  for (const activity of ['build-model', 'worksheet', 'build']) {
    assert(groupExercises(packs[0], activity).every(exercise => !isBeginnerLesson(exercise, true)));
  }
  assert(!isBeginnerLesson({ ...beginners[0], lessonId: 'klink-leesstap-10' }, true));
  assert(!isBeginnerLesson({ ...beginners[0], learningPathId: 'reading' }, true));
  assert(!isBeginnerLesson({ ...beginners[0], lessonId: undefined }, true));
  assert(beginners.every(exercise => !['read-series', 'paper-dictation'].includes(exercise.mode)), 'No separate timed reading player in these lessons');
});
