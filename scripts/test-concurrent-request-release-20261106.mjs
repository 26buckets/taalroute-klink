import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyConcurrentRequestRelease} from './check-concurrent-request-release-20261106.mjs';
const folder='docs/concurrent-request-repair-20261106/publication/';
const r=verifyConcurrentRequestRelease();let rejected=0;
for(const p of Object.keys({...r.files,...r.evidenceFiles})){
 assert.throws(()=>verifyConcurrentRequestRelease(f=>f===p?Buffer.concat([readFileSync(f),Buffer.from('changed')]):readFileSync(f)),p);rejected++;
}
for(const key of ['publicationApproved','baselineSourceCommit','checkedCandidateCommit']){
 assert.throws(()=>verifyConcurrentRequestRelease(f=>f===folder+'approval.json'?Buffer.from(JSON.stringify({...r,[key]:false})):readFileSync(f)));rejected++;
}
for(const key of ['fullReadback','zipIntegrity','allPayloadHashesMatch']){
 assert.throws(()=>verifyConcurrentRequestRelease(f=>f===folder+'backup.json'?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(f)),[key]:false})):readFileSync(f)));rejected++;
}
console.log('PASS: timeout repair publication proof;',rejected,'source, evidence, authorization and recovery mutations rejected.');
