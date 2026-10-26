import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyPracticeAvailabilityRelease} from './check-practice-availability-release.mjs';
test('Practice release binds owner approval, exact scope, preservation and verified backup',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-practice-availability-20261026.json'));verifyPracticeAvailabilityRelease(release);
 for(const change of [r=>r.publicationApproved=false,r=>r.userRequest='other',r=>r.newLessons=1,r=>r.newAudio=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['lib/practice-chapters.ts']]){const bad=structuredClone(release);change(bad);assert.throws(()=>verifyPracticeAvailabilityRelease(bad));}
 for(const file of ['lib/practice-chapters.ts','docs/klink-practice-availability-20261026/source-drive-verification.json'])assert.throws(()=>verifyPracticeAvailabilityRelease(release,path=>path===file?Buffer.from('{}'):readFileSync(path)));
});
