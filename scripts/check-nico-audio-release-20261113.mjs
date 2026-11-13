import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const nicoBaseline = '4b82ceddaede41ee30b369a868c2b913b5571bcf';
export const nicoFolder = 'docs/nico-audio-20261113/';
const git = (...args) => execFileSync('git', args, {maxBuffer: 128e6});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const sorted = items => [...items].sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
export const nicoSourceFiles = [
  'components/product/sound-reference.tsx', 'lib/sounds.ts', 'data/klink-nico-audio.json',
  'scripts/check-nico-audio-release-20261113.mjs', 'scripts/test-nico-audio-20261113.mjs',
  'scripts/check-inline-header-release-20261110.mjs', 'scripts/deploy-static-audio.mjs',
];

export function verifyNicoAudioRelease(read = readFileSync) {
  const json = path => JSON.parse(read(path));
  const release = json(nicoFolder + 'approval.json');
  assert.equal(release.approvedBy, 'Nico');
  assert.equal(release.publicationApproved, true);
  assert.equal(release.wordAudioPolicy, 'Klink behoudt de oorspronkelijke woorden en woordaudio; alleen de 48 losse klankopnames worden vervangen. Klankstudio blijft ongewijzigd.');
  assert.equal(release.followupRequest, 'Mijn laatste opname, die is goed voor klantstudio. Wat je eerder hebt gedaan, dat moeten we houden. Maar de losse klanken in klinkt, die moeten wel apart zijn, de nieuwe. Maar de woorden die mag je de originele houden. Geen probleem');
  assert.equal(release.userRequest, 'Je mag in een Wordchat dit, of misschien is dit al een Wordchat, mag je ze allemaal gaan produceren, publiceren bedoel ik, in klink en in Klankstudio alsjeblieft');
  assert.equal(release.baselineSourceCommit, nicoBaseline);
  assert.equal(release.liveSourceCommit, '3e96aafe102248f970710d5ab542e0ec78119ffd');
  assert.equal(release.liveWorkerVersion, 'be92264d-de2a-47c7-9a49-e3ffcdd79666');
  assert.equal(release.liveAudioWorkerVersion, 'feb04164-9b5c-4752-89b2-402c6c0905fd');
  assert.equal(release.normalCommand, 'npm run deploy');
  assert.equal(release.newMeteredServices, 0);
  assert.equal(release.audioWorkerPreviouslyExists, true);
  assert.equal(release.humanListeningReview, 'Niet uitgevoerd; eigenaar heeft publicatie expliciet toegestaan.');
  assert.deepEqual(release.liveRoutes, JSON.parse(git('show', nicoBaseline + ':docs/header-inline-20261110/approval.json')).liveRoutes);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, nicoBaseline);
  git('merge-base', '--is-ancestor', nicoBaseline, 'HEAD');
  const manifestBytes = read(nicoFolder + 'source-manifest.json');
  assert.equal(sha(manifestBytes), release.sourceManifestSha256);
  const manifest = JSON.parse(manifestBytes), mapping = json('data/klink-nico-audio.json');
  const reference = json('data/klink-sounds.json');
  assert.equal(manifest.speaker, 'Nico Knoester');
  assert.equal(manifest.sources.length, 9); assert.equal(manifest.files.length, 98);
  assert.equal(manifest.files.filter(row => row.type === 'klank').length, 48);
  assert.equal(manifest.files.filter(row => row.type === 'woord').length, 50);
  const expected = {speaker: manifest.speaker, recordedAt: manifest.date, sounds: {}, words: {}, additionalSounds: {}};
  const audioFiles = [];
  for (const row of manifest.files) {
    assert(Object.hasOwn(reference.sounds, row.cardId));
    assert(/^[a-z_]+$/.test(row.stem));
    assert(manifest.sources.some(source => source.name === row.source));
    const path = `public/klank-audio/nico-20261113/${row.stem}.mp3`, bytes = read(path);
    assert.equal(bytes.length, row.mp3.bytes, path); assert.equal(sha(bytes), row.mp3.sha256, path);
    assert.equal(release.files[path], row.mp3.sha256, path); audioFiles.push(path);
    const url = path.slice(6);
    if (row.type === 'woord') (expected.words[row.cardId] ??= {})[row.label] = url;
    else if (row.id === row.cardId) expected.sounds[row.cardId] = url;
    else (expected.additionalSounds[row.cardId] ??= []).push({label: row.label, audio: url});
  }
  assert.deepEqual(mapping, expected);
  assert.deepEqual(sorted(Object.keys(mapping.sounds)), sorted(Object.keys(reference.sounds)));
  assert.equal(new Set(audioFiles).size, 98);
  const expectedFiles = sorted([...nicoSourceFiles, ...audioFiles]);
  const changed = sorted(new Set([...lines(git('diff', '--name-only', nicoBaseline)), ...lines(git('ls-files', '--others', '--exclude-standard'))].filter(path => !path.startsWith(nicoFolder) && path !== 'PUBLICATIE-ACTUEEL.md')));
  assert.deepEqual(changed, expectedFiles, 'Only the scoped recording integration may change');
  assert.deepEqual(sorted(Object.keys(release.files)), expectedFiles);
  for (const [path, hash] of Object.entries(release.files)) assert.equal(sha(read(path)), hash, path);
  return release;
}

export function readBeforeNicoAudio(path, release, read = readFileSync) {
  return Object.hasOwn(release.files, path) ? git('show', nicoBaseline + ':' + path) : read(path);
}
