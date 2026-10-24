import test from 'node:test';
import assert from 'node:assert/strict';
import { homeLessonPosition, nextLessonPosition, parseProgress } from '../lib/learner-progress.ts';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { lessonContentLevel } from '../lib/learner-route.ts';

test('A new learner starts at the first guided mat example without a level choice', () => {
  const start = homeLessonPosition(packs, { completed: [] }, 'all');
  assert.equal(start.packageId, packs[0].id);
  assert.equal(start.lessonId, packs[0].lessons[0].id);
  assert.equal(start.exerciseId, packs[0].lessons[0].guidedExerciseIds[0]);
  assert.equal(packs[0].exercises.find(exercise => exercise.exerciseId === start.exerciseId).mode, 'model');
});

test('Resume keeps the exact exercise; completion selects the next unfinished lesson', () => {
  const lesson = packs[0].lessons[0];
  const position = { packageId: packs[0].id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds[1] };
  const progress = parseProgress(JSON.stringify({ position, completed: [] }), packs);
  assert.deepEqual(homeLessonPosition(packs, progress, 'all'), position);
  assert.equal(homeLessonPosition(packs, { completed: [lesson.id] }, 'all').lessonId, packs[0].lessons[1].id);
  const completed = packs[0].lessons.map(item => item.id);
  assert.equal(homeLessonPosition(packs, { completed }, 'all').packageId, packs[1].id);
  assert.equal(homeLessonPosition(packs, { completed: packs.flatMap(pack => pack.lessons.map(item => item.id)) }, 'all').lessonId, lesson.id);
});

test('An explicit literacy choice is respected, including when a saved lesson belongs elsewhere', () => {
  const position = homeLessonPosition(packs, { completed: [] }, 'all');
  for (const literacy of ['alfa-a', 'alfa-b', 'alfa-c']) {
    const expected = packs.flatMap(pack => pack.lessons.filter(lesson => lesson.guidedExerciseIds?.length && lessonContentLevel(pack, lesson) === literacy).map(lesson => ({ pack, lesson })))[0];
    const selected = homeLessonPosition(packs, { completed: [], position }, literacy);
    if (expected) {
      assert.equal(selected.packageId, expected.pack.id);
      assert.equal(selected.lessonId, expected.lesson.id);
    } else assert.equal(selected, undefined);
  }
  assert.equal(homeLessonPosition([], { completed: [] }, 'all'), undefined);
});


test('The final beginner lesson continues with pen/pet, including after saving and reloading', () => {
  const first = packs[0];
  const next = nextLessonPosition(packs, first.id, 'klink-leesstap-05');
  const nextPack = packs.find(pack => pack.id === next.packageId);
  const lesson = nextPack.lessons.find(item => item.id === next.lessonId);
  assert.equal(lesson.id, 'klink-leesstap-06');
  assert.equal(next.exerciseId, lesson.guidedExerciseIds[0]);
  assert.equal(nextPack.exercises.find(item => item.exerciseId === next.exerciseId).mode, 'model');
  const progress = parseProgress(JSON.stringify({ completed: first.lessons.map(item => item.id), position: next }), packs);
  assert.deepEqual(homeLessonPosition(packs, progress, 'all'), next);
  assert.deepEqual(homeLessonPosition(packs, progress, 'alfa-a'), next);
  assert.equal(progress.completed.length, 5);
  assert(!progress.completed.includes(next.lessonId));
  assert.equal(nextLessonPosition([first], first.id, 'klink-leesstap-05'), undefined);
  assert.equal(nextLessonPosition(packs, packs[1].id, packs[1].lessons.at(-1).id), undefined);
});
