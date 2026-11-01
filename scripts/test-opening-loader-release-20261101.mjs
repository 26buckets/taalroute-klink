import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOpeningLoaderRelease} from './check-opening-loader-release-20261101.mjs';
const owner='docs/klink-owner-release-opening-loader-20261101.json';
void test('exact approved loader, narrow scope and verified recovery backup pass',()=>assert.equal(verifyOpeningLoaderRelease().approvedBy,'Nico'));
for(const file of ['app/page.tsx','components/product/classroom-boundary.tsx','components/product/klink-opening-loader.tsx','public/opening-loader-v4-20261101/klink-loader.svg'])void test('reject changed source '+file,()=>assert.throws(()=>verifyOpeningLoaderRelease(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('\nchanged')]):readFileSync(f))));
for(const[file,change]of[[owner,r=>({...r,publicationApproved:false})],['docs/opening-loader-20261101/backup.json',r=>({...r,fullReadback:false})],['docs/opening-loader-20261101/local/checks.json',r=>({...r,checks:r.checks.map((c,i)=>i?c:{...c,storagePreserved:false})})]])void test('reject invalid evidence '+file,()=>assert.throws(()=>verifyOpeningLoaderRelease(f=>f===file?Buffer.from(JSON.stringify(change(JSON.parse(readFileSync(f))))):readFileSync(f))));
