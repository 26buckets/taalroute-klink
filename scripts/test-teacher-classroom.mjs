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
  classroomRoutes,
  routeIds,
  phasesForRoute,
  prerequisitesForRoute,
  sequenceForRoute,
  isCorrectSequence,
} from '../lib/teacher-classroom.ts';

void test('mat uses the canonical lesson, word, media and existing practice', () => {
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
void test('three content routes are independent of support and trace prerequisites honestly', () => {
  assert.deepEqual(routeIds, ['a', 'b', 'c']);
  assert.equal(new Set(routeIds.map((r) => classroomRoutes[r].goal)).size, 3);
  for (const route of routeIds)
    for (const variant of variants) {
      const state = freshClassroom(variant.id, route);
      assert.equal(state.route, route);
      assert.equal(state.variant, variant.id);
      assert(!('prepared' in state));
      assert.equal(phasesForRoute(route).length, 8);
      assert(
        phasesForRoute(route).every(
          (p) => p.action && p.observe && p.minutes > 0 && p.framework,
        ),
      );
      assert.deepEqual(restoreClassroom(JSON.stringify(state)), {
        ...state,
        exerciseId: undefined,
      });
    }
  const prereqs = prerequisitesForRoute('b');
  assert.equal(prereqs.find((p) => p.token === 'ligt').wordRef, null);
  assert.equal(prereqs.find((p) => p.token === 'de').wordRef, 'klink-woord-de');
  assert.equal(
    prerequisitesForRoute('c').find((p) => p.token === 'veeg').wordRef,
    null,
  );
  assert.equal(
    restoreClassroom('{"active":true,"variant":"extend"}').route,
    'a',
  );
});
void test('sentence and text cards preserve duplicates and reject invalid ordering', () => {
  assert.equal(sequenceForRoute('b').length, 6);
  assert(isCorrectSequence('b', [0, 1, 2, 3, 4, 5]));
  assert(!isCorrectSequence('b', [5, 4, 3, 2, 1, 0]));
  assert(!isCorrectSequence('b', [0, 1, 2, 3, 0, 5]));
  assert(!isCorrectSequence('b', [0, 1, 2, 3, 4]));
  assert(isCorrectSequence('c', [0, 1, 2, 3, 4, 5, 6]));
  assert(!isCorrectSequence('c', [1, 0]));
  const state = restoreClassroom(
    JSON.stringify({
      ...freshClassroom('basic', 'b'),
      active: true,
      prepared: true,
      order: [2, 2, -1, 999, 0, '1'],
    }),
  );
  assert.deepEqual(state.order, [2, 0]);
  assert(!('prepared' in state));
  assert.deepEqual(
    restoreClassroom(
      JSON.stringify({ route: 'c', prepared: true, order: [0, 1] }),
    ).order,
    [],
  );
  assert.deepEqual(
    restoreClassroom(JSON.stringify({ route: 'c', order: [0, 1, 2] })).order,
    [],
  );
  const current = { ...freshClassroom('basic', 'c'), order: [0, 1, 2] };
  assert.deepEqual(
    restoreClassroom(JSON.stringify(current)).order,
    current.order,
  );
  assert.deepEqual(sequenceForRoute('c'), [
    'Ik',
    'veeg',
    'mijn',
    'voeten',
    'op',
    'de',
    'mat.',
  ]);
  assert.equal(
    classroomRoutes.c.example.split('\n')[0],
    classroomRoutes.b.example,
  );
  assert(!('response' in state));
});
void test('tile actions preserve unique known letters and allow reordering', () => {
  assert.deepEqual(placeTile(['m'], 'a'), ['m', 'a', '']);
  assert.deepEqual(placeTile(['a', 'm'], 'm', 0), ['m', 'a', '']);
  assert.deepEqual(placeTile(['m', 'a', 't'], 't', 0), ['t', 'a', 'm']);
  assert.deepEqual(placeTile(['m'], 's'), ['m']);
  assert.deepEqual(placeTile(['m'], 'a', -1), ['m']);
});
void test('session round trip preserves lesson; malformed storage fails closed', () => {
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
void test('runtime sound manifest has isolated slots and rejects unsafe sources and fallbacks', () => {
  const registry = JSON.parse(
    readFileSync('public/content/klink-docent-audio.json'),
  );
  assert.deepEqual(Object.keys(registry), ['m', 'a', 't']);
  assert.deepEqual(parseSoundRegistry(registry), registry);
  for (const src of Object.values(registry)) assert(readFileSync('public' + src).length > 500);
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
