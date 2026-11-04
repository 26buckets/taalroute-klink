import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyLetterAcReady10Content} from './check-letter-ac-ready10-release.mjs';
const root='docs/letter-ac-ready10-20261104/',contract='docs/klink-owner-release-letter-ac-ready10-20261104.json',sha=b=>createHash('sha256').update(b).digest('hex');
verifyLetterAcReady10Content();
const cases=[
 ['false standing approval','docs/klink-invullen-20261101/automatic-owner-approval.json',j=>j.automaticPublicationApproval=false],
 ['old collection mutation','data/klink-production-index.json',j=>j[0].count++],
 ['old media mutation','data/klink-grammar-aa-assets.json',j=>j[Object.keys(j)[0]].bytes++],
 ['source target mutation',root+'current-letter-source-records.json',j=>j['KSW-N26R2-AC-WL-001']['Modelantwoord / antwoordsleutel']='d'],
 ['unproven capacity',root+'capacity.json',j=>j.workerGzipKiB=10240],
 ['invented human review',root+'verification.json',j=>j.humanNT2ReviewPerformed=true],
];
const results=[];
for(const[name,path,mutate]of cases){const value=JSON.parse(readFileSync(path));mutate(value);const bytes=Buffer.from(JSON.stringify(value)),r=JSON.parse(readFileSync(contract));if(path in r.files)r.files[path]=sha(bytes);if(path in r.evidenceFiles)r.evidenceFiles[path]=sha(bytes);const read=p=>p===path?bytes:p===contract?Buffer.from(JSON.stringify(r)):readFileSync(p);assert.throws(()=>verifyLetterAcReady10Content(read),name);results.push({name,rehashedMutationRejected:true});}
writeFileSync(root+'gate-negative-tests.json',JSON.stringify({validContentPassed:true,cases:results},null,2)+'\n');
console.log('Valid letter release and six rehashed negative mutations checked.');
