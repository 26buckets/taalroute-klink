import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyAlfaCRelease } from './check-alfa-c-release.mjs';
test('Alfa C release requires exact approval, scope, evidence and preserved live media', () => {
  const release = JSON.parse(
    readFileSync('docs/klink-owner-release-alfa-c-20261026.json'),
  );
  verifyAlfaCRelease(release);
  for (const change of [
    (r) => (r.publicationApproved = false),
    (r) => (r.userRequest = ''),
    (r) => (r.newPracticeBlocks = 4),
    (r) => (r.steps = 37),
    (r) => (r.newAudio = 1),
    (r) => (r.newImages = 1),
    (r) => (r.humanReviewClaimed = true),
    (r) => (r.liveSourceCommit = '0'.repeat(40)),
    (r) => delete r.files['lib/alfa-c-practice.ts'],
  ]) {
    const bad = structuredClone(release);
    change(bad);
    assert.throws(() => verifyAlfaCRelease(bad));
  }
  for (const file of [
    'components/product/alfa-c-practice.tsx',
    'docs/klink-alfa-c-release-20261026/content-review.json',
    'docs/klink-alfa-c-release-20261026/audio-metadata.json',
    'docs/klink-alfa-c-release-20261026/source-drive-verification.json',
  ])
    assert.throws(() =>
      verifyAlfaCRelease(release, (p) =>
        p === file ? Buffer.from('{}') : readFileSync(p),
      ),
    );
});
