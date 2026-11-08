import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const audioBundleBaseline = 'a7e9a5fd405b47884fffa3bb1fa0ad42f58dcf6d';
const folder = 'docs/audio-bundles-publication-20261108/';
const git = (...args) => execFileSync('git', args, {maxBuffer: 128e6});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const expected = [
  ".gitignore",
  "app/exercise-flow.css",
  "components/product/teacher-classroom.tsx",
  "components/product/word-listening.tsx",
  "data/klink-audio-bundle-index.json",
  "data/klink-audio-retention.json",
  "lib/audio-bundle-key.ts",
  "lib/audio-delivery.ts",
  "lib/media-player.ts",
  "lib/word-listening.ts",
  "package.json",
  "public/.assetsignore",
  "scripts/build-audio-bundles.mjs",
  "scripts/build-practice-bundles.mjs",
  "scripts/check-audio-bundle-release-20261108.mjs",
  "scripts/check-audio-bundles-local.mjs",
  "scripts/check-static-audio-release-20261108.mjs",
  "scripts/deploy-static-audio.mjs",
  "scripts/preview-static-audio-local.mjs",
  "scripts/test-alfa-c-panel-interaction-20261101.mjs",
  "scripts/test-alfa-c-source-click-20261108.mjs",
  "scripts/test-audio-bundle-release-20261108.mjs",
  "scripts/test-audio-bundles-browser.mjs",
  "scripts/test-audio-bundles.mjs",
  "scripts/test-audio-delivery.mjs",
  "scripts/test-static-audio-publication.mjs",
  "scripts/test-word-listening-browser.mjs",
  "vite.config.ts"
];
export function verifyAudioBundleRelease(read = readFileSync) {
  const json = path => JSON.parse(read(path)), r = json(folder + 'approval.json');
  assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true);
  assert.equal(r.userRequest, 'Publiceer deze gecontroleerde herstelversie nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, oude links, voortgang, toetsenbordbediening en het uiterlijk. Het moet €0 blijven kosten.');
  assert.equal(r.baselineSourceCommit, audioBundleBaseline);
  assert.equal(r.liveSourceCommit, '99908642b4ec39b31fdeb68ce7c591271259e77e');
  assert.equal(r.liveWorkerVersion, '30b7c138-8586-4641-a2ec-be4a3c64243f');
  assert.equal(r.liveAudioWorkerVersion, 'a5206dd1-a801-4330-a8b2-b1cac743ae27');
  assert.equal(r.audioWorkerPreviouslyExists, true); assert.equal(r.newMeteredServices, 0);
  assert.equal(r.normalCommand, 'npm run deploy'); assert.equal(r.appearanceScope, 'Restore existing Alfa C panel height only');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, audioBundleBaseline);
  git('merge-base', '--is-ancestor', audioBundleBaseline, 'HEAD');
  const all = [...new Set([...lines(git('diff', '--name-only', audioBundleBaseline)), ...lines(git('ls-files', '--others', '--exclude-standard'))])];
  const changed = all.filter(p => !['docs/audio-bundles-local-20261108/', 'docs/audio-start-click-repair-20261108/', folder].some(prefix => p.startsWith(prefix)) && p !== 'PUBLICATIE-ACTUEEL.md').sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  assert.deepEqual(changed, expected); assert.deepEqual(Object.keys(r.files).sort((a, b) => a < b ? -1 : a > b ? 1 : 0), expected);
  for (const [path, hash] of Object.entries({...r.files, ...r.evidenceFiles})) assert.equal(sha(read(path)), hash, path);
  const previous = JSON.parse(git('show', audioBundleBaseline + ':package.json')), current = json('package.json');
  assert.deepEqual(current.dependencies, previous.dependencies); assert.deepEqual(current.devDependencies, previous.devDependencies);
  assert.equal(current.scripts.deploy, previous.scripts.deploy); assert.equal(current.scripts['check:publication'], previous.scripts['check:publication']);
  const p = json('docs/audio-start-click-repair-20261108/checks/preservation.json');
  assert(p.contentFingerprintsPreserved && p.oldAudioBytesAndPathsPreserved && p.storageUnchanged);
  assert.equal(p.originalAudioAssets, 13831); assert.equal(p.appAssets, 8587);
  const http = json('docs/audio-start-click-repair-20261108/checks/http-files.json');
  assert.equal(http.exactBytes, 22418); assert.deepEqual(http.errors, []);
  for (const name of ['source-click', 'word-listening', 'native', 'alfa-c-full']) assert.deepEqual(json('docs/audio-start-click-repair-20261108/checks/' + name + '.json').errors, []);
  const v = json(folder + 'verification.json');
  assert(v.publicationUnitPassed && v.metadataPreserved && v.originalAudioByteIdentical && v.noWorkflows && v.noPaidServices);
  const backup = json(folder + 'backup.json');
  assert(backup.driveId && backup.fullReadback && backup.zipIntegrity && backup.allSourceHashesMatch);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return r;
}
export function readBeforeAudioBundles(path, release, read = readFileSync) {
  return release && Object.hasOwn(release.files, path) ? git('show', audioBundleBaseline + ':' + path) : read(path);
}
