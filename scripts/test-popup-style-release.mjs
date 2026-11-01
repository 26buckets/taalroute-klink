import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{verifyPopupStyleRelease}from'./check-popup-style-release.mjs';
void test('Phone style correction retains exact scope, user request, existing live basis and verified backup',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-popup-style-20261026.json'));verifyPopupStyleRelease(release);
 for(const change of [r=>r.publicationApproved=false,r=>r.userRequest='',r=>r.priorPublicationRequest='',r=>r.newAudio=1,r=>r.newLessons=1,r=>r.newImages=1,r=>r.liveSourceCommit='0'.repeat(40),r=>delete r.files['public/practice-explanations/style.css']]){const bad=structuredClone(release);change(bad);assert.throws(()=>verifyPopupStyleRelease(bad));}
 for(const changed of ['public/practice-explanations/style.css','components/product/practice-line.tsx','docs/klink-owner-release-demo-hand-20261026.json','docs/klink-popup-style-20261026/review.json','docs/klink-popup-style-20261026/source-drive-verification.json'])assert.throws(()=>verifyPopupStyleRelease(release,file=>file===changed?Buffer.from('{}'):readFileSync(file)));
});
