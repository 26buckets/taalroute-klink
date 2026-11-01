import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyFunctionalRelease } from './check-alfa-c-functioneel-release.mjs';
void test('the 72 task release requires its exact scope, complete media and verified recovery',()=>{
 const release=verifyFunctionalRelease();
 for(const mutate of [r=>r.publicationApproved=false,r=>r.newAudio=1,r=>r.availableTasks=67,r=>r.closedTasks=5,r=>r.humanLearnerTrial=true,r=>r.baselineSourceCommit='0'.repeat(40),r=>r.userRequest='',r=>r.completionRequest='']){
  const bad=structuredClone(release);mutate(bad);assert.throws(()=>verifyFunctionalRelease(undefined,bad));
 }
 for(const path of ['data/klink-alfa-c-functioneel.json','public/alfa-c/antwoordbladen.html','docs/klink-alfa-c-functioneel-20261028/review.json','docs/klink-alfa-c-functioneel-20261028/source-drive-verification.json'])assert.throws(()=>verifyFunctionalRelease(f=>f===path?Buffer.from('{}'):readFileSync(f)));
});
