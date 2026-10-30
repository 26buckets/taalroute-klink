import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTwelveCategoriesRelease} from './check-twelve-categories-release.mjs';
const path='docs/klink-owner-release-twelve-categories-20261030.json',r=JSON.parse(readFileSync(path));
verifyTwelveCategoriesRelease();
for(const patch of [{approvedBy:'other'},{publicationApproved:false},{changedFiles:[]},{liveSourceCommit:'0'.repeat(40)},{userRequest:'not approved'}])assert.throws(()=>verifyTwelveCategoriesRelease(f=>f===path?Buffer.from(JSON.stringify({...r,...patch})):readFileSync(f)));
for(const path of ['components/product/practice-chapters.tsx','lib/alfa-c-navigation.ts','docs/twelve-categories-20261030/review.json','docs/twelve-categories-20261030/backup.json'])assert.throws(()=>verifyTwelveCategoriesRelease(f=>f===path?Buffer.from('{}'):readFileSync(f)));
console.log('PASS exact menu-only scope, owner authorization, live ancestry, preservation, review and backup tamper rejection');
