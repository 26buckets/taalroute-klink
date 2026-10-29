import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyRoundProgressRelease} from './check-round-progress-release.mjs';
const path='docs/klink-owner-release-round-progress-20261029.json';const release=JSON.parse(readFileSync(path));
verifyRoundProgressRelease();
for(const patch of [{approvedBy:'other'},{publicationApproved:false},{baselineSourceCommit:'0'.repeat(40)},{changedFiles:[]}])assert.throws(()=>verifyRoundProgressRelease(file=>file===path?Buffer.from(JSON.stringify({...release,...patch})):readFileSync(file)));
for(const target of ['lib/round-progress.ts','app/learner-ui.css','docs/round-progress-20261029/review.json','docs/round-progress-20261029/backup.json'])assert.throws(()=>verifyRoundProgressRelease(file=>file===target?Buffer.from('{}'):readFileSync(file)));
console.log('PASS bounded progress release: owner, lineage, exact scope, code, evidence and backup rejection');
