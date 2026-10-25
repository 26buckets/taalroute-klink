import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { beginnerExerciseDemo } from '../lib/lesson-plan.ts';
import { groupExercises } from '../lib/group-practice.ts';

test('Only the first instance of each choice or matching form opens a demo within a beginner lesson', () => {
  const counts = { first: 0, repeat: 0 };
  for (const pack of packs) for (const lesson of pack.lessons) {
    const seen = new Set();
    for (const exercise of exercisesForLesson(pack, lesson)) {
      const demo = beginnerExerciseDemo(pack, exercise, true);
      if (!demo) continue;
      assert.match(lesson.id, /^(?:klink-leesstap-(?:0[1-9]|1[0-9]|2[0-9]|3[0-9]|40)|klink-uitbreiding-(?:[1-9]|1[0-9]|2[0-3]))$/);
      assert.equal(demo, seen.has(exercise.mode) ? 'repeat' : 'first');
      seen.add(exercise.mode); counts[demo]++;
    }
  }
  assert.deepEqual(counts, { first: 195, repeat: 43 });
});

test('Every demonstrated pair uses a real label, approved exercise image and source answer mapping', () => {
  for (const pack of packs) for (const lesson of pack.lessons) for (const exercise of exercisesForLesson(pack, lesson)) {
    if (!beginnerExerciseDemo(pack, exercise, true)) continue;
    if (exercise.mode === 'word-image-match') {
      for (const source of exercise.sources) {
        assert(source.label);
        const target = exercise.targets.find(item => item.id === exercise.answer.mapping[source.id]);
        assert(target?.image?.src);
      }
    } else {
      assert.equal(exercise.answer.correctOptionIds.length, 1);
      assert(exercise.options.some(option => exercise.answer.correctOptionIds.includes(option.id)));
    }
  }
});

test('Recall, free practice, group rounds and separate learning paths receive no new demo', () => {
  for (const pack of packs) for (const lesson of pack.lessons) for (const exercise of exercisesForLesson(pack, lesson)) {
    assert.equal(beginnerExerciseDemo(pack, exercise, false), undefined);
    if (exercise.mode === 'recall-word') assert.equal(beginnerExerciseDemo(pack, exercise, true), undefined);
    assert.equal(beginnerExerciseDemo(pack, { ...exercise, learningPathId: 'reading' }, true), undefined);
  }
  for (const activity of ['match', 'hear-match', 'build-model', 'build']) {
    const exercises = groupExercises(packs[0], activity);
    assert(exercises.length > 0);
    assert(exercises.every(exercise => !beginnerExerciseDemo(packs[0], exercise, true)));
  }
});

test('The missing-letter example fills the actual gap and uses the source answer', () => {
  const demonstrated = [];
  for (const pack of packs) for (const lesson of pack.lessons) for (const exercise of exercisesForLesson(pack, lesson)) {
    if (exercise.mode !== 'missing-grapheme' || !beginnerExerciseDemo(pack, exercise, true)) continue;
    const option = exercise.options.find(item => exercise.answer.correctOptionIds.includes(item.id));
    const letter = option.label ?? option.grapheme;
    assert.equal(exercise.maskedWord.split('…').length, 2);
    assert.equal(exercise.maskedWord.replace('…', letter), pack.words.find(word => word.id === exercise.wordId).word);
    assert.equal(letter, exercise.targetGrapheme);
    demonstrated.push(exercise.exerciseId);
  }
  assert.deepEqual(demonstrated, ['klink-leesstap-06:klink-woord-pen:missing-grapheme', 'klink-leesstap-07:klink-woord-kam:missing-grapheme', 'klink-leesstap-08:klink-woord-ik:missing-grapheme', 'klink-leesstap-09:klink-woord-kop:missing-grapheme', 'klink-leesstap-10:klink-woord-bon:missing-grapheme', 'klink-leesstap-12:klink-woord-dak:missing-grapheme', 'klink-leesstap-13:klink-woord-maan:missing-grapheme', 'klink-leesstap-14:klink-woord-raam:missing-grapheme', 'klink-leesstap-16:klink-woord-teen:missing-grapheme', 'klink-leesstap-18:klink-woord-fit:missing-grapheme', 'klink-leesstap-20:klink-woord-voet:missing-grapheme', 'klink-leesstap-21:klink-woord-muur:missing-grapheme', 'klink-leesstap-23:klink-woord-neus:missing-grapheme', 'klink-leesstap-25:klink-woord-hek:missing-grapheme', 'klink-leesstap-26:klink-woord-week:missing-grapheme', 'klink-leesstap-28:klink-woord-ei:missing-grapheme', 'klink-leesstap-30:klink-woord-saus:missing-grapheme', 'klink-leesstap-32:klink-woord-gaan:missing-grapheme', 'klink-leesstap-33:klink-woord-lach:missing-grapheme', 'klink-leesstap-34:klink-woord-gang:missing-grapheme', 'klink-leesstap-35:klink-woord-bank:missing-grapheme', 'klink-leesstap-36:klink-woord-de:missing-grapheme', 'klink-leesstap-38:klink-woord-tong:missing-grapheme', 'klink-leesstap-37:klink-woord-sjaal:missing-grapheme', 'klink-leesstap-40:klink-woord-sjaal:missing-grapheme']);
});
