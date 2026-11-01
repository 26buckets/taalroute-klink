import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyListenCornerRelease} from './check-listen-corner-release-20261031.mjs';
void test('approved corner placement retains content, audio, storage and full local checks',()=>assert.equal(verifyListenCornerRelease().approvedBy,'Nico'));
for(const [name,file,change]of[
 ['missing appearance consent','docs/klink-owner-release-listen-corner-20261031.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['missing publication consent','docs/klink-owner-release-listen-corner-20261031.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
 ['changed control','components/product/exercise-listen.tsx',s=>s+'\n// Unapproved code\n'],
 ['unverified backup','docs/listen-corner-20261031/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
 ['incomplete mobile review','docs/listen-corner-20261031/review.json',s=>s.replace('"mobileTouch": true','"mobileTouch": false')],
])void test('rejects '+name,()=>assert.throws(()=>verifyListenCornerRelease(f=>f===file?Buffer.from(change(readFileSync(f).toString())):readFileSync(f))));
