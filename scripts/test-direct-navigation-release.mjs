import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyDirectNavigationRelease } from './check-direct-navigation-release.mjs';
const release = verifyDirectNavigationRelease();
for (const path of ['app/learner-layout.css', 'components/product/learner-app.tsx', 'lib/practice-navigation.ts', 'data/klink-teacher-manual.json']) {
  assert.throws(() => verifyDirectNavigationRelease(file => file === path ? Buffer.from('tampered') : readFileSync(file)));
}
assert.throws(() => verifyDirectNavigationRelease(file => file === 'docs/direct-kiezen-publicatie-20261030/review.json' ? Buffer.from('{}') : readFileSync(file)));
assert.throws(() => verifyDirectNavigationRelease(file => file === 'docs/direct-kiezen-publicatie-20261030/backup.json' ? Buffer.from('{"verified":false}') : readFileSync(file)));
console.log('PASS exact navigation scope, unchanged content/media/storage, review and backup tamper rejection', release.changedFiles.length);
