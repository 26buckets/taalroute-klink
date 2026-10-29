import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export function verifyPhotoRepairRelease(read = readFileSync) {
  const release = JSON.parse(read('docs/klink-owner-release-alfa-c-photo-repair-20261029.json'));
  assert.equal(release.baselineSourceCommit, 'aee3cb7fda97a97e8ce1866e74b09d66615197ea');
  assert.equal(release.liveSourceCommit, '25704b43de178d62baa81a1eb1aa5cd2eab883dc');
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.humanReviewClaimed, false); assert.equal(release.newAudio, 98);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public', 'scripts'];
  const changed = git('diff', '--name-only', release.baselineSourceCommit, '--', ...roots).toString().trim().split('\n').filter(Boolean);
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', ...roots).toString().trim().split('\n').filter(Boolean);
  assert.deepEqual([...new Set([...changed, ...untracked])].sort((a, b) => a.localeCompare(b)), [...release.changedFiles].sort((a, b) => a.localeCompare(b)));
  for (const [file, hash] of Object.entries(release.files)) assert.equal(sha(read(file)), hash, file);
  assert(release.changedFiles.every(file => release.files[file]));
  assert.equal(git('diff', release.baselineSourceCommit, '--', 'db', 'drizzle', 'hooks', 'lib/learner-progress.ts', 'lib/alfa-c-functioneel.ts', 'public/klink-wordmark.svg').length, 0, 'Preserve all tasks, audio, progress, logo and database');
  const audio = JSON.parse(read('data/klink-alfa-c-dagelijks-audio.json'));
  const before = JSON.parse(git('show', `${release.baselineSourceCommit}:data/klink-alfa-c-dagelijks-audio.json`));
  assert.deepEqual(audio.clips.slice(0, before.clips.length), before.clips);
  const newAudio = release.changedFiles.filter(file => file.startsWith('public/package-audio/') && file.endsWith('.mp3'));
  assert.equal(newAudio.length, 98);
  const functional = JSON.parse(read('data/klink-alfa-c-functioneel-audio.json'));
  const pilot = JSON.parse(read('data/klink-alfa-c-audio.json'));
  const bySource = new Map([...audio.clips, ...functional.clips, ...Object.values(pilot.clips)].map(clip => [clip.src, clip]));
  for (const file of newAudio) {
    const clip = bySource.get(file.slice(6)); assert(clip, file);
    assert.equal(sha(read(file)), clip.sha256);
    assert.equal(clip.voiceId, audio.voices[clip.role]);
    for (const key of ['artist', 'album_artist', 'publisher']) assert.equal(clip.metadata[key], 'Taalroute');
    assert.equal(clip.audioReencoded, false);
  }
  for (const id of ['KAC-HER-9B6A7675A4A1', 'KAC-HER-7CD1889A6F26']) assert.equal(audio.clips.find(c => c.id === id).humanListeningReview, 'approved-by-Nico-20261029');
  const source = JSON.parse(read('data/klink-alfa-c-dagelijks.json'));
  const clips = new Map(audio.clips.map(c => [c.id, c]));
  for (const block of source.blocks) for (const step of block.steps) for (const [role, id] of Object.entries(step.audio)) {
    if (id) assert.equal(clips.get(id)?.text, step.speech[role]);
    if (role === 'O') assert.equal(step.speech.O, step.documents.map(d => d.text).join('\n\n'));
  }
  const review = JSON.parse(read(release.reviewPath));
  for (const key of ['fourPhotos', 'squareFrames', 'handsReview', 'desktopNoScroll', 'mobileReflow', 'firstAttemptAndHelp', 'oldContentPreserved', 'types', 'lint', 'build', 'curriculum']) assert.equal(review[key], true, key);
  const layouts = JSON.parse(read(release.layoutPath));
  assert.equal(layouts.checks.length, 854); assert.deepEqual(layouts.errors, []); assert.deepEqual(layouts.failures, []);
  const photos = JSON.parse(read(release.photosPath));
  assert(photos.checks.length >= 150); assert.deepEqual(photos.errors, []); assert.deepEqual(photos.failures, []);
  const readalong = JSON.parse(read(release.readalongPath));
  assert.equal(readalong.checks.length, 360); assert.deepEqual(readalong.errors, []);
  const backup = JSON.parse(read(release.backupPath));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  assert.equal(backup.parentId, '1MA6t7naBAJP-fqlhDIvSBuaw8G4okvZR');
  return release;
}
export function readBeforePhotoRepair(file, release, read = readFileSync) {
  return release.changedFiles.includes(file) ? git('show', `${release.baselineSourceCommit}:${file}`) : read(file);
}
