import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {verifyOpeningLoaderLosslessRelease,readBeforeOpeningLoaderLossless} from './check-opening-loader-lossless-release-20261101.mjs';
import {verifyB1ReviewedRelease} from './check-b1-reviewed-release-20261101.mjs';
const owner='docs/klink-owner-release-opening-loader-lossless-20261101.json',folder='docs/opening-loader-lossless-20261101/';
void test('Only approved lossless asset changes and preceding B1 release stays verified',()=>{const r=verifyOpeningLoaderLosslessRelease();assert.equal(verifyB1ReviewedRelease().approvedBy,'Nico');assert.equal(readBeforeOpeningLoaderLossless('public/opening-loader-quick-20261101/klink-loader.svg',r).length,90670);});
for(const {file,mutate}of[
 {file:owner,mutate:r=>{r.publicationApproved=false;}},
 {file:owner,mutate:r=>{r.baselineSourceCommit='HEAD';}},
 {file:folder+'local/equivalence.json',mutate:r=>{r.browserFrames.pop();}},
 {file:folder+'backup.json',mutate:r=>{r.fullReadback=false;}}
])void test('Reject missing approval or proof: '+file,()=>assert.throws(()=>verifyOpeningLoaderLosslessRelease(f=>{const bytes=readFileSync(f);if(f!==file)return bytes;const r=JSON.parse(bytes);mutate(r);return Buffer.from(JSON.stringify(r));})));
for(const file of ['public/opening-loader-quick-20261101/klink-loader.svg','components/product/klink-opening-loader.tsx','components/product/klink-opening-loader.css'])void test('Reject unapproved asset, timing or placement: '+file,()=>assert.throws(()=>verifyOpeningLoaderLosslessRelease(f=>f===file?Buffer.from('unexpected change'):readFileSync(f))));
