import {verifyAudioBundleRelease, readBeforeAudioBundles, audioBundleBaseline} from './check-audio-bundle-release-20261108.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const staticAudioBaseline = '98568bd3543e056a38f9427b5c331a8f7cf793d0';
const folder = 'docs/static-audio-publication-20261108/';
const git = (...args) => execFileSync('git', args, {maxBuffer: 128e6});
const sha = b => createHash('sha256').update(b).digest('hex');
const lines = b => b.toString().trim().split('\n').filter(Boolean);
const expected = [
  'package.json', 'scripts/check-asset-limit.mjs', 'scripts/check-opening-release-20261106.mjs',
  'scripts/check-static-audio-release-20261108.mjs', 'scripts/deploy-static-audio.mjs',
  'scripts/measure-help-button-network.mjs', 'scripts/prepare-pr12-compression.mjs',
  'scripts/prepare-static-audio-local.mjs', 'scripts/prepare-static-audio-publication.mjs', 'scripts/preview-static-audio-local.mjs',
  'scripts/test-deferred-alfa-c-audio.mjs', 'scripts/test-deferred-bundle.mjs', 'scripts/test-precomputed-connected-content.mjs',
  'scripts/test-quiet-controls-browser.mjs', 'scripts/test-static-audio-http.mjs', 'scripts/test-static-audio-local.mjs',
  'scripts/test-static-audio-publication.mjs',
].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
export function verifyStaticAudioRelease(read = readFileSync) {
  const bundle = verifyAudioBundleRelease(read);
  const latestRead = read;
  read = path => readBeforeAudioBundles(path, bundle, latestRead);
  const r = JSON.parse(read(folder + 'approval.json'));
  assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true);
  assert.equal(r.userRequest, 'Publiceer de gecontroleerde gratis audio-oplossing nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, links, voortgang en het uiterlijk. Het moet €0 blijven kosten.');
  assert.equal(r.baselineSourceCommit, staticAudioBaseline);
  assert.equal(r.liveSourceCommit, '693b58c192cc1a480c5ac5266f102933aa8c4b3d');
  assert.equal(r.liveWorkerVersion, 'd95cebab-f17e-4cff-b4ca-6254b0a94b03');
  assert.equal(r.audioWorkerPreviouslyExists, false); assert.equal(r.newMeteredServices, 0);
  assert.equal(r.designChanged, false); assert.equal(r.normalCommand, 'npm run deploy');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, staticAudioBaseline);
  git('merge-base', '--is-ancestor', staticAudioBaseline, 'HEAD');
  const all = lines(git('diff', '--name-only', staticAudioBaseline, audioBundleBaseline));
  const changed = all.filter(p => !p.startsWith('docs/static-audio-') && p !== 'PUBLICATIE-ACTUEEL.md').sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  assert.deepEqual(changed, expected); assert.deepEqual(Object.keys(r.files).sort((a, b) => a < b ? -1 : a > b ? 1 : 0), expected);
  for (const [path, hash] of Object.entries({...r.files, ...r.evidenceFiles})) assert.equal(sha(read(path)), hash, path);
  const prior = JSON.parse(git('show', staticAudioBaseline + ':package.json')), current = JSON.parse(read('package.json'));
  const scripts = {...current.scripts};
  for (const name of ['audio:prepare:local', 'audio:preview:local', 'test:static-audio', 'test:static-audio:http']) delete scripts[name];
  scripts.deploy = prior.scripts.deploy;
  assert.deepEqual({...current, scripts}, prior, 'No dependency, build, gate or other command changes');
  assert.equal(current.scripts.deploy, 'npm run check:publication && npm run build && node scripts/deploy-static-audio.mjs');
  const local = JSON.parse(read('docs/static-audio-local-20261108/result.json'));
  assert(local.buildPassed && local.typesPassed && local.runtimeAndContentSourcesUnchanged && local.appearanceFollowupExact);
  assert.equal(local.lint.errorsAfter, 0); assert.equal(local.httpExactAssets, 18393); assert.equal(local.audioExactAssets, 13831);
  const v = JSON.parse(read(folder + 'verification.json'));
  assert(v.productionConfigPassed && v.rollbackOrderPassed && v.dryRunPassed && v.lintPassed && v.typesPassed);
  assert.equal(v.metadataFiles, 13759); assert.equal(v.metadataErrors, 0); assert.equal(v.newMeteredServices, 0);
  assert.equal(v.packedMetadataClips, 6293); assert.equal(v.packedMetadataBundles, 72); assert.equal(v.packedMetadataErrors, 0);
  const backup = JSON.parse(read(folder + 'backup.json'));
  assert(backup.driveId && backup.fullReadback && backup.zipIntegrity && backup.allSourceHashesMatch);
  assert.deepEqual(backup.files, r.files);
  return {...r, bundle};
}
export function readBeforeStaticAudio(path, release, read = readFileSync) {
  return release && Object.hasOwn(release.files, path) ? git('show', staticAudioBaseline + ':' + path) : readBeforeAudioBundles(path, release?.bundle, read);
}
