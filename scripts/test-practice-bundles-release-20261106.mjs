import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyPracticeBundlesContent,verifyPracticeBundlesRelease} from './check-practice-bundles-release-20261106.mjs';
const folder='docs/practice-bundles-20261106/publication/';
const release=verifyPracticeBundlesRelease();let rejected=0;
for(const file of Object.keys({...release.files,...release.evidenceFiles})){
  assert.throws(()=>verifyPracticeBundlesContent(p=>p===file?Buffer.concat([readFileSync(p),Buffer.from('changed')]):readFileSync(p)),file);rejected++;
}
for(const key of ['fullReadback','zipIntegrity','allPayloadHashesMatch']){
  assert.throws(()=>verifyPracticeBundlesRelease(p=>p===folder+'backup.json'?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),[key]:false})):readFileSync(p)));rejected++;
}
for(const key of ['baselineSourceCommit','checkedCandidateCommit']){
  assert.throws(()=>verifyPracticeBundlesContent(p=>p===folder+'approval.json'?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),[key]:'0'.repeat(40)})):readFileSync(p)));rejected++;
}
console.log('PASS: normal publication proof; rejected',rejected,'source, evidence, ancestry and backup mutations.');
