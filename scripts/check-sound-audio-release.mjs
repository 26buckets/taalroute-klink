import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const digest = value => createHash('sha256').update(value).digest('hex');
const read = path => JSON.parse(readFileSync(path));
const git = (...args) => execFileSync('git', args, { maxBuffer: 32 * 1024 * 1024 });
const evidence = 'docs/klink-klanken-release-20261025';
export const soundAudioFiles = ['PUBLICATIE.md', 'app/sounds.css', 'components/product/sound-reference.tsx', 'data/klink-sounds.json', 'data/klink-teacher-manual.json', 'docs/KLINK-DOCENTHANDLEIDING.md', 'lib/media-player.ts', 'lib/package-content.ts', 'lib/sounds.ts', 'scripts/check-article-review-release.mjs', 'scripts/check-curriculum-release.mjs', 'scripts/check-sound-audio-release.mjs', 'scripts/test-article-review-release.mjs', 'scripts/test-media-rate.mjs', 'scripts/test-publication-proof.mjs', 'scripts/test-sound-audio-release.mjs', 'scripts/test-sounds.mjs', 'scripts/test-sounds-browser.mjs'];
export function verifySoundAudioRelease(release = read('docs/klink-owner-release-klankaudio-20261025.json')) {
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.baselineSourceCommit, '10e5a1d09aba20fc6df7780486f69a72751bb979');
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-article-review-20261025.json');
  assert.equal(release.newAudio, 46); assert.equal(release.ownerApprovedAudio, 8); assert.equal(release.humanReviewNewRecordings, false);
  const request = read(`${evidence}/owner-request.json`);
  assert.equal(release.userRequest, request.audioRequest); assert(request.shortAApproved && request.interactionRequest.includes('als ik de letter klik'));
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(digest(readFileSync(release.previousAuthorization)), digest(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  const audio = read(`${evidence}/audio-manifest.json`), reference = read('data/klink-sounds.json');
  assert.equal(audio.total, 46); assert.equal(audio.files.length, 46); assert.equal(audio.humanReviewNewRecordings, false);
  assert.notEqual(audio.voiceId, audio.instructionVoiceId); assert.equal(audio.instructionAudioGenerated, false);
  assert.deepEqual(audio.files.filter(row => row.ownerApproved).map(row => row.id).sort((a, b) => a.localeCompare(b)), ['a','aa','e','ee','i','ie','m','s']);
  assert.deepEqual(audio.files.map(row => row.id).sort((a, b) => a.localeCompare(b)), Object.keys(reference.sounds).sort((a, b) => a.localeCompare(b)));
  for (const row of audio.files) {
    assert.equal(row.path, `public/klank-audio/klanken-20261025/${row.id}.mp3`);
    assert.equal(reference.sounds[row.id].audio, row.path.slice(6));
    assert.equal(digest(readFileSync(row.path)), row.sha256, row.path);
    assert.equal(release.files[row.path], row.sha256);
    assert.equal(row.clippedSamples, 0); assert(row.losslessMetadataVerified);
    for (const field of ['artist','album_artist','publisher']) assert.equal(row.metadata[field], 'Taalroute');
    assert(!/eleven|suno|openai|generator/i.test(JSON.stringify(row.metadata)));
  }
  const runtime = git('diff', '--name-only', release.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public').toString().trim().split('\n').filter(Boolean).sort((a, b) => a.localeCompare(b));
  const expected = [...soundAudioFiles.filter(file => /^(app|components|data|lib|public)\//.test(file)), ...audio.files.map(row => row.path)].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(runtime, expected);
  const manifest = read(`${evidence}/source-manifest.json`);
  assert.deepEqual(manifest.map(row => row.path), soundAudioFiles);
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
  for (const name of ['owner-request','audio-manifest','review','source-manifest','source-drive-verification','live-baseline','preservation']) assert(release.files[`${evidence}/${name}.json`]);
  for (const [file, hash] of Object.entries(release.files)) assert.equal(digest(readFileSync(file)), hash, file);
  const review = read(`${evidence}/review.json`), backup = read(`${evidence}/source-drive-verification.json`);
  assert.equal(review.status, 'passed-local'); assert(review.preservationPassed && review.directPlaybackPassed && review.all46PlaybackPassed && review.metadataPassed);
  assert.equal(review.humanReviewNewRecordings, false);
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  assert.equal(backup.manifestEntriesVerified, soundAudioFiles.length);
  return release;
}
export function readBeforeSoundAudioRelease(file, release) {
  return release.files[file] ? git('show', `${release.baselineSourceCommit}:${file}`) : readFileSync(file);
}
