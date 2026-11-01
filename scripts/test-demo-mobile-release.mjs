import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDemoMobileRelease} from './check-demo-mobile-release.mjs';
void test('Combined mobile demonstration release requires approved scope, preserved live basis and verified backup',()=>{
  const release=JSON.parse(readFileSync('docs/klink-owner-release-demo-mobile-20261026.json'));verifyDemoMobileRelease(release);
  for(const change of [r=>r.publicationApproved=false,r=>r.userRequest='',r=>r.newAudio=1,r=>r.newLessons=1,r=>r.extraControls=true,r=>r.liveSourceCommit='0'.repeat(40),r=>delete r.files['app/learner-ui.css']]){
    const bad=structuredClone(release);change(bad);assert.throws(()=>verifyDemoMobileRelease(bad));
  }
  for(const file of ['app/learner-ui.css','components/product/package-exercise-browser.tsx','docs/klink-demo-mobile-20261026/review.json','docs/klink-demo-mobile-20261026/source-drive-verification.json'])assert.throws(()=>verifyDemoMobileRelease(release,p=>p===file?Buffer.from('{}'):readFileSync(p)));
});
