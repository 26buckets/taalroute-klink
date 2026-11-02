import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyGrammarPublication} from './check-grammar-publication-20261101.mjs';
const owner='docs/klink-owner-release-ten-bingo-20261102.json',root='docs/klink10-bingo-20261102/',checks=[];
assert(verifyGrammarPublication().twentyWordAudio);checks.push('Full historical release chain');
for(const[file,patch]of[[owner,{publicationApproved:false}],[owner,{existingAppearancePreserved:false}],[owner,{progressPreserved:false}],[root+'backup.json',{fullReadback:false}],[root+'verification.json',{wordAudioCoverage:false}]]){
 const value=JSON.parse(readFileSync(file));assert.throws(()=>verifyGrammarPublication(p=>p===file?Buffer.from(JSON.stringify({...value,...patch})):readFileSync(p)));checks.push('Rejects '+Object.keys(patch)[0]);
}
const m=JSON.parse(readFileSync(root+'manifest.json')),asset='public'+m.rows[0].row.url;assert.throws(()=>verifyGrammarPublication(p=>p===asset?Buffer.concat([readFileSync(p),Buffer.from(' ')]):readFileSync(p)));checks.push('Rejects changed bank bytes');
writeFileSync(root+'local/release-tests.json',JSON.stringify({checks,negativeProofCases:6,parentGatePassed:true},null,2)+'\n');console.log('PASS full historical release chain and six negative proof cases.');
