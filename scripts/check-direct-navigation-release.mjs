import {verifyWordImagesBatchRelease,readBeforeWordImagesBatch} from './check-word-images-batch-release.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128 * 1024 * 1024 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
export function verifyDirectNavigationRelease(read = readFileSync) {
  const successor=verifyWordImagesBatchRelease(read),currentRead=read;read=file=>readBeforeWordImagesBatch(file,successor,currentRead);
  const r = JSON.parse(read('docs/klink-owner-release-direct-navigation-20261030.json'));
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(r.publicationApproved, true);
  assert(r.userRequest.includes('zet deze versie online in de echte Klink-app'));
  assert.equal(r.liveSourceCommit, '2e0563b2fb358cae6e680033953f8cd5081f032e');
  assert.equal(r.baselineSourceCommit, 'd623481917243931dd5df781f13236c8200c0639');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, r.baselineSourceCommit);
  git('merge-base', '--is-ancestor', r.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
  const changed = lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', ...roots));
  const allowed = ['AGENTS.md', 'app/learner-layout.css', 'app/sounds.css', 'components/product/learner-app.tsx', 'components/product/practice-chapters.tsx', 'components/product/practice-header.tsx', 'components/product/production-round.tsx', 'components/product/route-settings.tsx', 'components/product/staff-apps.tsx', 'data/klink-teacher-manual.json', 'docs/KLINK-DOCENTHANDLEIDING.md', 'lib/practice-navigation.ts', 'package.json', 'scripts/check-content-repair-release.mjs', 'scripts/check-direct-navigation-release.mjs', 'scripts/test-direct-navigation-release.mjs', 'scripts/test-existing-player-browser.mjs', 'scripts/test-meet-words-browser-20261030.mjs', 'scripts/test-alfa-c-menu-browser.mjs', 'scripts/test-cumulative-routes-browser.mjs', 'scripts/test-direct-navigation-browser.mjs', 'scripts/test-learner-language-browser.mjs', 'scripts/test-menu-navigation-browser.mjs', 'scripts/test-practice-navigation.mjs', 'scripts/test-round-progress-browser.mjs', 'scripts/test-sounds-browser.mjs'];
  assert.deepEqual(changed, allowed.sort((a, b) => a.localeCompare(b)));
  assert.deepEqual(changed, [...r.changedFiles].sort((a, b) => a.localeCompare(b)));
  for (const file of changed) assert.equal(sha(read(file)), r.files[file], file);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', 'public')), []);
  assert.deepEqual(lines(git('diff', '--name-only', r.baselineSourceCommit, successor.baselineSourceCommit, '--', 'data')), ['data/klink-teacher-manual.json']);
  for (const file of ['lib/learner-progress.ts', 'lib/round-progress.ts', 'lib/media-player.ts', 'lib/alfa-c-response.ts', 'components/product/teacher-classroom.tsx']) assert.deepEqual(read(file), git('show', `${r.baselineSourceCommit}:${file}`), file);
  const manual = JSON.parse(read('data/klink-teacher-manual.json'));
  const previousManual = JSON.parse(git('show', `${r.baselineSourceCommit}:data/klink-teacher-manual.json`));
  assert.deepEqual(manual.map(({ id, title }) => ({ id, title })), previousManual.map(({ id, title }) => ({ id, title })));
  assert(manual[1].html.includes('Start → Stap voor stap'));
  const review = JSON.parse(read('docs/direct-kiezen-publicatie-20261030/review.json'));
  for (const key of ['types', 'lint', 'build', 'navigation', 'content', 'answers', 'progress', 'nativeAudio', 'mobile', 'localOnly']) assert.equal(review[key], true, key);
  const backup = JSON.parse(read('docs/direct-kiezen-publicatie-20261030/backup.json'));
  assert.equal(backup.verified, true);
  assert(backup.driveId && backup.sha256);
  for (const file of changed) assert.equal(backup.files[file], r.files[file], file);
  return {...r,successor};
}
export function readBeforeDirectNavigation(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : readBeforeWordImagesBatch(file,release.successor,read);
}
