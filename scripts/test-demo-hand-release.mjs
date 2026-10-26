import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyDemoHandRelease } from './check-demo-hand-release.mjs';
test('Hand animation publication remains scoped to the approved live successor and verified backup', () => {
  const release = JSON.parse(readFileSync('docs/klink-owner-release-demo-hand-20261026.json'));
  verifyDemoHandRelease(release);
  for (const change of [r=>r.publicationApproved=false, r=>r.extraControls=true, r=>r.newAudio=1, r=>r.newLessons=1, r=>r.liveSourceCommit='0'.repeat(40), r=>delete r.files['app/learner-ui.css']]) {
    const bad=structuredClone(release); change(bad); assert.throws(()=>verifyDemoHandRelease(bad));
  }
  for (const file of ['app/learner-ui.css','components/product/package-exercise-browser.tsx','docs/klink-demo-hand-20261026/review.json','docs/klink-demo-hand-20261026/source-drive-verification.json']) {
    assert.throws(()=>verifyDemoHandRelease(release,p=>p===file?Buffer.from('{}'):readFileSync(p)));
  }
});
