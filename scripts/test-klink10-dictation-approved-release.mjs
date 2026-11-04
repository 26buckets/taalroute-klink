import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyGrammarPublication} from './check-grammar-publication-20261101.mjs';
import {verifyDictationApprovedRelease} from './check-klink10-dictation-approved-release.mjs';
const owner='docs/klink-owner-release-ten-dictation-approved-20261102.json',root='docs/klink10-dictation-aa-20261102/',checks=[];
assert(verifyGrammarPublication().twentyWordAudio);checks.push('Full historical release chain');
for(const[file,patch]of[[owner,{publicationApproved:false}],[owner,{existingAppearancePreserved:false}],[owner,{progressPreserved:false}],[root+'backup.json',{fullReadback:false}],[root+'validation.json',{sourceReview:false}],[root+'nico-drie-opnamen-goedkeuring.json',{userAnswer:'pending'}]]){
 const value=JSON.parse(readFileSync(file));assert.throws(()=>verifyDictationApprovedRelease(p=>p===file?Buffer.from(JSON.stringify({...value,...patch})):readFileSync(p)));checks.push('Rejects '+Object.keys(patch)[0]);
}
const asset='data/klink10-writing-dictation-aa-20261102.json';assert.throws(()=>verifyDictationApprovedRelease(p=>p===asset?Buffer.concat([readFileSync(p),Buffer.from(' ')]):readFileSync(p)));checks.push('Rejects changed bank bytes');
writeFileSync(root+'local/release-tests.json',JSON.stringify({checks,negativeProofCases:7,parentGatePassed:true},null,2)+'\n');console.log('PASS historical release chain and seven negative proof cases.');
