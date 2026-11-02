import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { verifySentenceRoundTitlesRelease, readBeforeSentenceRoundTitles } from './check-sentence-round-titles-release-20261102.mjs';
import { verifyKlink10GrammarRelease } from './check-klink10-grammar-release-20261102.mjs';
const owner = 'docs/klink-owner-release-sentence-round-titles-20261102.json', folder = 'docs/sentence-round-titles-20261102/';
void test('Only the 20 sentence titles change and the preceding grammar release stays approved', () => {
  const r = verifySentenceRoundTitlesRelease(); assert.equal(r.approvedBy, 'Nico');
  assert.equal(verifyKlink10GrammarRelease().approvedBy, 'Nico');
  assert(readBeforeSentenceRoundTitles('lib/learner-copy.ts', r).toString().includes('const shortReadingTitles'));
});
for (const { file, mutate } of [
  { file: owner, mutate: r => { r.publicationApproved = false; } },
  { file: owner, mutate: r => { r.baselineSourceCommit = 'HEAD'; } },
  { file: folder + 'title-review.json', mutate: r => { r.pop(); } },
  { file: folder + 'local/browser.json', mutate: r => { r.flows.pop(); } },
  { file: folder + 'backup.json', mutate: r => { r.fullReadback = false; } },
]) void test(`Reject missing permission or proof: ${file}`, () => assert.throws(() => verifySentenceRoundTitlesRelease(f => {
  const bytes = readFileSync(f); if (f !== file) return bytes;
  const data = JSON.parse(bytes); mutate(data); return Buffer.from(JSON.stringify(data));
})));
for (const file of ['lib/learner-copy.ts', 'components/product/practice-chapters.tsx', 'hooks/use-practice-keyboard.ts', 'app/learner-ui.css']) void test(`Reject an unapproved change: ${file}`, () => assert.throws(() => verifySentenceRoundTitlesRelease(f => f === file ? Buffer.from('unexpected change') : readFileSync(f))));
