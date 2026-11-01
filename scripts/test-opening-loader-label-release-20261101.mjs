import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {verifyOpeningLoaderLabelRelease,readBeforeOpeningLoaderLabel} from './check-opening-loader-label-release-20261101.mjs';
import {verifyReadingRoundTitlesRelease} from './check-reading-round-titles-release-20261101.mjs';
const owner='docs/klink-owner-release-opening-loader-label-20261101.json',folder='docs/opening-loader-label-20261101/';
void test('Visible label is the only runtime change and the previous title release remains verified',()=>{
 const r=verifyOpeningLoaderLabelRelease();assert.equal(r.approvedBy,'Nico');assert.equal(verifyReadingRoundTitlesRelease().approvedBy,'Nico');assert(readBeforeOpeningLoaderLabel('components/product/klink-opening-loader.tsx',r).toString().includes('className="sr-only"'));
});
for(const {file,mutate} of [
 {file:owner,mutate:r=>{r.publicationApproved=false;}},
 {file:owner,mutate:r=>{r.baselineSourceCommit='HEAD';}},
 {file:folder+'local/checks.json',mutate:r=>{r.checks.pop();}},
 {file:folder+'backup.json',mutate:r=>{r.fullReadback=false;}}
])void test('Reject missing permission or proof: '+file,()=>assert.throws(()=>verifyOpeningLoaderLabelRelease(f=>{const bytes=readFileSync(f);if(f!==file)return bytes;const r=JSON.parse(bytes);mutate(r);return Buffer.from(JSON.stringify(r));})));
for(const file of ['components/product/klink-opening-loader.tsx','components/product/klink-opening-loader.css'])void test('Reject unapproved loader change: '+file,()=>assert.throws(()=>verifyOpeningLoaderLabelRelease(f=>f===file?Buffer.from('unexpected change'):readFileSync(f))));
