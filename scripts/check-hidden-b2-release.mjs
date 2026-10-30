import assert from 'node:assert/strict';
import { verifySmallWordRoundsRelease, readBeforeSmallWordRounds } from './check-small-word-rounds-release.mjs';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128 * 1024 * 1024 });
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyHiddenB2Release(read = readFileSync) {
  const successor = verifySmallWordRoundsRelease(read), currentRead = read;
  read = file => readBeforeSmallWordRounds(file, successor, currentRead);
  const r = JSON.parse(read('docs/klink-owner-release-hidden-b2-20261030.json'));
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(r.publicationApproved, true);
  assert.equal(r.userRequest, 'De B2 knop mag je weghalen en verbergen. Behoud de ruimte ervoor wel');
  assert.equal(r.baselineSourceCommit, 'beff2e25e378a9fa723bc64831d1e96853d11113');
  git('merge-base', '--is-ancestor', r.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
  const changed = lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', ...roots));
  const expected = ['AGENTS.md', 'components/product/route-settings.tsx', 'scripts/check-hidden-b2-release.mjs', 'scripts/check-word-images-batch-release.mjs', 'scripts/test-direct-navigation-browser.mjs'].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(changed, expected);
  assert.deepEqual([...r.changedFiles].sort((a, b) => a.localeCompare(b)), expected);
  for (const file of changed) assert.equal(sha(read(file)), r.files[file], file);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', 'data', 'public', 'lib')), []);
  const review = JSON.parse(read('docs/b2-hidden-20261030/review.json'));
  for (const key of ['types', 'lint', 'build', 'navigation', 'layoutSpacePreserved', 'mobile', 'localOnly']) assert.equal(review[key], true, key);
  const backup = JSON.parse(read('docs/b2-hidden-20261030/backup.json'));
  assert.equal(backup.verified, true);
  assert(backup.driveId && backup.sha256);
  for (const file of changed) assert.equal(backup.files[file], r.files[file], file);
  return { ...r, successor };
}
export function readBeforeHiddenB2(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : readBeforeSmallWordRounds(file, release.successor, read);
}
