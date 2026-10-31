import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { connectedContent } from '../lib/connected-content.ts';
import { buildAudioRegister, plannedAudioId } from './build-audio-register.mjs';
import { resolveRegisteredAudio } from '../lib/audio-register.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';
import { contentCoverage } from '../lib/content-coverage.ts';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
const read = (path) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url)));
const rows = read('public/content-register/active.json');
const planned = read('public/content-register/planned.json');

test('Stable script IDs preserve exact language and separate instruction from target', () => {
  assert.equal(
    plannedAudioId('target', ' café '),
    plannedAudioId('target', 'cafe\u0301'),
  );
  assert.notEqual(
    plannedAudioId('target', 'tas'),
    plannedAudioId('instruction', 'tas'),
  );
  assert.notEqual(
    plannedAudioId('target', 'De tas.'),
    plannedAudioId('target', 'Een tas.'),
  );
});
test('Later binding is exact, reviewed, branded and never silently replaces current audio', () => {
  const good = {
    src: '/package-audio/word/new.wav',
    transcript: 'tas',
    role: 'target',
    voiceId: 'target-voice',
    review: 'approved',
    metadataApproved: true,
  };
  const resolve = (entry, text = 'tas', role = 'target') =>
    resolveRegisteredAudio('word-tas', text, role, undefined, {
      'word-tas': entry,
    });
  assert.equal(resolve(good), good.src);
  for (const change of [
    { transcript: 'map' },
    { role: 'instruction' },
    { voiceId: '' },
    { review: 'open' },
    { metadataApproved: false },
    { src: '/package-audio/../secret.wav' },
    { src: 'https://drive.google.com/audio.wav' },
  ])
    assert.equal(resolve({ ...good, ...change }), undefined);
  assert.equal(
    resolveRegisteredAudio('word-tas', 'tas', 'target', '/old-approved.wav', {
      'word-tas': good,
    }),
    '/old-approved.wav',
  );
  assert.equal(resolveRegisteredAudio('unknown', 'tas', 'target'), undefined);
});
test('All active word, context, instruction and comprehension audio IDs have a register slot', () => {
  const byId = new Map(rows.map((row) => [row.id, row]));
  assert.equal(byId.size, rows.length);
  for (const word of read('data/klink-curriculum.json').words)
    assert(byId.has(word.id));
  for (const item of connectedContent)
    for (const block of item.blocks)
      assert.equal(byId.get(block.audio.audioId)?.src, block.audio.src);
  for (const item of [
    ...read('data/klink-instructions.json').items,
    ...read('data/klink-comprehension-audio.json').items,
  ])
    assert.equal(byId.get(item.id)?.src, isWithdrawnAudio(item.src) ? undefined : item.src);
  for (const row of rows) {
    if (row.status === 'connected')
      assert(
        existsSync(join(import.meta.dirname, '../public', row.src)),
        row.id,
      );
    else assert.equal(row.src, undefined);
    for (const id of row.lessonIds)
      assert(
        packs.some((pack) => pack.lessons.some((lesson) => lesson.id === id)),
        id,
      );
  }
  assert.equal(byId.get('klink-klank-t').status, 'parked');
  assert(byId.get('vraag-biet').lessonIds.length > 0);
  assert(byId.has('zin-man'));
  assert(rows.some((row) => row.kind === 'sound' && row.status === 'missing'));
});
test('Prepared scripts remain unplaced, deduplicated by role, with honest archive status', () => {
  assert.equal(new Set(planned.map((row) => row.id)).size, planned.length);
  for (const row of planned) {
    assert.equal(row.id, plannedAudioId(row.role, row.text));
    assert.equal(row.placement, 'unplaced');
    assert.deepEqual(row.lessonIds, []);
    if (row.status === 'connected')
      assert(
        rows.some(
          (active) =>
            active.id === row.existingAudioId &&
            active.src === row.src &&
            active.role === row.role &&
            active.text.trim().normalize('NFC') === row.text,
        ),
      );
    else assert.equal(row.src, undefined);
  }
  assert(
    !/drive\.google|docs\.google|diglin/i.test(JSON.stringify([rows, planned])),
  );
});
test('Inventory generation is deterministic, and does not mutate the learner curriculum', () => {
  const before = JSON.stringify(packs);
  const fixture = {
    reviewedAudio: [
      {
        sourcePackage: 'CP002',
        preparedId: 'sample-1',
        role: 'target_narration',
        script: 'Nog niet geplaatst.',
        present: false,
      },
      {
        sourcePackage: 'CP003',
        preparedId: 'sample-2',
        role: 'target_narration',
        script: 'Nog niet geplaatst.',
        present: true,
        archive: 'candidate.zip',
        entry: 'candidate.wav',
      },
      {
        sourcePackage: 'CP003',
        preparedId: 'sample-3',
        role: 'instruction_support',
        script: 'Nog niet geplaatst.',
        present: false,
      },
    ],
  };
  const registry = buildAudioRegister(fixture);
  assert.deepEqual(rows, JSON.parse(JSON.stringify(registry.active)), 'Published inventory snapshot must match current local content');
  assert.equal(registry.planned.length, 2);
  assert.equal(
    registry.planned.find((row) => row.role === 'target').status,
    'archive',
  );
  assert.deepEqual(registry, buildAudioRegister(fixture));
  assert.equal(JSON.stringify(packs), before);
  assert.equal(packs.length, 15);
  assert.equal(
    packs.reduce((n, pack) => n + pack.lessons.length, 0),
    302,
  );
});
test('Broader domains do not claim a full method from renderers or exercise counts', () => {
  assert.equal(contentCoverage.length, 12);
  assert(contentCoverage.every((row) => row.status !== 'Werkt'));
  assert.equal(
    contentCoverage.find((row) => row.id === 'functional-writing')
      .connectedModes.length,
    2,
  );
  assert.equal(
    contentCoverage.find((row) => row.id === 'language-patterns').connectedModes
      .length,
    2,
  );
  assert(
    contentCoverage
      .find((row) => row.id === 'reading')
      .next.toLowerCase().includes('zelfstandig'),
  );
});
