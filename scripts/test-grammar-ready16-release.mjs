import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyGrammarReady16Content} from './check-grammar-ready16-release.mjs';

const contractPath='docs/klink-owner-release-grammar-ready16-20261104.json';
const root='docs/grammar-ready16-20261104/';
const passed=[];
verifyGrammarReady16Content();
function rejects(name,path,change){
  const value=JSON.parse(readFileSync(path));change(value);
  const bytes=Buffer.from(JSON.stringify(value));
  const contract=JSON.parse(readFileSync(contractPath));
  const table=path in contract.files?contract.files:contract.evidenceFiles;
  table[path]=createHash('sha256').update(bytes).digest('hex');
  assert.throws(()=>verifyGrammarReady16Content(file=>file===contractPath?Buffer.from(JSON.stringify(contract)):file===path?bytes:readFileSync(file)),name);
  passed.push(name);
}
rejects('A rehashed approval cannot authorize a different user request',root+'audio-approval.json',v=>{v.quote='approve all images';});
rejects('A rehashed old index cannot replace existing content','data/klink-production-index.json',v=>{v[0].count+=1;});
rejects('A rehashed source cannot change the selected answer',root+'selected-source.json',v=>{v.find(x=>x.choices?.length)?.choices.forEach(x=>{x.correct=!x.correct;});});
rejects('A rehashed registry cannot conceal corrupt media','data/klink-grammar-aa-assets.json',v=>{const k=Object.keys(v).find(x=>x.endsWith('.mp3'));v[k].body=Buffer.from('invalid audio').toString('base64');});
rejects('A rehashed preservation report cannot waive old media preservation',root+'preservation.json',v=>{v.allOldPublicBytesEqual=false;});
writeFileSync(root+'gate-negative-tests.json',JSON.stringify({passed,negativeCases:passed.length,baselineContentPassed:true},null,2)+'\n');
console.log(`${passed.length} negative release cases passed`);
