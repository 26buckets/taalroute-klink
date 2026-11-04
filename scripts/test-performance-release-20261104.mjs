import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyPerformanceContent,verifyPerformanceRelease} from './check-performance-release-20261104.mjs';
const root='docs/performance-publication-20261104/';
const alter=(file,change)=>p=>p===file?Buffer.from(JSON.stringify(change(JSON.parse(readFileSync(p))))):readFileSync(p);
verifyPerformanceContent();
for(const change of [r=>({...r,publicationApproved:false}),r=>({...r,approvedBy:'unknown'}),r=>({...r,userRequest:'Publish everything'}),r=>({...r,liveSourceCommit:'0'.repeat(40)}),r=>({...r,files:{...r.files,'lib/word-listening.ts':'0'.repeat(64)}})]) {
  assert.throws(()=>verifyPerformanceContent(alter(root+'approval.json',change)));
}
for(const file of ['components/product/classroom-boundary.tsx','components/product/klink-opening-loader.tsx','components/product/practice-workspace.tsx','lib/word-listening.ts',root+'local/regression/checks.json',root+'local/appearance/comparison.json']) {
  assert.throws(()=>verifyPerformanceContent(p=>p===file?Buffer.concat([readFileSync(p),Buffer.from('changed')]):readFileSync(p)));
}
assert.throws(()=>verifyPerformanceRelease(alter(root+'backup.json',r=>({...r,fullReadback:false}))));
verifyPerformanceRelease();
console.log('PASS current release and 12 rejected permission, source, test and backup mutations');
