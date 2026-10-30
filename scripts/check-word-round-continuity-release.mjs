import {verifySynonymPlacementRelease,readBeforeSynonymPlacement} from './check-synonym-placement-release.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128 * 1024 * 1024 });
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyWordRoundContinuityRelease(read = readFileSync) {
  const successor = verifySynonymPlacementRelease(read), currentRead = read;
  read = file => readBeforeSynonymPlacement(file, successor, currentRead);
  const r = JSON.parse(read('docs/klink-owner-release-word-round-continuity-20261031.json'));
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(r.userRequest, 'Pas dit ook toe op de andere woordoefeningen. Als ik een andere oefenvorm kies, wil ik met dezelfde woorden uit die ronde verdergaan. Behoud alle audio en voortgang.');
  assert.equal(r.publicationApproved, true);
  assert.equal(r.baselineSourceCommit, 'ac7d278f37ad8532cdd685e858a23f7cb42c1603');
  git('merge-base', '--is-ancestor', r.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
  const changed = lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', ...roots));
  const expected = ['AGENTS.md', 'components/product/exercise-menu.tsx', 'components/product/package-exercise-browser.tsx', 'components/product/practice-chapters.tsx', 'data/klink-word-round-index.json', 'docs/KLINK-DOCENTHANDLEIDING.md', 'lib/practice-chapters.ts', 'lib/word-rounds.ts', 'scripts/build-word-round-index.mjs', 'scripts/check-long-content-release-20261030.mjs', 'scripts/check-word-round-continuity-release.mjs', 'scripts/test-word-rounds.mjs', 'scripts/test-word-round-continuity.mjs', 'scripts/test-word-round-continuity-browser.mjs', 'scripts/test-round-progress-browser.mjs'].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(changed, expected);
  assert.deepEqual([...r.changedFiles].sort((a, b) => a.localeCompare(b)), expected);
  for (const file of changed) assert.equal(sha(read(file)), r.files[file], file);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', 'public')), []);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', 'data')), ['data/klink-word-round-index.json']);
  const review = JSON.parse(read('docs/word-round-continuity-20261031/review.json'));
  for (const key of ['exactWords', 'wholeBoards', 'wordContent', 'progress', 'legacyLinks', 'audio', 'navigation', 'mobile', 'types', 'lint', 'build', 'localOnly']) assert.equal(review[key], true, key);
  const backup = JSON.parse(read('docs/word-round-continuity-20261031/backup.json'));
  assert.equal(backup.verified, true);
  assert(backup.driveId && backup.sha256);
  for (const file of changed) assert.equal(backup.files[file], r.files[file], file);
  return { ...r, successor };
}
export function readBeforeWordRoundContinuity(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : readBeforeSynonymPlacement(file, release.successor, read);
}
