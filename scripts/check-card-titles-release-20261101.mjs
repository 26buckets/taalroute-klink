import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const base = '38b937ebb11005942fc018e603f6658a53882857', live = 'b670d0c1337eea07e96662237de4b9508de9735c', folder = 'docs/card-titles-appwide-20261101/';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sort = values => values.sort((a, b) => a.localeCompare(b));
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'VORMGEVING-VASTGEZET.md', 'docs/appearance-floor-20261031', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'next.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
export function verifyCardTitlesRelease(read = readFileSync) {
  const json = file => JSON.parse(read(file)), r = json('docs/klink-owner-release-card-titles-20261101.json');
  assert.equal(r.approvedBy, 'Nico'); assert(r.publicationApproved && r.appearanceChangeApproved);
  assert.equal(r.baselineSourceCommit, base); assert.equal(r.liveSourceCommit, live);
  assert(r.userRequest.includes('zet deze versie nu live in Klink'));
  assert(r.userRequest.includes('door de hele app'));
  git('merge-base', '--is-ancestor', live, base);
  git('merge-base', '--is-ancestor', base, 'HEAD');
  const changed = sort([...new Set([...lines(git('diff', '--name-only', base, '--', ...roots)), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...roots))])]);
  assert.deepEqual(changed, r.changedFiles); assert.deepEqual(sort(Object.keys(r.files)), changed);
  for (const [file, hash] of Object.entries({ ...r.files, ...r.evidenceFiles })) assert.equal(sha(read(file)), hash, file);
  assert.deepEqual(changed.filter(f => /^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)), sort(['app/learner-ui.css', 'components/product/alfa-c-docent.tsx', 'components/product/learner-app.tsx', 'components/product/package-experience.tsx', 'components/product/practice-chapters.tsx', 'components/product/teacher-classroom.css', 'lib/learner-copy.ts']));
  assert.equal(git('diff', '--name-only', base, '--', 'hooks', 'data', 'public', 'db', 'drizzle', '.github', 'package.json', 'package-lock.json', 'vite.config.ts').length, 0, 'Keep all source content, media, Enter handling, storage, database, dependencies and deployment configuration');
  const browser = json(folder + 'local/checks.json');
  assert.equal(browser.scopes, 234); assert.equal(browser.activities, 57); assert.equal(browser.results.length, 936); assert.deepEqual(browser.errors, []);
  assert(browser.results.every(c => c.cardsEqual && c.titles && c.counts && c.sourceIds && c.storagePreserved));
  assert(browser.extras.some(c => c.view === 'teacher/materials')); assert(browser.extras.some(c => c.view === 'words'));
  assert.equal(new Set([...browser.results, ...browser.extras].map(c => c.activity).filter(Boolean)).size, 59);
  const p = json(folder + 'verification.json');
  for (const key of ['types', 'lint', 'unit', 'allParts', 'allLevels', 'allSourceContentPreserved', 'allMediaPreserved', 'progressPreserved', 'desktopMobile', 'reactReview', 'localOnly']) assert.equal(p[key], true, key);
  const backup = json(folder + 'backup.json');
  assert(backup.verified && backup.fullReadback && backup.zipIntegrity && backup.driveId);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return r;
}
export function readBeforeCardTitles(file, r, read = readFileSync) {
  return r.changedFiles.includes(file) ? git('show', base + ':' + file) : read(file);
}
