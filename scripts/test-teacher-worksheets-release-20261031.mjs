import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyTeacherWorksheetsRelease} from './check-teacher-worksheets-release-20261031.mjs';
verifyTeacherWorksheetsRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-worksheets-20261031.json',v=>({...v,appearanceChangeApproved:false})],
 ['docs/klink-owner-release-worksheets-20261031.json',v=>({...v,publicationApproved:false})],
 ['docs/klink-owner-release-worksheets-20261031.json',v=>({...v,liveSourceCommit:'HEAD'})],
 ['docs/werkbladen-publicatie-20261031/review.json',v=>({...v,returnPosition:false})],
 ['docs/werkbladen-publicatie-20261031/review.json',v=>({...v,learnerPreserved:false})],
 ['docs/werkbladen-publicatie-20261031/backup.json',v=>({...v,verified:false})]
])assert.throws(()=>verifyTeacherWorksheetsRelease(p=>p===file?Buffer.from(JSON.stringify(mutate(JSON.parse(read(p))))):read(p)),file);
for(const file of ['data/klink-docent-worksheets.json','public/docent-werkbladen/kpd08/mat-woord.pdf','components/product/classroom-boundary.tsx'])assert.throws(()=>verifyTeacherWorksheetsRelease(p=>p===file?Buffer.from('unapproved change'):read(p)),file);
console.log('PASS 9 rejected changes: approvals, live base, return position, learner preservation, backup, answers, PDF and navigation');
