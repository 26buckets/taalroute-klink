import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyAlfaCTextRelease } from './check-alfa-c-texts-release.mjs';
test('Alfa C text publication requires exact scope, local checks and verified backup', () => {
  const r = verifyAlfaCTextRelease();
  for (const mutate of [x => x.publicationApproved = false, x => x.newAudio = 1, x => x.steps = 35, x => x.humanLearnerTrial = true, x => x.userRequest = '', x => x.baselineSourceCommit = '0'.repeat(40), x => delete x.files['data/klink-alfa-c-texts.json']]) {
    const bad = structuredClone(r); mutate(bad); assert.throws(() => verifyAlfaCTextRelease(undefined, bad));
  }
  for (const f of ['AGENTS.md', 'data/klink-alfa-c-texts.json', 'components/product/alfa-c-practice.tsx', 'docs/klink-alfa-c-texts-20261027/review.json', 'docs/klink-alfa-c-texts-20261027/source-drive-verification.json']) assert.throws(() => verifyAlfaCTextRelease(p => p === f ? Buffer.from('{}') : readFileSync(p)));
});
