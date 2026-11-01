import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyIndependentWordUseReview}from'./check-word-use-independent-review-20261101.mjs';
const folder='docs/word-use-independent-review-20261101/';
void test('independent review release requires complete source-bound reviews, audio and verified cloud recovery',()=>{const r=verifyIndependentWordUseReview();assert(r.publicationApproved&&r.appearanceUnchanged);assert.equal(r.changedQuestions,13);assert.equal(r.newRecordings,15);});
void test('reject missing approvals, incomplete independent coverage, unresolved final review, speech or recovery tampering',()=>{
 for(const[file,edit]of[
 ['docs/klink-owner-release-word-use-independent-review-20261101.json',r=>{r.publicationApproved=false;}],
 [folder+'independent-a1.json',r=>{r.rows.pop();}],
 [folder+'final-a2.json',r=>{r.unresolved.push('ambiguous answer');}],
 [folder+'final-b1.json',r=>{r.allChangedQuestionsApproved=false;}],
 [folder+'speech-review.json',r=>{r.reviewCompleted=false;}],
 [folder+'backup.json',r=>{r.fullReadback=false;}],
 [folder+'backup.json',r=>{r.parts[0].verified=false;}]
 ])assert.throws(()=>verifyIndependentWordUseReview(f=>{if(f!==file)return readFileSync(f);const r=JSON.parse(readFileSync(f));edit(r);return Buffer.from(JSON.stringify(r));}),file);
});
