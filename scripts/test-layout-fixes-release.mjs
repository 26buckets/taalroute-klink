import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyLayoutFixesRelease} from './check-layout-fixes-release.mjs';
const path='docs/klink-owner-release-layout-fixes-20261029.json';const r=JSON.parse(readFileSync(path));
verifyLayoutFixesRelease();
for(const patch of [{approvedBy:'other'},{publicationApproved:false},{baselineSourceCommit:'0'.repeat(40)},{changedFiles:[]}])assert.throws(()=>verifyLayoutFixesRelease(f=>f===path?Buffer.from(JSON.stringify({...r,...patch})):readFileSync(f)));
for(const target of ['app/learner-ui.css','components/product/alfa-c-docent.tsx','docs/layout-fixes-20261029/review.json','docs/layout-fixes-20261029/backup.json'])assert.throws(()=>verifyLayoutFixesRelease(f=>f===target?Buffer.from('{}'):readFileSync(f)));
console.log('PASS exact display scope, authorization, lineage, source hashes and verified backup');
