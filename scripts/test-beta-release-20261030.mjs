import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyBetaRelease} from './check-beta-release-20261030.mjs';
const path='docs/klink-owner-release-beta-20261030.json',manifest=JSON.parse(readFileSync(path));
verifyBetaRelease();
for(const patch of [{approvedBy:'other'},{publicationApproved:false},{changedFiles:[]},{liveSourceCommit:'0'.repeat(40)}])assert.throws(()=>verifyBetaRelease(f=>f===path?Buffer.from(JSON.stringify({...manifest,...patch})):readFileSync(f)));
for(const path of ['data/klink-production-index.json','components/product/package-exercise-browser.tsx','docs/beta-publication-20261030/review.json','docs/beta-publication-20261030/backup.json'])assert.throws(()=>verifyBetaRelease(f=>f===path?Buffer.from('{}'):readFileSync(f)));
console.log('PASS explicit release scope, latest live ancestry, preservation and tamper rejection');
