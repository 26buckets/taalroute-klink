import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyChoiceRelease} from './check-alfa-c-choice-release.mjs';
test('choice clarity release stays bounded to the approved live successor and verified controls',()=>{
 const release=verifyChoiceRelease();
 for(const mutate of [r=>r.publicationApproved=false,r=>r.userRequest='',r=>r.followupRequest='',r=>r.newAudio=1,r=>r.newImages=1,r=>r.choiceTasks=27,r=>r.humanLearnerTrial=true,r=>r.baselineSourceCommit='0'.repeat(40)]){
  const bad=structuredClone(release);mutate(bad);assert.throws(()=>verifyChoiceRelease(undefined,bad));
 }
 for(const path of ['components/product/alfa-c-functioneel.tsx','components/product/alfa-c-practice.css','docs/klink-alfa-c-keuze-opdracht-20261028/review.json','docs/klink-alfa-c-keuze-opdracht-20261028/browser-review.json','docs/klink-alfa-c-keuze-opdracht-20261028/source-drive-verification.json'])assert.throws(()=>verifyChoiceRelease(f=>f===path?Buffer.from('{}'):readFileSync(f)));
});
