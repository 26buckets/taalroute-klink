import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyListenPlayfieldLeftRelease} from './check-listen-playfield-left-release-20261031.mjs';
test('approved playfield position retains original handlers, contents and progress',()=>assert.equal(verifyListenPlayfieldLeftRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['docs/klink-owner-release-listen-playfield-left-20261031.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['app/learner-layout.css',s=>s+'\n/* Unapproved change */'],
 ['docs/listen-playfield-left-20261031/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])test('rejects changed '+file,()=>assert.throws(()=>verifyListenPlayfieldLeftRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
