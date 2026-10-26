import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyPracticeExplanationsRelease } from './check-practice-explanations-release.mjs';
test('Explanation publication requires the approved preview, unchanged live basis, scoped sources and verified backup', () => {
  const release = JSON.parse(readFileSync('docs/klink-owner-release-practice-explanations-20261026.json'));
  verifyPracticeExplanationsRelease(release);
  for (const change of [r => r.publicationApproved = false, r => r.steps = 5, r => r.newAudio = 1, r => r.newLessons = 1, r => r.approvedPreviewCommit = '0'.repeat(40), r => r.liveSourceCommit = '0'.repeat(40), r => delete r.files['components/product/practice-line.tsx']]) {
    const bad = structuredClone(release); change(bad); assert.throws(() => verifyPracticeExplanationsRelease(bad));
  }
  for (const changed of ['components/product/practice-line.tsx', 'public/practice-explanations/app.js', 'docs/klink-owner-release-self-listening-20261026.json', 'docs/klink-practice-explanations-20261026/review.json', 'docs/klink-practice-explanations-20261026/source-drive-verification.json']) {
    assert.throws(() => verifyPracticeExplanationsRelease(release, file => file === changed ? Buffer.from('{}') : readFileSync(file)));
  }
});
