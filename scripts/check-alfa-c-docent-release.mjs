import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) =>
  execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const sha = (b) => createHash('sha256').update(b).digest('hex');
export function verifyTeacherRelease(read = readFileSync) {
  const release = JSON.parse(
    read('docs/klink-owner-release-alfa-c-docent-20261029.json'),
  );
  assert.equal(
    release.baselineSourceCommit,
    'b3d4af2f941a11c3d5d75f20e8eec1bbce801051',
  );
  assert.equal(release.approvedBy, 'Nico');
  assert.equal(release.userAnswer, 'prima, zet online');
  assert.equal(release.publicationApproved, true);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  const roots = [
    'app',
    'components',
    'hooks',
    'data',
    'lib',
    'public',
    'scripts',
  ];
  const changed = git(
    'diff',
    '--name-only',
    release.baselineSourceCommit,
    '--',
    ...roots,
  )
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);
  const untracked = git(
    'ls-files',
    '--others',
    '--exclude-standard',
    '--',
    ...roots,
  )
    .toString()
    .trim()
    .split('\n')
    .filter(Boolean);
  assert.deepEqual(
    [...new Set([...changed, ...untracked])].sort(),
    [...release.changedFiles].sort(),
  );
  for (const [file, hash] of Object.entries(release.files))
    assert.equal(sha(read(file)), hash, file);
  assert(release.changedFiles.every((file) => release.files[file]));
  assert.equal(
    git(
      'diff',
      release.baselineSourceCommit,
      '--',
      'app',
      'hooks',
      'db',
      'drizzle',
      'lib/learner-progress.ts',
      'lib/alfa-c-practice.ts',
      'lib/alfa-c-functioneel.ts',
      'lib/alfa-c-dagelijks.ts',
      'data/klink-alfa-c.json',
      'data/klink-alfa-c-functioneel.json',
      'data/klink-alfa-c-dagelijks.json',
      'public/klink-wordmark.svg',
    ).length,
    0,
    'Preserve live app, learner records, original tasks and logo',
  );
  const pack = JSON.parse(read('data/klink-alfa-c-docent.json')),
    proof = JSON.parse(read(release.reviewPath));
  assert.equal(pack.tasks.length, 27);
  assert.equal(new Set(pack.tasks.map((t) => t.id)).size, 27);
  assert.deepEqual(
    pack.tasks.map((t) => t.id),
    proof.sourceIds,
  );
  assert.equal(pack.tasks.find((t) => t.kind === 'grammar').stages.length, 13);
  assert.equal(pack.tasks.filter((t) => t.kind === 'recall').length, 12);
  assert.equal(proof.realLearnerTrial, false);
  assert.equal(proof.missingSourceTasksStillBlocked, 72);
  for (const key of [
    'types',
    'lint',
    'build',
    'unit',
    'all27Browser',
    'old180Regression',
    'storagePreserved',
    'firstAttemptAndHelp',
    'localOnlyChecks',
  ])
    assert.equal(proof[key], true, key);
  const browser = JSON.parse(read(release.browserPath));
  assert.deepEqual(browser.errors, []);
  assert.equal(
    new Set(
      browser.checks
        .filter((c) => c.engine === 'chromium' && c.id)
        .map((c) => c.id),
    ).size,
    27,
  );
  const media = JSON.parse(read('data/klink-alfa-c-docent-audio.json'));
  assert.equal(media.clips.length, 33);
  assert.equal(media.clips.filter((c) => c.new).length, 6);
  for (const c of media.clips) {
    assert.equal(sha(read('public' + c.src)), c.sha256);
    for (const k of ['artist', 'album_artist', 'publisher'])
      assert.equal(c.metadata[k], 'Taalroute');
  }
  const backup = JSON.parse(read(release.backupPath));
  assert.equal(backup.parentId, '1MA6t7naBAJP-fqlhDIvSBuaw8G4okvZR');
  assert(
    backup.parentVerified &&
      backup.downloadedByteIdentical &&
      backup.zipCrcVerified,
  );
  return release;
}
export function readBeforeTeacher(file, release, read = readFileSync) {
  return release.changedFiles.includes(file)
    ? git('show', `${release.baselineSourceCommit}:${file}`)
    : read(file);
}
