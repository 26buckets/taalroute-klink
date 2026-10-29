import assert from 'node:assert/strict';
import { verifyPhotoRepairRelease, readBeforePhotoRepair } from './check-alfa-c-photo-repair-release.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const sha = b => createHash('sha256').update(b).digest('hex');
export function verifyWorkspaceRelease(read = readFileSync) {
  const photoRepair = verifyPhotoRepairRelease(read), currentRead = read;
  read = file => readBeforePhotoRepair(file, photoRepair, currentRead);
  const release = JSON.parse(read('docs/klink-owner-release-alfa-c-workspace-20261028.json'));
  assert.equal(release.baselineSourceCommit, '6fe6ee39f3d9c2ac7c205ea82bddc538c87eca1f');
  assert.equal(release.liveSourceCommit, '5e3b0dd344862b0e9dfb495ed9d4d4d6cfac7c64');
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.humanReviewClaimed, false); assert.equal(release.newAudio, 0);
  const scope = JSON.parse(read('docs/klink-alfa-c-werkvlak-20261028/scope.json'));
  assert.equal(release.userRequest, scope.userRequest);
  assert(release.userRequest.includes('herkenbaar echt briefje/document'));
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts'];
  const changed = git('diff', '--name-only', release.baselineSourceCommit, photoRepair.baselineSourceCommit, '--', ...roots).toString().trim().split('\n').filter(Boolean);
  const untracked = []; // The photo repair successor verifies the current working tree.
  assert.deepEqual([...new Set([...changed, ...untracked])].sort((a, b) => a.localeCompare(b)), [...release.changedFiles].sort((a, b) => a.localeCompare(b)));
  for (const [file, hash] of Object.entries(release.files)) assert.equal(sha(read(file)), hash, file);
  assert(release.changedFiles.every(file => release.files[file]));
  assert.equal(git('diff', release.baselineSourceCommit, photoRepair.baselineSourceCommit, '--', 'data', 'lib', 'db', 'drizzle', 'app', 'hooks', 'public', ':!public/alfa-c/rivaro-parcel.svg').length, 0, 'Preserve curriculum, audio, logo, navigation, progress and database');
  const review = JSON.parse(read(release.reviewPath));
  for (const key of ['sourceTextPreserved', 'all144TaskLayouts', 'desktopNoScroll', 'mobileReflow', 'all180ResponseRegression', 'firstAttemptAndHelp', 'overviewGroups', 'guidedAvailability', 'nativeAudio', 'types', 'lint', 'build', 'curriculum']) assert.equal(review[key], true, key);
  assert.equal(review.humanLearnerTrial, false);
  const layout = JSON.parse(read(release.layoutPath));
  assert.equal(layout.checks.length, 854); assert.deepEqual(layout.errors, []); assert.deepEqual(layout.failures, []);
  const backup = JSON.parse(read(release.backupPath));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  assert.equal(backup.parentId, '1MA6t7naBAJP-fqlhDIvSBuaw8G4okvZR');
  return { ...release, photoRepair };
}
export function readBeforeWorkspace(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : readBeforePhotoRepair(file, release.photoRepair, read);
}
