import {verifyAlfaCAudioRelease,readBeforeAlfaCAudio} from './check-alfa-c-audio-release.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const sorted = rows => rows.toSorted();
const evidence = 'docs/klink-alfa-c-texts-20261027';
export const alfaCTextFiles = [
  'components/product/alfa-c-practice.tsx',
  'components/product/alfa-c-practice.css',
  'lib/alfa-c-practice.ts',
  'data/klink-alfa-c-texts.json',
  'scripts/check-alfa-c-release.mjs',
  'scripts/check-alfa-c-texts-release.mjs',
  'scripts/test-alfa-c-texts.mjs',
  'scripts/test-alfa-c-texts-browser.mjs',
  'scripts/test-alfa-c-texts-release.mjs',
  'scripts/test-alfa-c-preview-browser.mjs',
  'scripts/test-publication-proof.mjs',
];
export function verifyAlfaCTextRelease(readFile = readFileSync, release = JSON.parse(readFileSync('docs/klink-owner-release-alfa-c-texts-20261027.json'))) {
  const audioRelease = verifyAlfaCAudioRelease(readFile);
  const currentReader = readFile;
  readFile = file => readBeforeAlfaCAudio(file, audioRelease, currentReader);
  assert.equal(release.approvedBy, 'Nico');
  assert.equal(release.publicationApproved, true);
  assert.equal(release.userRequest, 'zet alles dan online in het alfa-c gedeelte');
  assert.equal(release.baselineSourceCommit, 'eacef4f95f7717fafccf6988878ecf38f912f492');
  assert.equal(release.newAudio, 0);
  assert.equal(release.newImages, 0);
  assert.equal(release.steps, 36);
  assert.equal(release.humanLearnerTrial, false);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts'];
  const changed = git('diff', '--name-only', release.baselineSourceCommit, audioRelease.baselineSourceCommit, '--', ...roots).toString().trim().split('\n').filter(Boolean);
  const untracked = []; // The audio successor validates the current delta.
  assert.deepEqual(sorted([...new Set([...changed, ...untracked])]), sorted(alfaCTextFiles));
  assert.equal(git('diff', release.baselineSourceCommit, audioRelease.baselineSourceCommit, '--', 'public').length, 0, 'Media must be preserved');
  assert.equal(JSON.parse(readFile('data/klink-audio-policy.json')).instructionAudioEnabled, false);
  assert.equal(sha(readFile('AGENTS.md')), sha(git('show', 'db8d290:AGENTS.md')), 'Preserve the approved homepage agreement');
  const expected = [...alfaCTextFiles, 'AGENTS.md', ...['owner-request', 'live-baseline', 'reviewed-text-package', 'review', 'source-manifest', 'source-drive-verification'].map(n => `${evidence}/${n}.json`), `${evidence}/review-36-steps.txt`];
  assert.deepEqual(sorted(Object.keys(release.files)), sorted(expected));
  for (const [file, hash] of Object.entries(release.files)) assert.equal(sha(readFile(file)), hash, file);
  const live = JSON.parse(readFile(`${evidence}/live-baseline.json`));
  assert.equal(live.sourceCommit, release.baselineSourceCommit);
  assert.equal(live.followupLiveSourceCommit, 'c6e0a3e63a1f879b4db5a4abc7a1be767f2165f3');
  git('merge-base', '--is-ancestor', live.followupLiveSourceCommit, 'HEAD');
  const owner = JSON.parse(readFile(`${evidence}/owner-request.json`));
  assert.equal(owner.userRequest, release.userRequest);
  const review = JSON.parse(readFile(`${evidence}/review.json`));
  assert.equal(review.status, 'passed-local');
  for (const field of ['all36TextsMatched', 'all36StepsBrowserChecked', 'sixBuildRetries', 'cleanNuJij', 'progressPreserved', 'nativeAudio', 'audioMetadata', 'types', 'lint', 'curriculum', 'build']) assert.equal(review[field], true, field);
  const manifest = JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(manifest.map(x => x.path), expected.filter(x => !x.endsWith('/source-manifest.json') && !x.endsWith('/source-drive-verification.json')));
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
  const backup = JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  assert.equal(backup.manifestEntriesVerified, manifest.length);
  const previous = 'docs/klink-owner-release-alfa-c-20261026.json';
  assert.equal(sha(readFile(previous)), sha(git('show', `${release.baselineSourceCommit}:${previous}`)));
  return { ...release, audioRelease };
}
export function readBeforeAlfaCText(file, release, readFile = readFileSync) {
  return release.files[file] ? git('show', `${release.baselineSourceCommit}:${file}`) : readBeforeAlfaCAudio(file, release.audioRelease, readFile);
}
