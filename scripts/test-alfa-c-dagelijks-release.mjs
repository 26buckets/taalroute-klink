import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { verifyDailyRelease } from './check-alfa-c-dagelijks-release.mjs';
void test('daily successor binds authorization, reviewed source, media and preservation evidence', () => {
  const release = verifyDailyRelease();
  for (const path of Object.keys(release.files)) {
    if (!path.endsWith('.json') && !path.endsWith('.tsx')) continue;
    assert.throws(() => verifyDailyRelease(file => file === path ? Buffer.from('{}') : readFileSync(file)), path);
  }
  for (const edit of [r => r.publicationApproved = false, r => r.liveSourceCommit = '0'.repeat(40), r => r.humanReviewClaimed = true, r => r.changedFiles = []]) {
    const changed = structuredClone(release); edit(changed);
    assert.throws(() => verifyDailyRelease(file => file === 'docs/klink-owner-release-alfa-c-dagelijks-20261028.json' ? Buffer.from(JSON.stringify(changed)) : readFileSync(file)));
  }
});
