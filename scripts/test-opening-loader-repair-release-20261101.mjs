import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOpeningLoaderRepair} from './check-opening-loader-repair-release-20261101.mjs';
void test('compact original loader has motion and preservation evidence',()=>assert.equal(verifyOpeningLoaderRepair().approvedBy,'Nico'));
for(const[file,a,b]of[
 ['components/product/klink-opening-loader.css','158px','300px'],
 ['public/opening-loader-quick-20261101/klink-loader.svg','1.8s','4.6s'],
 ['docs/opening-loader-repair-20261101/local/checks.json','"actualMotion": true','"actualMotion": false'],
 ['docs/opening-loader-repair-20261101/backup.json','"fullReadback": true','"fullReadback": false'],
 ['docs/klink-owner-release-opening-loader-repair-20261101.json','"publicationApproved": true','"publicationApproved": false']
])void test('reject changed repair or missing proof '+file,()=>assert.throws(()=>verifyOpeningLoaderRepair(f=>f===file?Buffer.from(readFileSync(f).toString().replace(a,b)):readFileSync(f))));
