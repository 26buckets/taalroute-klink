import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  freshClassroom,
  restoreClassroom,
  placeTile,
  parseSoundRegistry,
  matWord,
  matLesson,
  matExercises,
  phases,
  variants,
} from '../lib/teacher-classroom.ts';

test('mat uses the canonical lesson, word, media and existing practice', () => {
  assert.equal(matWord.id, 'klink-woord-mat');
  assert.equal(matWord.image, '/start-tas/mat.webp');
  assert.equal(matWord.audio, '/package-audio/taalroute/klink-woord-mat.wav');
  assert.deepEqual(matLesson.unitIds, ['m', 'a', 't']);
  assert.deepEqual(matLesson.newWords, [matWord.id]);
  assert.equal(phases.length, 8);
  assert.equal(variants.length, 3);
  assert.equal(matExercises.length, 3);
  assert(matExercises.every((e) => e.wordId === matWord.id));
  assert(
    phases.every((p) => p.action && p.observe && p.framework && p.minutes > 0),
  );
});
test('tile actions preserve unique known letters and allow reordering', () => {
  assert.deepEqual(placeTile(['m'], 'a'), ['m', 'a', '']);
  assert.deepEqual(placeTile(['a', 'm'], 'm', 0), ['m', 'a', '']);
  assert.deepEqual(placeTile(['m', 'a', 't'], 't', 0), ['t', 'a', 'm']);
  assert.deepEqual(placeTile(['m'], 's'), ['m']);
  assert.deepEqual(placeTile(['m'], 'a', -1), ['m']);
});
test('session round trip preserves lesson; malformed storage fails closed', () => {
  const state = {
    ...freshClassroom('extend'),
    active: true,
    phase: 3,
    tiles: ['m', 'a', ''],
    shown: [false, false, false, true, false, false, false, false],
    image: false,
    regular: true,
    exerciseId: matExercises[1].exerciseId,
  };
  assert.deepEqual(restoreClassroom(JSON.stringify(state)), state);
  assert.equal(restoreClassroom(null).active, false);
  assert.equal(restoreClassroom('oops').active, true);
  assert.equal(restoreClassroom('{}').active, true);
  assert.equal(restoreClassroom('{"active":"false"}').active, true);
  const bad = restoreClassroom(
    JSON.stringify({
      ...state,
      phase: 100,
      tiles: ['m', 'm', 's', 't'],
      variant: 'Alfa A',
      exerciseId: 'private',
    }),
  );
  assert.equal(bad.phase, 0);
  assert.equal(bad.variant, 'basic');
  assert.deepEqual(bad.tiles, ['m', '', '']);
  assert.equal(bad.exerciseId, undefined);
});
test('runtime sound manifest has isolated slots and rejects unsafe sources and fallbacks', () => {
  const registry = JSON.parse(
    readFileSync('public/content/klink-docent-audio.json'),
  );
  assert.deepEqual(Object.keys(registry), ['m', 'a', 't']);
  assert.deepEqual(parseSoundRegistry(registry), {});
  assert.deepEqual(
    parseSoundRegistry({
      m: '/klank-audio/docent/m.wav',
      a: '/klank-audio/docent/a-kort.wav',
      t: '/klank-audio/docent/t.wav',
    }),
    {
      m: '/klank-audio/docent/m.wav',
      a: '/klank-audio/docent/a-kort.wav',
      t: '/klank-audio/docent/t.wav',
    },
  );
  assert.deepEqual(
    parseSoundRegistry({
      m: 'https://evil.test/m.wav',
      a: matWord.audio,
      t: '/klank-audio/docent/../t.wav',
    }),
    {},
  );
  assert.deepEqual(parseSoundRegistry(null), {});
});
