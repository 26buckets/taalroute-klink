import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const evidence = 'docs/klink-wordaudio-publication-20261025';
const request = 'Zet alle nieuwe woordaudio, inclusief de vervanging van man, nu maar live in Klink en controleer of alles goed afspeelt.';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const read = path => JSON.parse(readFileSync(path));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

export function assertWordAudioMappings(before, after, recordings, expectedWords) {
  assert.equal(recordings.length, expectedWords.size);
  const expected = structuredClone(before), seen = new Set();
  for (const row of recordings) {
    assert(!seen.has(row.id), `Duplicate word recording ${row.id}`); seen.add(row.id);
    assert.equal(row.text, expectedWords.get(row.id), row.id);
    assert.equal(row.src, `/package-audio/woorden-20261025/${row.id}.mp3`);
    assert.match(row.id, /^[A-Za-z0-9_-]+$/);
    assert.equal(row.role, 'target'); assert.equal(row.voiceId, '0qLmDzgqulxcvv0yf3kg');
    assert.equal(row.metadataApproved, true); assert.equal(row.humanReview, 'open');
    assert(!before[row.id]?.audio || row.id === 'klink-woord-man', `Existing audio cannot silently change: ${row.id}`);
    expected[row.id] = { ...(expected[row.id] ?? { review: 'open' }), audio: row.src };
  }
  assert.deepEqual(after, expected, 'Only the authorized word-audio connections may change');
  return seen.size;
}

export function verifyWordAudioRelease() {
  const release = read('docs/klink-owner-release-wordaudio-20261025.json');
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.userRequest, request); assert.equal(read(`${evidence}/owner-request.json`).userRequest, request);
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-vervolg-20261025.json');
  assert.equal(release.baselineSourceCommit, '9a3b7e33c55c28e282b6eb025869a53be5f89f14');
  assert.equal(release.liveSourceCommit, 'bb2f7add5ab7bc790cfa37f36e581f83fdd3dc02');
  assert.equal(release.humanReviewClaimed, false); assert.equal(release.openListeningFlags, 28);
  assert.equal(release.newMissingWordRecordings, 4789); assert.deepEqual(release.replacedExistingWordIds, ['klink-woord-man']);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(digest(readFileSync(release.previousAuthorization)), release.previousAuthorizationSha256);
  assert.equal(digest(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)), release.previousAuthorizationSha256);
  const manifest = read(`${evidence}/audio-manifest.json`);
  assert.equal(manifest.length, 4790); assert.equal(digest(readFileSync(`${evidence}/audio-manifest.json`)), release.audioManifestSha256);
  const trial = JSON.parse(readFileSync(new URL('../data/klink-lexicon-wordbuild-20.json', import.meta.url)));
  const rest = JSON.parse(readFileSync(new URL('../data/klink-lexicon-wordbuild-rest.json', import.meta.url)));
  const expectedWords = new Map([trial, ...rest.packs].flatMap(pack => pack.words.map(word => [word.id, word.word])));
  assert.equal(expectedWords.size, 4789); expectedWords.set('klink-woord-man', 'man');
  const before = JSON.parse(git('show', `${release.baselineSourceCommit}:data/klink-media.json`));
  const after = JSON.parse(readFileSync(new URL('../data/klink-media.json', import.meta.url)));
  assert.equal(assertWordAudioMappings(before, after, manifest, expectedWords), 4790);
  for (const row of manifest) assert.equal(digest(readFileSync(`public${row.src}`)), row.sha256, row.id);
  const validation = read(`${evidence}/audio-validation.json`);
  assert.equal(validation.checked, 4790); assert.equal(validation.failed, 0); assert.equal(validation.manifestSha256, release.audioManifestSha256);
  const review = read(`${evidence}/review.json`);
  assert.equal(review.status, 'passed-local'); assert.equal(review.totalWordCards, 5127);
  assert.equal(review.allWordAudioPlayedToEnd, true); assert.equal(review.preservationPassed, true);
  assert.equal(review.wordAudioManifestSha256, release.audioManifestSha256);
  const backup = read(`${evidence}/source-drive-verification.json`);
  assert.equal(backup.parentVerified, true); assert.equal(backup.downloadedByteIdentical, true); assert.equal(backup.zipCrcVerified, true);
  for (const [file, sha] of Object.entries(release.files)) assert.equal(digest(readFileSync(file)), sha, file);
  const expected = ['data/klink-media.json', 'lib/package-content.ts', 'public/content-register/active.json', 'public/content-register/planned.json', 'public/content-register/summary.json', ...manifest.map(row => `public${row.src}`)].sort((a,b)=>a.localeCompare(b));
  const changed = git('diff', '--name-only', release.baselineSourceCommit, '--', 'app', 'components', 'hooks', 'data', 'lib', 'public').trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
  assert.deepEqual(changed, expected, 'No unrelated runtime change may enter the word-audio release');
  return release;
}
