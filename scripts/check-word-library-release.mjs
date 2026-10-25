import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const digest = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(readFileSync(path));
const git = (...args) => execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
const evidence = 'docs/klink-word-library-20261025';
export const wordLibraryFiles = [
  'app/learner-ui.css', 'components/product/learner-app.tsx', 'lib/word-library.ts',
  'scripts/test-learner-ux-browser.mjs', 'scripts/test-word-articles-browser.mjs', 'scripts/test-word-audio-ui-browser.mjs',
  'scripts/test-word-library-browser.mjs', 'scripts/test-word-library.mjs',
  'scripts/check-word-library-release.mjs', 'scripts/test-word-library-release.mjs',
  'scripts/check-article-review-release.mjs', 'scripts/check-curriculum-release.mjs',
  'scripts/test-article-review-release.mjs', 'scripts/test-publication-proof.mjs',
];
export function verifyWordLibraryRelease(release = read('docs/klink-owner-release-word-library-20261025.json'), readReleaseFile = readFileSync, sourceCommit = 'HEAD') {
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.userRequest, 'Doe het. Zet het online.');
  assert.equal(read(`${evidence}/owner-request.json`).userRequest, release.userRequest);
  assert.equal(release.baselineSourceCommit, 'b80670b12ea21d3561ba833af9fb668ab78efb9f');
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-article-review-20261025.json');
  assert.equal(release.newAudio, 0); assert.equal(release.wordCount, 5127);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(digest(readFileSync(release.previousAuthorization)), digest(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  assert.deepEqual(git('diff', '--name-only', release.baselineSourceCommit, sourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public').toString().trim().split('\n').filter(Boolean), ['app/learner-ui.css', 'components/product/learner-app.tsx', 'lib/word-library.ts']);
  const manifest = read(`${evidence}/source-manifest.json`);
  assert.deepEqual(manifest.map(row => row.path), wordLibraryFiles);
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
  for (const file of wordLibraryFiles) assert(release.files[file]);
  for (const name of ['owner-request', 'review', 'source-manifest', 'source-drive-verification', 'live-baseline', 'preservation']) assert(release.files[`${evidence}/${name}.json`]);
  for (const [file, hash] of Object.entries(release.files)) assert.equal(digest(readReleaseFile(file)), hash, file);
  const review = read(`${evidence}/review.json`), backup = read(`${evidence}/source-drive-verification.json`);
  assert.equal(review.status, 'passed-local'); assert.equal(review.preservationPassed, true);
  assert.equal(review.wordCount, 5127); assert.equal(review.lessonPackages, 15); assert.equal(review.extraWords, 4789);
  assert.equal(backup.parentVerified, true); assert.equal(backup.downloadedByteIdentical, true); assert.equal(backup.zipCrcVerified, true); assert.equal(backup.manifestEntriesVerified, wordLibraryFiles.length);
  return release;
}
export function readBeforeWordLibrary(file, release, readCurrent = readFileSync) {
  return release.files[file] ? git('show', `${release.baselineSourceCommit}:${file}`) : readCurrent(file);
}
