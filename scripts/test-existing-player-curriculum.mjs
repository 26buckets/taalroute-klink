import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { taalroutePackages as packs, primaryWordCards, exercisesForLesson } from '../lib/taalroute-packages.ts';
import release from '../data/klink-curriculum.json' with { type: 'json' };
const lessons = packs.flatMap(pack => pack.lessons);
test('Every Lexicon meaning has exactly one first home; all core and extension steps remain exact', () => {
  assert.equal(primaryWordCards.length, 338);
  assert.equal(new Set(primaryWordCards.map(word => word.id)).size, 338);
  assert.equal(new Set(primaryWordCards.map(word => word.word)).size, 337);
  for (const word of primaryWordCards) assert(packs.some(pack => pack.id === word.packageId && pack.words.some(item => item.id === word.id)), word.id);
  assert.equal(packs.filter(pack => pack.kind === 'group').length, 10);
  assert.equal(lessons.filter(lesson => lesson.kind === 'klanklijst').length, 37);
  assert.equal(lessons.filter(lesson => lesson.kind === 'herhaalronde').length, 3);
  assert.equal(lessons.filter(lesson => lesson.kind === 'uitbreiding').length, 23);
  for (const step of [...release.steps, ...release.extensions]) {
    const lesson = lessons.find(item => item.id === step.id);
    assert(lesson, step.id);
    for (const key of ['known', 'newWords', 'returning']) assert.deepEqual(lesson[key], step[key], `${step.id} ${key}`);
  }
});
test('Long words retain all five reading routes; support is not mistaken for a core step', () => {
  assert.equal(primaryWordCards.filter(word => word.packageId.startsWith('route-')).length, 78);
  assert.equal(packs.filter(pack => pack.kind === 'route').length, 5);
  assert.equal(primaryWordCards.filter(word => word.packageId === 'voorbereiding').length, 7);
});
test('Guided lessons use explicit IDs, introduce choices first and never borrow from another lesson', () => {
  for (const pack of packs) for (const lesson of pack.lessons) {
    const exercises = exercisesForLesson(pack, lesson);
    assert(exercises.length > 0, lesson.id);
    assert.deepEqual(exercises.map(item => item.exerciseId), lesson.guidedExerciseIds);
    const seen = new Set();
    for (const exercise of exercises) {
      assert.equal(exercise.lessonId, lesson.id);
      if (exercise.mode === 'model') seen.add(exercise.wordId);
      for (const option of exercise.options ?? []) assert(seen.has(option.id), `${lesson.id} unknown option ${option.id}`);
    }
    for (const id of [...lesson.newWords, ...lesson.returning]) assert(seen.has(id), `${lesson.id} drops ${id}`);
  }
});
test('Existing renderer contracts have valid answers, tiles, models, and nonambiguous pairs', () => {
  const ids = new Set();
  for (const pack of packs) for (const exercise of pack.exercises) {
    assert(!ids.has(exercise.exerciseId), exercise.exerciseId); ids.add(exercise.exerciseId);
    assert(/^ALF-CMP-(001|002|004|005|006|009|012|015|016)$/.test(exercise.componentId));
    if (exercise.componentId === 'ALF-CMP-002') {
      assert.equal(exercise.options.length, 2);
      assert.equal(new Set(exercise.options.map(option => option.label ?? option.image.src)).size, 2);
      assert(exercise.options.some(option => exercise.answer.correctOptionIds.includes(option.id)));
      assert(exercise.distractorReason);
    }
    if (exercise.componentId === 'ALF-CMP-005') {
      const target = exercise.answer.targetTileIds.map(id => exercise.tiles.find(tile => tile.id === id).token).join('');
      assert.equal(target, exercise.exampleWord);
    }
    if (exercise.mode.startsWith('heard') || exercise.mode === 'repeat-word') assert(exercise.prompt.audio?.src);
  }
});
test('Both pak meanings remain distinct, missing media is not invented and public files contain no Drive links', () => {
  const pak = primaryWordCards.filter(word => word.word === 'pak');
  assert.equal(pak.length, 2);
  assert.equal(pak.find(word => word.id.endsWith('verpakking')).image, undefined);
  for (const word of primaryWordCards) for (const path of [word.audio, word.image].filter(Boolean)) assert(existsSync(new URL(`../public${path}`, import.meta.url)), path);
  assert(!/drive\.google|docs\.google|diglin/i.test(JSON.stringify(packs)));
});
test('Only the established learner, teacher and exercise players are mounted; existing CSS remains the shell', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert(page.includes('<LearnerApp')); assert(page.includes('<TeacherApp')); assert(!page.includes('CurriculumApp'));
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  assert(!layout.includes('curriculum.css'));
});
