import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {verifyOfficialLogoRelease} from './check-official-logo-release-20261101.mjs';
test('official logo release is approved and limited to the exact checked files',()=>assert.equal(verifyOfficialLogoRelease().approvedBy,'Nico'));
for(const file of ['public/klink-wordmark.svg','app/layout.tsx'])test('rejects an unreviewed change to '+file,()=>assert.throws(()=>verifyOfficialLogoRelease(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('changed')]):readFileSync(f))));
for(const key of ['publicationApproved'])test('rejects missing '+key,()=>assert.throws(()=>verifyOfficialLogoRelease(f=>{const b=readFileSync(f);if(f!=='docs/klink-owner-release-official-logo-20261101.json')return b;const r=JSON.parse(b);r[key]=false;return Buffer.from(JSON.stringify(r));})));
