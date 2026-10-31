import {verifyReviewEmptyRelease} from '../../scripts/check-review-empty-release-20261031.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const owner='docs/klink-owner-release-review-empty-20261031.json',backup='docs/review-empty-20261031/backup.json',component='components/product/learner-app.tsx';
verifyReviewEmptyRelease();
const cases=[
 ['approval',owner,r=>({...r,publicationApproved:false})],
 ['baseline',owner,r=>({...r,baselineSourceCommit:'0'.repeat(40)})],
 ['scope',owner,r=>({...r,changedFiles:[...r.changedFiles,'lib/learning-review.ts']})],
 ['backup',backup,r=>({...r,verified:false})],
 ['hash',owner,r=>({...r,files:{...r.files,[component]:'0'.repeat(64)}})],
];
for(const [name,file,change] of cases){
 const replacement = Buffer.from(JSON.stringify(change(JSON.parse(readFileSync(file)))));
 assert.throws(() => verifyReviewEmptyRelease(f => f === file ? replacement : readFileSync(f)), undefined, name);
}
assert.throws(()=>verifyReviewEmptyRelease(f=>f===component?Buffer.concat([readFileSync(f),Buffer.from('\n')]):readFileSync(f)));
writeFileSync('docs/review-empty-20261031/guard-results.json',JSON.stringify({acceptedCurrent:true,rejections:cases.map(([name])=>name).concat('unapproved-source-change'),passed:6},null,2)+'\n');
console.log('PASS current approved scope and six rejection checks');
