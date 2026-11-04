import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { verifySpellingReviewRelease } from './check-klink10-spelling-review-release-20261102.mjs';
const dir='docs/klink10-spelling-review-aa-20261102/',owner='docs/klink-owner-release-spelling-review-20261102.json',checks=[];
verifySpellingReviewRelease();checks.push('Exact bounded release accepted');
for(const[file,key]of[[owner,'publicationApproved'],[owner,'progressPreserved'],[owner,'existingAppearancePreserved'],[dir+'backup.json','fullReadback'],[dir+'validation.json','sourceReview']]){
 const value=JSON.parse(readFileSync(file));assert.throws(()=>verifySpellingReviewRelease(p=>p===file?Buffer.from(JSON.stringify({...value,[key]:false})):readFileSync(p)));checks.push('Rejects '+key);
}
const file='data/klink10-spelling-review-aa-20261102.json';assert.throws(()=>verifySpellingReviewRelease(p=>p===file?Buffer.concat([readFileSync(p),Buffer.from(' ')]):readFileSync(p)));checks.push('Rejects modified questions');
writeFileSync(dir+'release-tests.json',JSON.stringify({checks,negativeCases:6},null,2)+'\n');
console.log('Bounded release and six negative checks passed.');
