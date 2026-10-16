import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const proof = JSON.parse(readFileSync('docs/klink-publication-provenance.json'));
function check(candidate) {
  const dir = mkdtempSync(join(tmpdir(), 'klink-proof-test-'));
  try {
    mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, 'data'));
    copyFileSync('scripts/check-curriculum-release.mjs', join(dir, 'scripts/check-curriculum-release.mjs'));
    for (const name of ['klink-media.json', 'klink-curriculum.json']) copyFileSync(`data/${name}`, join(dir, `data/${name}`));
    const readiness = JSON.parse(readFileSync('data/klink-release-readiness.json'));
    readiness.baseline.proofFile = join(dir, 'proof.json');
    writeFileSync(join(dir, 'data/klink-release-readiness.json'), JSON.stringify(readiness));
    if (candidate) writeFileSync(readiness.baseline.proofFile, JSON.stringify(candidate));
    const result = spawnSync(process.execPath, [join(dir, 'scripts/check-curriculum-release.mjs')], { encoding: 'utf8' });
    assert.equal(result.status, 1, 'Incomplete media must still prevent publication');
    return result.stderr;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('Valid historical proof resolves provenance, not outstanding media approval', () => {
  const errors = check(proof);
  assert(!/herkomstbewijs|broncommit/.test(errors));
  assert(errors.includes('uitspraakcontrole')); assert(errors.includes('177 betekenissen'));
});
test('Proof for a different live version cannot satisfy the publication gate', () => {
  assert(check({ ...proof, liveWorkerVersion: 'another-version' }).includes('herkomstbewijs past niet'));
});
test('A boolean without its underlying publication record is rejected', () => {
  assert(check(null).includes('herkomstbewijs ontbreekt'));
});
test('Missing fresh public client evidence is rejected', () => {
  assert(check({ ...proof, freshClientSha256: null }).includes('herkomstbewijs past niet'));
});
