import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const sha = (b) => createHash('sha256').update(b).digest('hex');
const git = (...args) =>
  execFileSync('git', args, { maxBuffer: 64 * 1024 * 1024 });
const sort = (items) => items.toSorted((a, b) => a.localeCompare(b));
const evidence = 'docs/klink-alfa-c-release-20261026';
export const alfaCFiles = [
  'app/proef-alfa-c/page.tsx',
  'components/product/alfa-c-practice.tsx',
  'components/product/alfa-c-practice.css',
  'components/product/learner-app.tsx',
  'components/product/practice-chapters.tsx',
  'data/klink-teacher-manual.json',
  'lib/alfa-c-practice.ts',
  'scripts/test-alfa-c-preview.mjs',
  'scripts/test-alfa-c-preview-browser.mjs',
  'scripts/test-alfa-c-preview-layout.mjs',
  'scripts/test-alfa-c-preview-audio.mjs',
  'scripts/test-alfa-c-integration.mjs',
  'scripts/check-alfa-c-release.mjs',
  'scripts/test-alfa-c-release.mjs',
  'scripts/check-demo-mobile-release.mjs',
  'scripts/test-publication-proof.mjs',
];
export const alfaCEvidence = [
  'owner-request',
  'live-baseline',
  'review',
  'content-review',
  'media',
  'audio-metadata',
];
export function verifyAlfaCRelease(
  release = JSON.parse(
    readFileSync('docs/klink-owner-release-alfa-c-20261026.json'),
  ),
  readFile = readFileSync,
) {
  assert.equal(release.approvedBy, 'Nico');
  assert.equal(release.publicationApproved, true);
  assert.equal(
    release.userRequest,
    'Ja, dit ziet er goed uit. Controleer de drie Alfa C-blokken nog één keer op inhoud en duidelijke uitleg. Zet ze daarna online, met behoud van de huidige uitstraling, nieuwste lessen en opgeslagen voortgang.',
  );
  assert.equal(
    release.baselineSourceCommit,
    '9465da5a30b26deb1bdb50e059935f264518ba34',
  );
  assert.equal(release.liveSourceCommit, release.baselineSourceCommit);
  assert.equal(
    release.previousAuthorization,
    'docs/klink-owner-release-demo-mobile-20261026.json',
  );
  assert.equal(release.newPracticeBlocks, 3);
  assert.equal(release.steps, 36);
  assert.equal(release.newAudio, 0);
  assert.equal(release.newImages, 0);
  assert.equal(release.humanReviewClaimed, false);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(
    sha(readFile(release.previousAuthorization)),
    sha(
      git(
        'show',
        `${release.baselineSourceCommit}:${release.previousAuthorization}`,
      ),
    ),
  );
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
    sort([...new Set([...changed, ...untracked])]),
    sort(alfaCFiles),
  );
  const required = [
    ...alfaCFiles,
    'docs/KLINK-DOCENTHANDLEIDING.md',
    ...[...alfaCEvidence, 'source-manifest', 'source-drive-verification'].map(
      (n) => `${evidence}/${n}.json`,
    ),
  ];
  assert.deepEqual(sort(Object.keys(release.files)), sort(required));
  for (const [file, hash] of Object.entries(release.files))
    assert.equal(sha(readFile(file)), hash, file);
  const owner = JSON.parse(readFile(`${evidence}/owner-request.json`));
  assert.equal(owner.userRequest, release.userRequest);
  const live = JSON.parse(readFile(`${evidence}/live-baseline.json`));
  assert.equal(live.liveRelease.sourceCommit, release.liveSourceCommit);
  assert.equal(live.liveWorkerVersion, 'b8235bf0-4444-4e6a-8f6a-6a943eea8559');
  assert(live.liveSourceIsAncestor);
  const manifest = JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(
    manifest.map((r) => r.path),
    [
      ...alfaCFiles,
      'docs/KLINK-DOCENTHANDLEIDING.md',
      ...alfaCEvidence.map((n) => `${evidence}/${n}.json`),
    ],
  );
  for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
  const review = JSON.parse(readFile(`${evidence}/review.json`));
  assert.equal(review.status, 'passed-local');
  for (const field of [
    'contentChecked',
    'clearInstructions',
    'variedAnswerPositions',
    'normalEntry',
    'mobile',
    'keyboard',
    'progressPreserved',
    'newestLessonsPreserved',
    'audioPausePreserved',
    'audioMetadataPassed',
    'typesPassed',
    'lintPassed',
    'buildPassed',
    'curriculumPassed',
  ])
    assert.equal(review[field], true, field);
  const media = JSON.parse(readFile(`${evidence}/media.json`)).media;
  for (const item of media) {
    const file = 'public' + item.src;
    assert.equal(sha(readFile(file)), item.sha256, file);
    assert.equal(
      sha(git('show', `${release.baselineSourceCommit}:${file}`)),
      item.sha256,
      'Existing media must remain byte-identical',
    );
  }
  assert.equal(
    JSON.parse(readFile('data/klink-audio-policy.json'))
      .instructionAudioEnabled,
    false,
  );
  const metadata = JSON.parse(readFile(`${evidence}/audio-metadata.json`));
  assert.equal(metadata.length, 33);
  assert(
    metadata.every(
      (row) =>
        row.taalroute &&
        row.tags.artist === 'Taalroute' &&
        row.tags.album.startsWith('Klink -'),
    ),
  );
  const backup = JSON.parse(
    readFile(`${evidence}/source-drive-verification.json`),
  );
  assert(
    backup.parentVerified &&
      backup.downloadedByteIdentical &&
      backup.zipCrcVerified,
  );
  assert.equal(backup.manifestEntriesVerified, manifest.length);
  return release;
}
export function readBeforeAlfaC(file, release, readFile = readFileSync) {
  return release?.files[file]
    ? git('show', `${release.baselineSourceCommit}:${file}`)
    : readFile(file);
}
