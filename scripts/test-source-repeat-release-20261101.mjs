import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{verifySourceRepeatRelease,readBeforeSourceRepeat}from'./check-source-repeat-release-20261101.mjs';
import{instructionBaseline}from'./check-instruction-candidate.mjs';
import{verifyGoalAuditRelease}from'./check-goal-audit-release-20261101.mjs';
test('source-bound repeat publication requires the real progress, browser, media and Drive evidence',()=>assert.equal(verifySourceRepeatRelease().ownerApproval,'standing-owner-approval'));
test('older approved goal files are read before the repeat successor without losing its checks',()=>assert.equal(verifyGoalAuditRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['components/product/source-repeat-round.tsx',s=>s.replace('onAttempt={undefined}','onAttempt={props.onAttempt}')],
 ['data/klink-source-repeat-rounds.json',s=>s.replace('"sourceId":','"wrongSourceId":')],
 ['docs/repeat-rounds-20261101/local/browser-checks.json',s=>s.replace('"originalCompletionIsolated": true','"originalCompletionIsolated": false')],
 ['docs/repeat-rounds-20261101/local/loading-checks.json',s=>s.replace('"retryRecovered": true','"retryRecovered": false')],
 ['docs/repeat-rounds-20261101/local/media-checks.json',s=>s.replace('"sourceAndHostedIdentical": true','"sourceAndHostedIdentical": false')],
 ['docs/repeat-rounds-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
 ['docs/klink-owner-release-source-repeat-20261101.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
])test('repeat release rejects changed '+file,()=>assert.throws(()=>verifySourceRepeatRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));

test('instruction boundary survives a serialized historical release fixture',()=>{const r=JSON.parse(JSON.stringify(verifySourceRepeatRelease()));assert.deepEqual(readBeforeSourceRepeat('data/klink-imported-practice.json',r),instructionBaseline('data/klink-imported-practice.json'));});
