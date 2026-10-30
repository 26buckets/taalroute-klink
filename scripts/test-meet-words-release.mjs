import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyMeetWordsRelease} from './check-meet-words-release.mjs';
const release=verifyMeetWordsRelease();
for(const path of ['data/klink-production-index.json','app/learner-layout.css',release.changedFiles.find(p=>p.startsWith('public/practice-content/'))]){
 assert.throws(()=>verifyMeetWordsRelease(file=>file===path?Buffer.from('tampered'):readFileSync(file)));
}
assert.throws(()=>verifyMeetWordsRelease(file=>file.endsWith('/backup.json')?Buffer.from('{"verified":false}'):readFileSync(file)));
console.log('PASS exact scope, preserved baseline, media source and tamper rejection');
