import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, copyFileSync, cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(readFileSync('data/klink-release-readiness.json')).baseline;
const proof = JSON.parse(readFileSync(baseline.proofFile));
function check(candidate) {
  const dir = mkdtempSync(join(tmpdir(), 'klink-proof-test-'));
  try {
    mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, 'data')); mkdirSync(join(dir, 'lib'));
    cpSync('lib', join(dir, 'lib'), { recursive: true });
    cpSync('data', join(dir, 'data'), { recursive: true });
    copyFileSync('scripts/check-curriculum-release.mjs', join(dir, 'scripts/check-curriculum-release.mjs'));
    copyFileSync('lib/klink-context.ts', join(dir, 'lib/klink-context.ts'));
    for (const name of ['klink-media.json', 'klink-curriculum.json', 'klink-instructions.json', 'klink-comprehension-audio.json', 'klink-connected-content.json', 'klink-sections.json']) copyFileSync(`data/${name}`, join(dir, `data/${name}`));
    const media = JSON.parse(readFileSync(join(dir, 'data/klink-media.json')));
    for (const item of Object.values(media)) item.image ||= '/test-present.webp';
    delete Object.values(media)[0].image;
    writeFileSync(join(dir, 'data/klink-media.json'), JSON.stringify(media));
    const readiness = JSON.parse(readFileSync('data/klink-release-readiness.json'));
    // Deliberately unapproved fixture: a valid live-source proof must not waive review.
    readiness.publicationApproved = false;
    readiness.wordPronunciationReview = 'open';
    readiness.sentenceComprehensionReview = 'open';
    readiness.connectedContentReview = 'open';
    const instructionsPath = join(dir, 'data/klink-instructions.json');
    const instructions = JSON.parse(readFileSync(instructionsPath));
    instructions.humanReview = 'open';
    writeFileSync(instructionsPath, JSON.stringify(instructions));
    const contextPath = join(dir, 'lib/klink-context.ts');
    writeFileSync(contextPath, readFileSync(contextPath, 'utf8').replace("humanReview: 'approved'", "humanReview: 'open'"));
    readiness.baseline.proofFile = join(dir, 'proof.json');
    writeFileSync(join(dir, 'data/klink-release-readiness.json'), JSON.stringify(readiness));
    if (candidate) writeFileSync(readiness.baseline.proofFile, JSON.stringify(candidate));
    const result = spawnSync(process.execPath, [join(dir, 'scripts/check-curriculum-release.mjs')], { encoding: 'utf8' });
    assert.equal(result.status, 1, 'Incomplete media must still prevent publication');
    return result.stderr;
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
test('Valid publication proof resolves provenance, not outstanding media approval', () => {
  const errors = check(proof);
  assert(!/herkomstbewijs|broncommit/.test(errors));
  assert(errors.includes('uitspraakcontrole')); assert(errors.includes('1 betekenissen hebben nog geen gekoppeld betekenisbeeld'));
  assert(!errors.includes('instructie-audio is nog niet inhoudelijk vrijgegeven')); assert(errors.includes('zinnen en situaties'));
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
test('A mismatching or dirty live release marker is rejected', () => {
  for (const liveRelease of [null, { ...proof.liveRelease, sourceCommit: 'another-commit' }, { ...proof.liveRelease, sourceClean: false }]) {
    assert(check({ ...proof, liveRelease }).includes('herkomstbewijs past niet'));
  }
});
test('Incomplete media evidence or a missing source archive is rejected', () => {
  for (const changes of [{ mediaChecked: 0 }, { mediaChecked: proof.expectedMedia - 1 }, { errors: ['missing media'] }, { sourceArchiveSha256: null }]) {
    assert(check({ ...proof, ...changes }).includes('herkomstbewijs past niet'));
  }
});
