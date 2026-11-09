import {verifyUiRelease, readBeforeUi, uiBaseline} from './check-ui-release-20261109.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const listenLabelsBaseline = 'e90ca897a4639e069d35d50d809abe99a3c4c816';
const folder = 'docs/listen-labels-publication-20261109/';
const git = (...args) => execFileSync('git', args, {maxBuffer: 128e6});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const expected = [
  'VORMGEVING-VASTGEZET.md', 'app/learner-layout.css',
  'components/product/alfa-c-dagelijks.tsx', 'components/product/alfa-c-docent.tsx',
  'components/product/alfa-c-functioneel.tsx', 'components/product/alfa-c-practice.tsx', 'components/product/exercise-listen.tsx',
  'docs/appearance-floor-20261031/approved-updates/listen-labels-20261109.json', 'docs/appearance-floor-20261031/floor.json',
  'scripts/check-audio-bundle-release-20261108.mjs', 'scripts/check-listen-labels-release-20261109.mjs', 'scripts/deploy-static-audio.mjs',
  'scripts/test-alfa-c-functioneel-audio-browser.mjs', 'scripts/test-alfa-c-functioneel-browser.mjs',
  'scripts/test-listen-labels-20261109.mjs', 'scripts/test-listen-labels-release-20261109.mjs',
].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
export function verifyListenLabelsRelease(read = readFileSync) {
  const ui = verifyUiRelease(read), latestRead = read;
  read = path => readBeforeUi(path, ui, latestRead);
  const json = path => JSON.parse(read(path)), r = json(folder + 'approval.json');
  assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true); assert.equal(r.appearanceChangeApproved, true);
  assert.equal(r.userRequest, 'Publiceer deze gecontroleerde aanpassing van de luisterknoppen nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, links, voortgang, toetsenbordbediening en de rest van het uiterlijk.');
  assert.equal(r.baselineSourceCommit, listenLabelsBaseline);
  assert.equal(r.liveSourceCommit, 'e0f4e60920db5c712246144b371e85e5d3b72a7f');
  assert.equal(r.liveWorkerVersion, 'b463285a-86c8-42d5-8d79-d643edd84db0');
  assert.equal(r.liveAudioWorkerVersion, '71b927fb-d3dc-4b2b-bfb4-2b5457bce845');
  assert.equal(r.audioWorkerPreviouslyExists, true); assert.equal(r.newMeteredServices, 0); assert.equal(r.normalCommand, 'npm run deploy');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, listenLabelsBaseline);
  git('merge-base', '--is-ancestor', listenLabelsBaseline, 'HEAD');
  const changed = lines(git('diff', '--name-only', listenLabelsBaseline, uiBaseline))
    .filter(path => !path.startsWith('docs/listen-labels-') && path !== 'PUBLICATIE-ACTUEEL.md').sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  assert.deepEqual(changed, expected); assert.deepEqual(Object.keys(r.files).sort((a, b) => a < b ? -1 : a > b ? 1 : 0), expected);
  for (const [path, hash] of Object.entries({...r.files, ...r.evidenceFiles})) assert.equal(sha(read(path)), hash, path);
  const reviewed = json('docs/listen-labels-20261109/sources.json');
  for (const [path, hash] of Object.entries(reviewed.files)) assert.equal(sha(read(path)), hash, 'Reviewed source: ' + path);
  const results = json('docs/listen-labels-20261109/result.json');
  assert(results.build && results.typecheck && results.playerHandlersUnchanged); assert.equal(results.lint.errors, 0);
  assert.equal(results.labelLayoutAndModelChecks, 160); assert.equal(results.panelChecks, 1200);
  assert.equal(results.unchangedLegacyAudio, 13831); assert.equal(results.unchangedBundleAssets, 4025);
  const floor = 'docs/appearance-floor-20261031/floor.json', update = 'docs/appearance-floor-20261031/approved-updates/listen-labels-20261109.json';
  const oldFloor = JSON.parse(git('show', listenLabelsBaseline + ':' + floor));
  assert.deepEqual(json(floor), {...oldFloor, approvedUpdates: [...oldFloor.approvedUpdates, update]});
  const appearance = json(update); assert.equal(appearance.userRequest, r.userRequest); assert(appearance.appearanceChangeApproved && appearance.publicationApproved);
  for (const [path, hash] of Object.entries(appearance.files)) assert.equal(sha(read(path)), hash, path);
  const v = json(folder + 'verification.json');
  assert(v.reviewedRuntimeUnchanged && v.originalMediaByteIdentical && v.metadataPreserved && v.localHttpPassed && v.unaffectedAppearancePassed && v.noWorkflows && v.noPaidServices);
  const backup = json(folder + 'backup.json');
  assert(backup.driveId && backup.fullReadback && backup.zipIntegrity && backup.allSourceHashesMatch);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return {...r, ui};
}
export function readBeforeListenLabels(path, release, read = readFileSync) {
  return release && Object.hasOwn(release.files, path) ? git('show', listenLabelsBaseline + ':' + path) : readBeforeUi(path, release?.ui, read);
}
