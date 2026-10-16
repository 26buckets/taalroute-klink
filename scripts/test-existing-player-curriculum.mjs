import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { taalroutePackages as packs, primaryWordCards, exercisesForLesson, lessonPreviewWords } from '../lib/taalroute-packages.ts';
import release from '../data/klink-curriculum.json' with { type: 'json' };
const lessons = packs.flatMap(pack => pack.lessons);
test('Compact lesson previews preserve the full lesson and choose target meanings, including recall', () => {
  const before = JSON.stringify(packs);
  for (const pack of packs) for (const lesson of pack.lessons) {
    const expected = (lesson.newWords.length ? lesson.newWords : lesson.returning).slice(0, 2);
    assert.deepEqual(lessonPreviewWords(pack, lesson).map(word => word.id), expected, lesson.id);
  }
  assert.equal(JSON.stringify(packs), before);
  const pack = packs[0];
  const legacy = { ...pack.lessons[0], newWords: undefined, returning: undefined };
  assert.deepEqual(lessonPreviewWords(pack, legacy).map(word => word.word), legacy.words.slice(0, 2));
});
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
      if (exercise.mode === 'missing-grapheme') {
        const prepared = release.words.filter(word => seen.has(word.id)).flatMap(word => word.reading.units.map(unit => unit.text));
        for (const option of exercise.options) assert(prepared.includes(option.label), `${lesson.id} unknown grapheme ${option.label}`);
      } else for (const option of exercise.options ?? []) assert(seen.has(option.id), `${lesson.id} unknown option ${option.id}`);
    }
    for (const id of [...lesson.newWords, ...lesson.returning]) assert(seen.has(id), `${lesson.id} drops ${id}`);
  }
});
test('Existing renderer contracts have valid answers, tiles, models, and nonambiguous pairs', () => {
  const ids = new Set();
  for (const pack of packs) for (const exercise of pack.exercises) {
    assert(!ids.has(exercise.exerciseId), exercise.exerciseId); ids.add(exercise.exerciseId);
    assert(/^ALF-CMP-(001|002|004|005|006|007|009|012|015|016)$/.test(exercise.componentId));
    if (exercise.componentId === 'ALF-CMP-002') {
      assert.equal(exercise.options.length, 2);
      assert.equal(new Set(exercise.options.map(option => option.label ?? option.image.src)).size, 2);
      assert(exercise.options.some(option => exercise.answer.correctOptionIds.includes(option.id)));
      assert(exercise.distractorReason);
    }
    if (exercise.componentId === 'ALF-CMP-005') {
      const target = exercise.answer.targetTileIds.map(id => exercise.tiles.find(tile => tile.id === id).token).join('');
      assert.equal(target, pack.words.find(word => word.id === exercise.wordId).word);
      if (exercise.mode === 'word-build') assert.equal(target, exercise.exampleWord);
      if (exercise.mode === 'recall-word') assert.equal(exercise.exampleWord, undefined);
    }
    if (exercise.mode.startsWith('heard') || exercise.mode === 'repeat-word') assert(exercise.prompt.audio?.src);
  }
});
test('Both pak meanings remain distinct, missing media is not invented and public files contain no Drive links', () => {
  const pak = primaryWordCards.filter(word => word.word === 'pak');
  assert.equal(pak.length, 2);
  const packaging = pak.find(word => word.id.endsWith('verpakking'));
  const garment = pak.find(word => !word.id.endsWith('verpakking'));
  assert.equal(packaging.image, '/package-media/candidates/klink-woord-pak-verpakking.webp');
  assert.notEqual(packaging.image, garment.image);
  for (const word of primaryWordCards) for (const path of [word.audio, word.image].filter(Boolean)) assert(existsSync(new URL(`../public${path}`, import.meta.url)), path);
  assert(!/drive\.google|docs\.google|diglin/i.test(JSON.stringify(packs)));
});
test('Only the established learner, teacher and exercise players are mounted; existing CSS remains the shell', () => {
  const page = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  assert(page.includes('<LearnerApp')); assert(page.includes('<TeacherApp')); assert(!page.includes('CurriculumApp'));
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  assert(!layout.includes('curriculum.css'));
});
