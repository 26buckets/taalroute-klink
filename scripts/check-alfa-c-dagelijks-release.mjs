import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyDailyRelease(read = readFileSync) {
  const release = JSON.parse(read('docs/klink-owner-release-alfa-c-dagelijks-20261028.json'));
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.baselineSourceCommit, 'a743a83d215f925c4a43496e9ff2a4ee5cc168e6');
  assert.equal(release.liveSourceCommit, '2b6372862abd57268ecbc959f590f92abfbc9a2c');
  assert.equal(release.scope, 'Productie 028: 72 dagelijkse berichten en documenten');
  assert.equal(release.humanReviewClaimed, false);
  assert(release.userRequest.includes('Publiceer uitsluitend verifieerbaar complete en correct geteste onderdelen'));
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts'];
  const changed = git('diff', '--name-only', release.baselineSourceCommit, '--', ...roots).toString().trim().split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...roots).toString().trim().split('\n').filter(Boolean);
  assert.deepEqual([...new Set([...changed, ...untracked])].sort(), [...release.changedFiles].sort());
  for (const [path, hash] of Object.entries(release.files)) assert.equal(sha(read(path)), hash, path);
  assert(release.changedFiles.every(p => release.files[p]));
  assert.equal(git('diff', release.baselineSourceCommit, '--', 'db', 'drizzle', 'lib/learner-progress.ts', 'data/klink-imported-practice.json', 'data/klink-alfa-c-functioneel.json', 'data/klink-alfa-c-texts.json', 'public/klink-wordmark.svg').length, 0);
  const source = JSON.parse(read('data/klink-alfa-c-dagelijks.json'));
  assert.equal(source.blocks.length, 6); assert.equal(source.blocks.flatMap(b => b.steps).length, 72);
  const audio = JSON.parse(read('data/klink-alfa-c-dagelijks-audio.json'));
  assert.equal(audio.clips.length, 375); assert.notEqual(audio.voices.guide, audio.voices.target);
  const clips = new Map(audio.clips.map(c => [c.id, c]));
  for (const c of audio.clips) {
    assert.equal(c.voiceId, audio.voices[c.role]); assert.equal(sha(read('public' + c.src)), c.sha256);
    for (const field of ['artist', 'album_artist', 'publisher']) assert.equal(c.metadata[field], 'Taalroute');
    assert.equal(c.audioReencoded, false);
  }
  for (const b of source.blocks) {
    for (const id of [b.startAudio, b.endAudio]) assert.equal(clips.get(id)?.role, 'guide');
    for (const s of b.steps) for (const [role, id] of Object.entries(s.audio)) {
      if (!id) continue;
      assert.equal(clips.get(id)?.text, s.speech[role]);
      assert.equal(clips.get(id)?.role, ['O', 'V'].includes(role) ? 'target' : 'guide');
    }
  }
  const review = JSON.parse(read(release.reviewPath));
  assert.equal(review.status, 'passed-local');
  for (const key of ['sourceCorrections', 'firstAttempt', 'helpPersistence', 'oldContentPreserved', 'browserTests', 'audioTranscriptReview', 'audioMetadata', 'types', 'lint', 'build', 'curriculum']) assert.equal(review[key], true, key);
  assert.equal(review.humanListeningReview, false);
  const backup = JSON.parse(read(release.backupPath));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  return release;
}
export function readBeforeDaily(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : read(file);
}
