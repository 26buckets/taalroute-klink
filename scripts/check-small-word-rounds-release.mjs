import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128 * 1024 * 1024 });
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifySmallWordRoundsRelease(read = readFileSync) {
  const r = JSON.parse(read('docs/klink-owner-release-small-word-rounds-20261030.json'));
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(r.userRequest, 'ik volg je advies');
  assert.equal(r.publicationApproved, true);
  assert.equal(r.baselineSourceCommit, '16151ddeb6f3e01787111ebf11184a29c77db10a');
  git('merge-base', '--is-ancestor', r.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
  const changed = [...new Set([...lines(git('diff', '--name-only', r.baselineSourceCommit, '--', ...roots)), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...roots))])].sort((a, b) => a.localeCompare(b));
  const expected = ['AGENTS.md', 'components/product/package-group-practice.tsx', 'components/product/practice-chapters.tsx', 'components/product/production-round.tsx', 'data/klink-word-round-index.json', 'docs/KLINK-DOCENTHANDLEIDING.md', 'lib/practice-chapters.ts', 'lib/round-progress.ts', 'lib/word-rounds.ts', 'scripts/build-word-round-index.mjs', 'scripts/check-sentence-release.mjs', 'scripts/check-small-word-rounds-release.mjs', 'scripts/test-word-rounds.mjs', 'scripts/test-word-rounds-browser.mjs'].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(changed, expected);
  assert.deepEqual([...r.changedFiles].sort((a, b) => a.localeCompare(b)), expected);
  for (const file of changed) assert.equal(sha(read(file)), r.files[file], file);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, '--', 'public')), []);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, '--', 'data')), ['data/klink-word-round-index.json']);
  const review = JSON.parse(read('docs/word-rounds-20261030/review.json'));
  for (const key of ['wordContent', 'progress', 'legacyLinks', 'audio', 'navigation', 'mobile', 'types', 'lint', 'build', 'localOnly']) assert.equal(review[key], true, key);
  const backup = JSON.parse(read('docs/word-rounds-20261030/backup.json'));
  assert.equal(backup.verified, true);
  assert(backup.driveId && backup.sha256);
  for (const file of changed) assert.equal(backup.files[file], r.files[file], file);
  return r;
}
export function readBeforeSmallWordRounds(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : read(file);
}
