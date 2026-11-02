import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { verifyWordListeningRelease } from './check-word-listening-release-20261101.mjs';

const folder='docs/writing-dictation-20261101/';
const owner='docs/klink-owner-release-writing-dictation-20261101.json';
const checks=[];
const current=verifyWordListeningRelease();
assert.equal(current.successor.approvedBy,'Nico');
checks.push({name:'parent word-audio gate validates writing successor and its unchanged historical release',passed:true});
for(const{file,patch}of[
 {file:owner,patch:{publicationApproved:false}},
 {file:owner,patch:{appearanceUnchanged:false}},
 {file:folder+'local/browser.json',patch:{checks:[]}},
 {file:folder+'local/help-audio.json',patch:{checks:[]}},
 {file:folder+'backup.json',patch:{verified:false}},
 {file:'docs/klink-invullen-20261101/automatic-owner-approval.json',patch:{mayInventHumanReviewEvidence:true}},
]){
 const original=JSON.parse(readFileSync(file));
 assert.throws(()=>verifyWordListeningRelease(path=>path===file?Buffer.from(JSON.stringify({...original,...patch})):readFileSync(path)));
 checks.push({name:file+': rejects '+Object.keys(patch)[0],passed:true});
}
for(const file of ['lib/writing-dictation.ts','public/package-audio/word-listening-20261101/repair-ei.wav']){
 assert.throws(()=>verifyWordListeningRelease(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('\nchanged')]):readFileSync(path)));
 checks.push({name:file+': rejects modified own or upstream audio/code bytes',passed:true});
}
writeFileSync(folder+'local/release-tests.json',JSON.stringify({checks,parentGatePassed:true,negativeProofCases:8},null,2)+'\n');
console.log('Passed: parent release gate and eight negative source, audio, owner-policy and recovery-proof cases.');
