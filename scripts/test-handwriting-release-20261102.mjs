import assert from'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{verifyGrammarPublication}from'./check-grammar-publication-20261101.mjs';
const folder='docs/handwriting-20261102/',owner='docs/klink-owner-release-handwriting-20261102.json',checks=[];
assert(verifyGrammarPublication().twentyWordAudio);checks.push({name:'The complete grammar/word-audio/HT/AA chain accepts the source-bound handwriting successor',passed:true});
const trackers=new Set(['docs/klink-invullen-20261101/implementation-progress.json','docs/klink-invullen-20261101/writing-source-register.json','docs/ordered-publication-20261101/register-backup.json','docs/ordered-publication-20261101/register-files-readback.json']);
assert.doesNotThrow(()=>verifyGrammarPublication(path=>trackers.has(path)?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(path)),updatedAt:'later documentary update'})):readFileSync(path)));checks.push({name:'All four tracking documents can advance without changing historical approvals',passed:true});
for(const{file,patch}of[
 {file:owner,patch:{publicationApproved:false}},{file:owner,patch:{existingAppearancePreserved:false}},{file:owner,patch:{progressPreserved:false}},{file:owner,patch:{automaticHandwritingScoring:true}},{file:owner,patch:{newRecordings:9}},{file:owner,patch:{humanListeningPerformed:true}},
 {file:folder+'backup.json',patch:{verified:false}},{file:folder+'backup.json',patch:{fullReadback:false}},{file:folder+'backup.json',patch:{zipIntegrity:false}},
]){
 const original=JSON.parse(readFileSync(file));assert.throws(()=>verifyGrammarPublication(path=>path===file?Buffer.from(JSON.stringify({...original,...patch})):readFileSync(path)));checks.push({name:file+': rejects '+Object.keys(patch)[0],passed:true});
}
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json')),old=JSON.parse(readFileSync('docs/writing-copy-aa-17-20261102/import-manifest.json'));
for(const file of['public'+manifest.newRows[0].row.url,'public'+old.existingAaThreeRowUnchanged.url,folder+'source-records.jsonl']){
 assert.throws(()=>verifyGrammarPublication(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('\nchanged')]):readFileSync(path)));checks.push({name:file+': rejects modified source or current/previous bank bytes',passed:true});
}
writeFileSync(folder+'local/release-tests.json',JSON.stringify({checks,parentGatePassed:true,currentTrackingMetadataMayAdvance:true,negativeProofCases:12},null,2)+'\n');console.log('Passed full historical publication chain,mutable-tracking regression and12 negative handwriting proof cases.');
