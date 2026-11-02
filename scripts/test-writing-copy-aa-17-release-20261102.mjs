import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyGrammarPublication} from './check-grammar-publication-20261101.mjs';
const folder='docs/writing-copy-aa-17-20261102/',owner='docs/klink-owner-release-writing-copy-aa-17-20261102.json',checks=[];
const current=verifyGrammarPublication();assert(current.twentyWordAudio);checks.push({name:'Grammar, word-audio and HT parent gates validate the exact-copy successor',passed:true});
const tracker='docs/klink-invullen-20261101/implementation-progress.json',tracking=JSON.parse(readFileSync(tracker));assert.doesNotThrow(()=>verifyGrammarPublication(path=>path===tracker?Buffer.from(JSON.stringify({...tracking,updatedAt:'later documentary update'})):readFileSync(path)));checks.push({name:'Current tracking metadata can advance while the original grammar evidence stays exact',passed:true});
for(const{file,patch}of[
 {file:owner,patch:{publicationApproved:false}},
 {file:owner,patch:{appearanceUnchanged:false}},
 {file:owner,patch:{newWordModels:1}},
 {file:owner,patch:{handwritingAdded:true}},
 {file:folder+'source-revision.json',patch:{unchanged:false}},
 {file:folder+'backup.json',patch:{fullReadback:false}},
]){
 const original=JSON.parse(readFileSync(file));assert.throws(()=>verifyGrammarPublication(path=>path===file?Buffer.from(JSON.stringify({...original,...patch})):readFileSync(path)));checks.push({name:file+': rejects '+Object.keys(patch)[0],passed:true});
}
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json'));
for(const file of['public'+manifest.newRows[0].row.url,'public'+manifest.existingAaThreeRowUnchanged.url]){
 assert.throws(()=>verifyGrammarPublication(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('\nchanged')]):readFileSync(path)));checks.push({name:file+': rejects changed new or existing bank bytes',passed:true});
}
writeFileSync(folder+'local/release-tests.json',JSON.stringify({checks,parentGatePassed:true,historicalMetadataRegressionPassed:true,negativeProofCases:8},null,2)+'\n');console.log('Passed: full grammar/word-audio/HT parent chain, historical metadata regression and8negative proof cases.');
