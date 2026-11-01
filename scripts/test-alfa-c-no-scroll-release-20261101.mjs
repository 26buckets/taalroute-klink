import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {verifyAlfaCNoScrollRelease} from './check-alfa-c-no-scroll-release-20261101.mjs';
void test('approved full-height Alfa C panels keep all content reachable',()=>assert.equal(verifyAlfaCNoScrollRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['components/product/alfa-c-workspace.css',s=>s+'\n.ac-document-line{font-size:10px}'],
 ['components/product/panel-pages.ts',s=>s.replace('return starts','return [0]')],
 ['docs/klink-owner-release-alfa-c-no-scroll-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/alfa-c-no-scroll-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifyAlfaCNoScrollRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
