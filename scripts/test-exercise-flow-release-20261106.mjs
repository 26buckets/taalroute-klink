import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyExerciseFlowContent } from './check-exercise-flow-release-20261106.mjs';
const r=verifyExerciseFlowContent(); let rejected=0;
for (const file of ['app/exercise-flow.css','components/product/package-exercise-browser.tsx','components/product/practice-action.tsx','docs/exercise-flow-20261106/publication/verification.json']) {
 assert.throws(()=>verifyExerciseFlowContent(p=>p===file?Buffer.concat([readFileSync(p),Buffer.from('changed')]):readFileSync(p)));rejected++;
}
assert.equal(r.designChangeApproved,true);console.log('PASS: approved layout scope and',rejected,'source/evidence mutations rejected.');
