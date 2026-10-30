import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {verifyWordImageBetaRelease} from './check-word-image-beta-release.mjs';
const path='docs/klink-owner-release-placeholders-20261030.json',manifest=JSON.parse(readFileSync(path));verifyWordImageBetaRelease();
for(const patch of [{approvedBy:'other'},{publicationApproved:false},{changedFiles:[]},{liveSourceCommit:'0'.repeat(40)},{userRequest:'not approved'}])assert.throws(()=>verifyWordImageBetaRelease(f=>f===path?Buffer.from(JSON.stringify({...manifest,...patch})):readFileSync(f)));
for(const path of ['data/klink-production-index.json','lib/mixed-practice.ts','docs/placeholders-20261030/review.json','docs/placeholders-20261030/backup.json'])assert.throws(()=>verifyWordImageBetaRelease(f=>f===path?Buffer.from('{}'):readFileSync(f)));
console.log('PASS explicit owner scope, live ancestry, immutable assets, level counts, registry and tamper rejection');
