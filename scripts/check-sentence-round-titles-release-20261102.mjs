import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {verifyKlink10SentencesRelease,readBeforeKlink10Sentences} from './check-klink10-sentences-release-20261102.mjs';
const base = '3886eac47226b1071ca02ef6b7c0efc2bc5b87be', live = 'eb8c54c5ee1c5fb60cfa629f5bd0eda231669ec9', folder = 'docs/sentence-round-titles-20261102/';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const sort = values => values.sort((a, b) => a.localeCompare(b));
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts', 'db', 'drizzle', '.github', 'AGENTS.md', 'PUBLICATIE.md', 'VORMGEVING-VASTGEZET.md', 'docs/appearance-floor-20261031', 'docs/KLINK-DOCENTHANDLEIDING.md', 'vite.config.ts', 'next.config.ts', 'package.json', 'package-lock.json', 'wrangler.jsonc'];
export function verifySentenceRoundTitlesRelease(read = readFileSync) {
  const next=verifyKlink10SentencesRelease(read),currentRead=read;read=file=>readBeforeKlink10Sentences(file,next,currentRead);
  const json = file => JSON.parse(read(file)), r = json('docs/klink-owner-release-sentence-round-titles-20261102.json');
  assert.equal(r.approvedBy, 'Nico'); assert(r.publicationApproved && r.appearanceChangeApproved);
  assert.equal(r.baselineSourceCommit, base); assert.equal(r.liveSourceCommit, live);
  assert(r.userRequest.includes('Doe dit ook bij Luister en lees mee'));
  assert(r.publicationRequest.includes('zet deze versie nu live in Klink'));
  git('merge-base', '--is-ancestor', live, base); git('merge-base', '--is-ancestor', base, 'HEAD');
  const changed = sort(lines(git('diff', '--name-only', base, next.baselineSourceCommit, '--', ...roots)));
  assert.deepEqual(changed, r.changedFiles); assert.deepEqual(sort(Object.keys(r.files)), changed);
  for (const [file, hash] of Object.entries({ ...r.files, ...r.evidenceFiles })) assert.equal(sha(read(file)), hash, file);
  assert.deepEqual(changed.filter(f => /^(app|components|hooks|data|lib|public|db|drizzle)\//.test(f)), ['components/product/practice-chapters.tsx', 'lib/learner-copy.ts']);
  assert.equal(git('diff', '--name-only', base, next.baselineSourceCommit, '--', 'app', 'hooks', 'data', 'public', 'db', 'drizzle', '.github', 'package.json', 'package-lock.json', 'vite.config.ts').length, 0);
  for (const file of ['hooks/use-practice-keyboard.ts', 'app/learner-ui.css', 'components/product/teacher-classroom.css']) assert.equal(sha(read(file)), sha(git('show', base + ':' + file)), file);
  const renderer = 'components/product/practice-chapters.tsx';
  const expectedRenderer = git('show', base + ':' + renderer).toString().replace('learnerCollectionLabel(collection.title).title', 'learnerCollectionLabel(collection.title, collection.id).title').replace('const label = learnerCollectionLabel(item.title);', 'const label = learnerCollectionLabel(item.title, item.sourceId ?? item.id);');
  assert.equal(read(renderer).toString(), expectedRenderer, 'Only pass the existing source ID to the title helper; retain all markup, events and progress logic');
  const floor = 'docs/appearance-floor-20261031/floor.json', oldFloor = JSON.parse(git('show', base + ':' + floor));
  assert.deepEqual(json(floor), { ...oldFloor, approvedUpdates: [...oldFloor.approvedUpdates, r.approval] });
  const approval = json(r.approval); assert(approval.appearanceChangeApproved && approval.publicationApproved);
  assert.equal(approval.userRequest, r.userRequest); assert.deepEqual(approval.files, Object.fromEntries(Object.entries(r.files).filter(([file]) => file.startsWith('lib/') || file.startsWith('components/'))));
  const review = json(folder + 'title-review.json'); assert.equal(review.length, 20);
  for (const level of ['a1', 'a2']) {
    const rows = review.filter(row => row.level === level); assert.equal(rows.length, 10);
    assert.equal(new Set(rows.map(row => row.title)).size, rows.length);
  }
  assert(review.every(row => row.title.length <= 32 && row.title !== 'Zinnen oefenen' && row.sourceTexts.length && row.exerciseIds.length === row.exerciseCount && row.id && row.sourceTitle));
  const browser = json(folder + 'local/browser.json'); assert.equal(browser.sentenceRounds, 20); assert.equal(browser.checks.length, 24); assert.equal(browser.flows.length, 8); assert.deepEqual(browser.errors, []);
  assert(browser.checks.every(c => c.rounds === 10 && c.sourceIds && c.contentTitles && c.metadataSeparate && c.cardsEqual && c.noOverflow));
  assert(browser.flows.every(c => c.sourceExerciseUnchanged && c.reload && c.progressPreserved && c.newTitleOnReturn && c.originalAudioPlayed && c.audioStoppedOnNavigation && c.nativeAudio.length));
  const preservation = json(folder + 'local/preservation.json'); assert.equal(preservation.changedSentenceTitles, 20); assert(preservation.unchangedLabels > 6000 && preservation.readingTitlesPreserved === 68 && preservation.rendererOnlyPassesExistingId && preservation.roundAndSupportUnchanged && preservation.allSourcesAudioIdsProgressCodeAndCssUnchanged);
  const p = json(folder + 'verification.json'); for (const key of ['types', 'lint', 'unit', 'build', 'sourceSentenceReview', 'desktopMobile', 'progressPreserved', 'nonSentenceTitlesUnchanged', 'localOnly']) assert.equal(p[key], true, key);
  const backup = json(folder + 'backup.json'); assert(backup.verified && backup.fullReadback && backup.zipIntegrity && backup.driveId);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return {...r,next};
}
export function readBeforeSentenceRoundTitles(file, r, read = readFileSync) {
  return r.changedFiles.includes(file) ? git('show', base + ':' + file) : readBeforeKlink10Sentences(file,r.next,read);
}
