import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyReviewStyleRelease} from './check-review-style-release-20261031.mjs';
verifyReviewStyleRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-review-style-20261031.json',v=>({...v,appearanceChangeApproved:false})],
 ['docs/klink-owner-release-review-style-20261031.json',v=>({...v,publicationApproved:false})],
 ['docs/klink-owner-release-review-style-20261031.json',v=>({...v,liveSourceCommit:'HEAD'})],
 ['docs/review-style-20261031/review.json',v=>({...v,progress:false})],
 ['docs/review-style-20261031/review.json',v=>({...v,audio:false})],
 ['docs/review-style-20261031/backup.json',v=>({...v,verified:false})]
])assert.throws(()=>verifyReviewStyleRelease(p=>p===file?Buffer.from(JSON.stringify(mutate(JSON.parse(read(p))))):read(p)),file);
for(const file of ['app/learner-layout.css','components/product/learner-app.tsx'])assert.throws(()=>verifyReviewStyleRelease(p=>p===file?Buffer.from('unapproved change'):read(p)),file);
console.log('PASS 8 rejected changes: visual/publication approval, live base, progress, audio, backup and runtime sources');
