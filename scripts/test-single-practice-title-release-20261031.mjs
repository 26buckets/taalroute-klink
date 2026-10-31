import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifySinglePracticeTitleRelease} from './check-single-practice-title-release-20261031.mjs';
test('only the approved duplicate heading changes',()=>assert.equal(verifySinglePracticeTitleRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['components/product/practice-line.tsx',s=>s+'\n// additional edit'],
 ['docs/klink-owner-release-single-practice-title-20261031.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/single-practice-title-20261031/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])test('rejects changed '+file,()=>assert.throws(()=>verifySinglePracticeTitleRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
