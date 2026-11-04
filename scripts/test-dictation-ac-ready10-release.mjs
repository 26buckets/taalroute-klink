import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyDictationAcReady10Content,readBeforeDictationAcReady10} from './check-dictation-ac-ready10-release.mjs';
import {readBeforeLetterAcReady10} from './check-letter-ac-ready10-release.mjs';
import {execFileSync} from 'node:child_process';
const root='docs/dictation-ac-ready10-20261104/',contract='docs/klink-owner-release-dictation-ac-ready10-20261104.json',sha=b=>createHash('sha256').update(b).digest('hex');
const release=verifyDictationAcReady10Content();
const cases=[
 ['false standing approval','docs/klink-invullen-20261101/automatic-owner-approval.json',j=>j.automaticPublicationApproval=false],
 ['old collection mutation','data/klink-production-index.json',j=>j[0].count++],
 ['old media mutation','data/klink-grammar-aa-assets.json',j=>j[Object.keys(j)[0]].bytes++],
 ['source model mutation',root+'current-source-records.json',j=>j[0]['KSW-N26R2-AC-TZ-001']['Modelantwoord / antwoordsleutel']='Een andere zin.'],
 ['unproven capacity',root+'capacity.json',j=>j.workerGzipKiB=10240],
 ['invented human review',root+'verification.json',j=>j.humanNT2ReviewPerformed=true],
];
const results=[];
for(const[name,path,mutate]of cases){const value=JSON.parse(readFileSync(path));mutate(value);const bytes=Buffer.from(JSON.stringify(value)),r=JSON.parse(readFileSync(contract));if(path in r.files)r.files[path]=sha(bytes);if(path in r.evidenceFiles)r.evidenceFiles[path]=sha(bytes);const read=p=>p===path?bytes:p===contract?Buffer.from(JSON.stringify(r)):readFileSync(p);assert.throws(()=>verifyDictationAcReady10Content(read),name);results.push({name,rehashedMutationRejected:true});}
const parent={...JSON.parse(readFileSync('docs/klink-owner-release-letter-ac-ready10-20261104.json')),successor:release};
for(const file of ['components/product/package-exercise-browser.tsx','lib/sentence-answer.ts','data/klink-production-instructions.json']){
 const expected=execFileSync('git',['show',release.baselineSourceCommit+':'+file],{maxBuffer:128e6});assert(readBeforeDictationAcReady10(file,release).equals(expected));assert(readBeforeLetterAcReady10(file,parent).equals(expected));
}
writeFileSync(root+'gate-negative-tests.json',JSON.stringify({validContentPassed:true,cases:results,historicalReaderComposesRuntimeAndInstructionDelta:true},null,2)+'\n');
console.log('Valid source-bound release, six rehashed negative mutations and historical reader composition verified.');
