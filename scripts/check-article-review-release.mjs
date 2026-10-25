import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const digest = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(readFileSync(path));
const evidence = 'docs/klink-article-review-20261025';
export const articleReviewFiles = ['app/learner-ui.css', 'scripts/check-article-review-release.mjs', 'scripts/check-curriculum-release.mjs', 'scripts/check-word-audio-release.mjs', 'scripts/test-article-review-release.mjs', 'scripts/test-article-review-browser.mjs', 'scripts/test-publication-proof.mjs'];
export function verifyArticleReviewRelease(release = read('docs/klink-owner-release-article-review-20261025.json'), readReleaseFile = readFileSync, sourceCommit = 'HEAD') {
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.baselineSourceCommit, '313932512785d4962937cab1191ab4f4240729ee');
  assert.equal(release.userRequest, 'Doe nog een review als cursist en docent: zijn de lidwoorden duidelijk en blijft het rustig genoeg? Pas eventuele verbeteringen toe en zet die na controle online. Audio blijft voor later.');
  assert.equal(read(`${evidence}/owner-request.json`).userRequest, release.userRequest);
  assert.equal(release.newAudio, 0);
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-wordaudio-20261025.json');
  const git = (...args) => execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(digest(readReleaseFile(release.previousAuthorization)), digest(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  assert.deepEqual(git('diff', '--name-only', release.baselineSourceCommit, sourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public').toString().trim().split('\n').filter(Boolean), ['app/learner-ui.css']);
  const manifest = read(`${evidence}/source-manifest.json`);
  assert.deepEqual(manifest.map(row => row.path), articleReviewFiles);
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
  for (const file of articleReviewFiles) assert(release.files[file]);
  for (const name of ['owner-request', 'review', 'source-manifest', 'source-drive-verification', 'live-baseline', 'preservation']) assert(release.files[`${evidence}/${name}.json`]);
  for (const [file, hash] of Object.entries(release.files)) assert.equal(digest(readReleaseFile(file)), hash, file);
  const review = read(`${evidence}/review.json`), backup = read(`${evidence}/source-drive-verification.json`);
  assert.equal(review.status, 'passed-local'); assert.equal(review.preservationPassed, true); assert.equal(review.teacherClippingFixed, true);
  assert.equal(backup.parentVerified, true); assert.equal(backup.downloadedByteIdentical, true); assert.equal(backup.zipCrcVerified, true); assert.equal(backup.manifestEntriesVerified, articleReviewFiles.length);
  return release;
}
export function readBeforeArticleReview(file, release, readReleaseFile = readFileSync) {
  return release.files[file] ? execFileSync('git', ['show', `${release.baselineSourceCommit}:${file}`], { maxBuffer: 32 * 1024 * 1024 }) : readReleaseFile(file);
}
