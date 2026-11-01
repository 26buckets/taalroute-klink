import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { verifyCardTitlesRelease, readBeforeCardTitles } from './check-card-titles-release-20261101.mjs';
import { verifyEnterFocusRelease } from './check-enter-focus-release-20261101.mjs';
const owner = 'docs/klink-owner-release-card-titles-20261101.json', folder = 'docs/card-titles-appwide-20261101/';
test('Approved appwide card change and the preceding Enter evidence both pass', () => {
  const r = verifyCardTitlesRelease();
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(verifyEnterFocusRelease().approvedBy, 'Nico');
  assert(!readBeforeCardTitles('lib/learner-copy.ts', r).toString().includes('learnerCollectionLabel'));
});
for (const [file, mutate] of [
  [owner, r => { r.publicationApproved = false; }],
  [owner, r => { r.baselineSourceCommit = 'HEAD'; }],
  [folder + 'local/checks.json', r => { r.results.pop(); }],
  [folder + 'verification.json', r => { r.allMediaPreserved = false; }],
  [folder + 'backup.json', r => { r.fullReadback = false; }],
]) test(`Reject missing permission or evidence: ${file}`, () => assert.throws(() => verifyCardTitlesRelease(f => {
  const bytes = readFileSync(f);
  if (f !== file) return bytes;
  const data = JSON.parse(bytes); mutate(data); return Buffer.from(JSON.stringify(data));
})));
for (const file of ['app/learner-ui.css', 'components/product/package-experience.tsx', 'hooks/use-practice-keyboard.ts']) test(`Reject an unapproved change: ${file}`, () => assert.throws(() => verifyCardTitlesRelease(f => f === file ? Buffer.from('unexpected change') : readFileSync(f))));
