import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyWordListeningRelease} from './check-word-listening-release-20261101.mjs';
const folder='docs/writing-copy-aa-17-20261102/',owner='docs/klink-owner-release-writing-copy-aa-17-20261102.json',checks=[];
const current=verifyWordListeningRelease();assert.equal(current.successor.successor.approvedBy,'Nico');checks.push({name:'Word-audio and HT parent gates validate the exact-copy successor',passed:true});
for(const{file,patch}of[
 {file:owner,patch:{publicationApproved:false}},
 {file:owner,patch:{appearanceUnchanged:false}},
 {file:owner,patch:{newWordModels:1}},
 {file:owner,patch:{handwritingAdded:true}},
 {file:folder+'source-revision.json',patch:{unchanged:false}},
 {file:folder+'backup.json',patch:{fullReadback:false}},
]){
 const original=JSON.parse(readFileSync(file));assert.throws(()=>verifyWordListeningRelease(path=>path===file?Buffer.from(JSON.stringify({...original,...patch})):readFileSync(path)));checks.push({name:file+': rejects '+Object.keys(patch)[0],passed:true});
}
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json'));
for(const file of['public'+manifest.newRows[0].row.url,'public'+manifest.existingAaThreeRowUnchanged.url]){
 assert.throws(()=>verifyWordListeningRelease(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('\nchanged')]):readFileSync(path)));checks.push({name:file+': rejects changed new or existing bank bytes',passed:true});
}
writeFileSync(folder+'local/release-tests.json',JSON.stringify({checks,parentGatePassed:true,negativeProofCases:8},null,2)+'\n');console.log('Passed: parent release chain and8negative owner/source/old-bank/recovery proof cases.');
