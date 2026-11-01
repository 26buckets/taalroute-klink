import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOpeningLoaderDuration} from './check-opening-loader-duration-release-20261101.mjs';
void test('two-second opening has owner approval and preservation evidence',()=>assert.equal(verifyOpeningLoaderDuration().approvedBy,'Nico'));
for(const[file,a,b]of[
 ['components/product/klink-opening-loader.tsx','2000','200'],
 ['components/product/classroom-boundary.tsx','!workspaceLoaded','false'],
 ['docs/opening-loader-duration-20261101/local/checks.json','"minimumDuration": true','"minimumDuration": false'],
 ['docs/opening-loader-duration-20261101/backup.json','"fullReadback": true','"fullReadback": false'],
 ['docs/klink-owner-release-opening-loader-duration-20261101.json','"publicationApproved": true','"publicationApproved": false']
])void test('reject changed duration or missing proof '+file,()=>assert.throws(()=>verifyOpeningLoaderDuration(f=>f===file?Buffer.from(readFileSync(f).toString().replace(a,b)):readFileSync(f))));
