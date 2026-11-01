import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs, exercisesForLesson, exercisesForStep } from '../lib/taalroute-packages.ts';
import media from '../data/klink-media.json' with { type: 'json' };
import { lessonPlan, phaseLabels } from '../lib/lesson-plan.ts';
import { parseProgress, nextLessonPosition } from '../lib/learner-progress.ts';
import curriculum from '../data/klink-curriculum.json' with { type: 'json' };
import release from '../data/klink-release-readiness.json' with { type: 'json' };

const all = packs.flatMap(pack => pack.exercises);
void test('All 302 routes have a complete status inventory and monotonically ordered phases', () => {
  assert.equal(packs.flatMap(pack => pack.lessons).length, 302);
  const phases = Object.keys(phaseLabels);
  const statuses = new Set();
  for (const pack of packs) for (const lesson of pack.lessons) {
    const route = exercisesForLesson(pack, lesson);
    assert(route.length <= 16, `${lesson.id}: ${route.length} activities`);
    const order = route.map(item => phases.indexOf(item.phase));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), lesson.id);
    assert.deepEqual(lesson.steps, [...new Set(route.map(item => item.phase))]);
    const rows = lessonPlan(pack, lesson);
    assert(rows.length >= 18);
    assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
    for (const row of rows) {
      statuses.add(row.status);
      if (row.status === 'connected') assert(row.guidedCount > 0);
      if (row.status === 'available') { assert(row.count > 0); assert.equal(row.guidedCount, 0); }
      if (row.status === 'missing' || row.status === 'unnecessary') assert.equal(row.count, 0);
      for (const id of row.exerciseIds) assert(pack.exercises.some(item => item.exerciseId === id && item.lessonId === lesson.id));
      assert(row.reason.length > 0);
    }
    assert.equal(rows.find(row => row.id === 'ZI-03').count, pack.exercises.filter(item => item.lessonId === lesson.id && ['listen-sentence', 'connected-sentence'].includes(item.mode)).length);
    assert.equal(rows.find(row => row.id === 'instruction-audio').status, 'connected');
  }
  assert.equal(statuses.size, 4);
});
void test('Dictation and independent rebuilding never contain a visible model; missing audio excludes them', () => {
  assert(all.filter(item => item.mode === 'word-dictation').length > 300);
  for (const exercise of all.filter(item => ['word-dictation', 'recall-word'].includes(item.mode))) {
    assert(exercise.prompt.audio?.src);
    assert.equal(exercise.requiresAudio, true);
    assert.equal(exercise.exampleWord, undefined);
    assert.equal(exercise.text, undefined);
    assert.equal(exercise.prompt.image, undefined);
    assert.equal(exercise.assessment, 'answer');
  }
  assert(all.some(item => item.wordId === 'klink-woord-fit' && item.mode === 'word-dictation'));
  const original = media['klink-woord-fit'].audio;
  try {
    delete media['klink-woord-fit'].audio;
    const material = exercisesForStep(curriculum.steps.find(step => step.newWords.includes('klink-woord-fit')));
    assert(!material.exercises.some(item => item.wordId === 'klink-woord-fit' && item.mode === 'word-dictation'));
  } finally { media['klink-woord-fit'].audio = original; }
});
void test('Gap items mask a complete source unit with two prepared distinct alternatives', () => {
  const gaps = all.filter(item => item.mode === 'missing-grapheme');
  assert(gaps.length >= 12);
  for (const exercise of gaps) {
    const word = curriculum.words.find(item => item.id === exercise.wordId);
    assert.equal(exercise.maskedWord.replace('…', exercise.targetGrapheme), word.word);
    assert.equal(exercise.targetGrapheme, word.reading.units[exercise.gapIndex].text);
    assert.equal(exercise.options.length, 2);
    assert.equal(new Set(exercise.options.map(item => item.label)).size, 2);
    assert(exercise.prompt.audio?.src);
    assert.equal(exercise.exampleWord, undefined);
    assert(exercise.distractorReason.includes(exercise.targetGrapheme));
  }
  const book = gaps.find(item => item.wordId === 'klink-woord-boek' && item.lessonId === 'klink-leesstap-19');
  assert.equal(book.targetGrapheme, 'oe');
  assert.equal(book.maskedWord, 'b…k');
});
void test('Single-word entry has no manufactured choice or pair; matching uses unique prepared meanings and images', () => {
  const first = all.filter(item => item.lessonId === 'klink-leesstap-01');
  assert(!first.some(item => ['same-word', 'heard-word', 'heard-image', 'word-image', 'memory', 'word-image-match'].includes(item.mode)));
  for (const exercise of all.filter(item => item.mode === 'word-image-match')) {
    assert.equal(new Set(exercise.sources.map(item => item.label)).size, 2);
    assert.equal(new Set(exercise.targets.map(item => item.image.src)).size, 2);
    assert.equal(new Set(Object.values(exercise.answer.mapping)).size, 2);
  }
});
void test('Route cursor is validated, meaning-safe and separate from mastery; completion has a real next lesson', () => {
  for (const input of [null, 'x', 'null', '[]', '{"position":null}', '{"completed":[null,4,"bad"],"position":{"packageId":"bad"}}']) assert.deepEqual(parseProgress(input, packs), { completed: [] });
  const pack = packs[0], lesson = pack.lessons[1];
  const position = { packageId: pack.id, lessonId: lesson.id, exerciseId: lesson.guidedExerciseIds[2] };
  assert.deepEqual(parseProgress(JSON.stringify({ position, completed: [lesson.id, lesson.id, 'bad'] }), packs), { position, completed: [lesson.id] });
  assert.equal(parseProgress(JSON.stringify({ position: { ...position, exerciseId: packs[1].lessons[0].guidedExerciseIds[0] } }), packs).position, undefined);
  assert.equal(nextLessonPosition(packs, pack.id, pack.lessons[0].id).lessonId, lesson.id);
  assert.equal(nextLessonPosition(packs, pack.id, lesson.id).lessonId, pack.lessons[2].id);
  assert.equal(nextLessonPosition(packs, pack.id, pack.lessons.at(-1).id).lessonId, 'klink-leesstap-06');
  assert.equal(nextLessonPosition(packs, 'bad', 'bad'), undefined);
});
void test('Explicit release approval does not turn recording/self-check into mastery', () => {
  assert.equal(release.publicationApproved, true);
  assert.equal(release.approvalRecord, 'docs/klink-content-approval-20261017.json');
  assert.equal(release.standaloneT, 'parked-do-not-use');
  for (const exercise of all.filter(item => ['ALF-CMP-009', 'ALF-CMP-012'].includes(item.componentId))) assert.equal(exercise.assessment, 'participation');
});
