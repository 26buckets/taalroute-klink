import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { exerciseOpportunities } from '../lib/exercise-opportunities.ts';

const root = resolve(import.meta.dirname, '..');
const packages = JSON.parse(readFileSync(join(root, 'lib/package-content.generated.json'), 'utf8'));
const expectedFamilies = Array.from({ length: 18 }, (_, index) => `ALF-CMP-${String(index + 1).padStart(3, '0')}`);
const expectedCounts = { CP001: 542, CP002: 645 };

assert.deepEqual(packages.map((pack) => pack.id), ['CP001', 'CP002']);
assert.equal(packages.reduce((total, pack) => total + pack.exercises.length, 0), 1187);

for (const pack of packages) {
  const rejectedWord = pack.words.find((word) => word.word === 'boek');
  assert.equal(rejectedWord?.audioStatus, 'rejected', `${pack.id}: boek moet op luistercontrole wachten`);
  assert.equal(rejectedWord.audio, undefined, `${pack.id}: afgekeurde boekopname mag niet afspeelbaar zijn`);
  const rejectedPath = pack.id === 'CP001' ? '/package-audio/cp001/u01-aud-word-boek.m4a' : '/package-audio/cp002/cp002-aud-word-07.m4a';
  assert.ok(!JSON.stringify(pack).includes(rejectedPath), `${pack.id}: afgekeurde audio is nog gekoppeld`);
  assert.equal(pack.exercises.length, expectedCounts[pack.id], `${pack.id} heeft een onverwacht aantal oefenrecords`);
  assert.deepEqual([...new Set(pack.exercises.map((exercise) => exercise.componentId))].sort((a, b) => a.localeCompare(b)), expectedFamilies);
  assert.equal(pack.exerciseTypes.length, 18);

  const exerciseIds = new Set();
  const unresolvedImages = new Set();

  function inspect(value) {
    if (Array.isArray(value)) return value.forEach(inspect);
    if (!value || typeof value !== 'object') return;
    if (typeof value.assetId === 'string' && !value.src) unresolvedImages.add(value.assetId);
    if (typeof value.src === 'string' && value.src.startsWith('/package-media/')) {
      assert.ok(existsSync(join(root, 'public', value.src)), `${pack.id}: ontbrekend gepubliceerd beeld ${value.src}`);
    }
    Object.values(value).forEach(inspect);
  }

  for (const exercise of pack.exercises) {
    assert.ok(expectedFamilies.includes(exercise.componentId), `${exercise.exerciseId}: onbekende componentfamilie`);
    assert.ok(exercise.exerciseId, `${pack.id}: oefening zonder ID`);
    assert.ok(!exerciseIds.has(exercise.exerciseId), `${pack.id}: dubbel oefen-ID ${exercise.exerciseId}`);
    exerciseIds.add(exercise.exerciseId);
    inspect(exercise);
  }

  for (const assetId of unresolvedImages) {
    assert.ok(pack.media.missing.includes(assetId), `${pack.id}: onopgeloste beeldbinding ${assetId} staat niet in de mediastatus`);
  }
}

assert.equal(exerciseOpportunities.length, 52);
assert.equal(new Set(exerciseOpportunities.map((item) => item.id)).size, 52);
assert.deepEqual(
  Object.fromEntries(['direct', 'audio', 'metadata'].map((status) => [status, exerciseOpportunities.filter((item) => item.status === status).length])),
  { direct: 27, audio: 15, metadata: 10 },
);

console.log('Catalogus gecontroleerd: 1.187 records, 18 families en 52 opdrachtvarianten.');
