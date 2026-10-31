import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyStartCompactRelease} from './check-start-compact-release-20261031.mjs';
verifyStartCompactRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-start-compact-20261031.json',v=>({...v,appearanceChangeApproved:false})],
 ['docs/klink-owner-release-start-compact-20261031.json',v=>({...v,publicationApproved:false})],
 ['docs/klink-owner-release-start-compact-20261031.json',v=>({...v,liveSourceCommit:'HEAD'})],
 ['docs/start-compact-20261031/review.json',v=>({...v,progress:false})],
 ['docs/start-compact-20261031/review.json',v=>({...v,otherScreensPreserved:false})],
 ['docs/start-compact-20261031/backup.json',v=>({...v,verified:false})]
])assert.throws(()=>verifyStartCompactRelease(p=>p===file?Buffer.from(JSON.stringify(mutate(JSON.parse(read(p))))):read(p)),file);
for(const file of ['app/learner-layout.css','components/product/learner-app.tsx'])assert.throws(()=>verifyStartCompactRelease(p=>p===file?Buffer.from('unapproved change'):read(p)),file);
console.log('PASS 8 rejected changes: appearance/publication approval, live base, progress, unrelated screens, backup and runtime sources');
