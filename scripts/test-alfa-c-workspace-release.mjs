import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { verifyWorkspaceRelease } from './check-alfa-c-workspace-release.mjs';
test('workspace release binds owner scope, reviewed UI, all layout results and verified backup', () => {
  const release = verifyWorkspaceRelease();
  for (const path of Object.keys(release.files)) assert.throws(() => verifyWorkspaceRelease(file => file === path ? Buffer.from('{}') : readFileSync(file)), path);
  for (const edit of [r => r.publicationApproved = false, r => r.liveSourceCommit = '0'.repeat(40), r => r.humanReviewClaimed = true, r => r.changedFiles = [], r => r.newAudio = 1]) {
    const changed = structuredClone(release); edit(changed);
    assert.throws(() => verifyWorkspaceRelease(file => file === 'docs/klink-owner-release-alfa-c-workspace-20261028.json' ? Buffer.from(JSON.stringify(changed)) : readFileSync(file)));
  }
});
