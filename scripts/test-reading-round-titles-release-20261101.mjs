import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { verifyReadingRoundTitlesRelease, readBeforeReadingRoundTitles } from './check-reading-round-titles-release-20261101.mjs';
import { verifySpaceMixedInputRelease } from './check-space-mixed-input-release-20261101.mjs';
const owner = 'docs/klink-owner-release-reading-round-titles-20261101.json', folder = 'docs/reading-round-titles-20261101/';
void test('Only the 68 content titles change and the preceding keyboard release stays approved', () => {
  const r = verifyReadingRoundTitlesRelease(); assert.equal(r.approvedBy, 'Nico');
  assert.equal(verifySpaceMixedInputRelease().approvedBy, 'Nico');
  assert(readBeforeReadingRoundTitles('lib/learner-copy.ts', r).toString().includes("title = reading ? 'Korte teksten'"));
});
for (const { file, mutate } of [
  { file: owner, mutate: r => { r.publicationApproved = false; } },
  { file: owner, mutate: r => { r.baselineSourceCommit = 'HEAD'; } },
  { file: folder + 'title-review.json', mutate: r => { r.pop(); } },
  { file: folder + 'local/browser.json', mutate: r => { r.flows.pop(); } },
  { file: folder + 'backup.json', mutate: r => { r.fullReadback = false; } },
]) void test(`Reject missing permission or proof: ${file}`, () => assert.throws(() => verifyReadingRoundTitlesRelease(f => {
  const bytes = readFileSync(f); if (f !== file) return bytes;
  const data = JSON.parse(bytes); mutate(data); return Buffer.from(JSON.stringify(data));
})));
for (const file of ['lib/learner-copy.ts', 'hooks/use-practice-keyboard.ts', 'app/learner-ui.css']) void test(`Reject an unapproved change: ${file}`, () => assert.throws(() => verifyReadingRoundTitlesRelease(f => f === file ? Buffer.from('unexpected change') : readFileSync(f))));
