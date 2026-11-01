import {verifyInstructionCandidate,readBeforeInstructionCandidate} from './check-instruction-candidate.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const base = '7641e8f3e2684f113cf9e93bcff03f726a25b882', live = '35182be471e139a7615181206ce1288c45886c86', folder = 'docs/reading-round-titles-20261101/';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sort = values => values.sort((a, b) => a.localeCompare(b));
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'VORMGEVING-VASTGEZET.md', 'docs/appearance-floor-20261031', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'next.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
export function verifyReadingRoundTitlesRelease(read = readFileSync) {
  const candidate=verifyInstructionCandidate(read),currentRead=read;read=file=>readBeforeInstructionCandidate(file,candidate,currentRead);
  const json = file => JSON.parse(read(file)), r = json('docs/klink-owner-release-reading-round-titles-20261101.json');
  assert.equal(r.approvedBy, 'Nico'); assert(r.publicationApproved && r.appearanceChangeApproved);
  assert.equal(r.baselineSourceCommit, base); assert.equal(r.liveSourceCommit, live);
  assert(r.userRequest.includes('Geef elke ronde liever een korte titel die iets over de inhoud zegt'));
  assert(r.publicationRequest.includes('zet deze versie nu live in Klink'));
  git('merge-base', '--is-ancestor', live, base); git('merge-base', '--is-ancestor', base, 'HEAD');
  const changed = sort(lines(git('diff', '--name-only', base, candidate.integration.liveSourceCommit, '--', ...roots)));
  assert.deepEqual(changed, r.changedFiles); assert.deepEqual(sort(Object.keys(r.files)), changed);
  for (const [file, hash] of Object.entries({ ...r.files, ...r.evidenceFiles })) assert.equal(sha(read(file)), hash, file);
  assert.deepEqual(changed.filter(f => /^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)), ['lib/learner-copy.ts']);
  assert.equal(git('diff', '--name-only', base, candidate.integration.liveSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'public', 'db', 'drizzle', '.github', 'package.json', 'package-lock.json', 'vite.config.ts').length, 0);
  for (const file of ['hooks/use-practice-keyboard.ts', 'app/learner-ui.css', 'components/product/teacher-classroom.css']) assert.equal(sha(read(file)), sha(git('show', base + ':' + file)), file);
  const floor = 'docs/appearance-floor-20261031/floor.json', oldFloor = JSON.parse(git('show', base + ':' + floor));
  assert.deepEqual(json(floor), { ...oldFloor, approvedUpdates: [...oldFloor.approvedUpdates, r.approval] });
  const approval = json(r.approval); assert(approval.appearanceChangeApproved && approval.publicationApproved);
  assert.equal(approval.userRequest, r.userRequest); assert.deepEqual(approval.files, { 'lib/learner-copy.ts': r.files['lib/learner-copy.ts'] });
  const review = json(folder + 'title-review.json'); assert.equal(review.length, 68);
  for (const level of ['a1', 'a2']) {
    const rows = review.filter(row => row.level === level); assert.equal(rows.length, 34);
    assert.equal(new Set(rows.map(row => row.title)).size, rows.length);
  }
  assert(review.every(row => row.title.length <= 32 && row.title !== 'Korte teksten' && row.sourceContentTitles.length && row.id && row.sourceTitle));
  const browser = json(folder + 'local/browser.json'); assert.equal(browser.readingRounds, 68); assert.equal(browser.checks.length, 24); assert.equal(browser.flows.length, 8); assert.deepEqual(browser.errors, []);
  assert(browser.checks.every(c => c.rounds === 34 && c.sourceIds && c.contentTitles && c.metadataSeparate && c.cardsEqual && c.noOverflow));
  assert(browser.flows.every(c => c.sourceExerciseUnchanged && c.reload && c.progressPreserved && c.newTitleOnReturn));
  const preservation = json(folder + 'local/preservation.json'); assert.equal(preservation.changedReadingTitles, 68); assert(preservation.unchangedLabels > 1000 && preservation.roundAndSupportUnchanged && preservation.allSourcesAudioIdsProgressCodeAndCssUnchanged);
  const p = json(folder + 'verification.json'); for (const key of ['types', 'lint', 'unit', 'build', 'sourceHeadingReview', 'desktopMobile', 'progressPreserved', 'nonReadingTitlesUnchanged', 'localOnly']) assert.equal(p[key], true, key);
  const backup = json(folder + 'backup.json'); assert(backup.verified && backup.fullReadback && backup.zipIntegrity && backup.driveId);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return {...r,instructionCandidate:candidate};
}
export function readBeforeReadingRoundTitles(file, r, read = readFileSync) {
  return r.changedFiles.includes(file) ? git('show', base + ':' + file) : readBeforeInstructionCandidate(file,r.instructionCandidate,read);
}
