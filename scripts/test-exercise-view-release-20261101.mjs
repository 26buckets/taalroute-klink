import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyExerciseViewRelease} from './check-exercise-view-release-20261101.mjs';
test('approved view controls preserve content, original storage and media',()=>assert.equal(verifyExerciseViewRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['components/product/exercise-view.tsx',s=>s+'\n// Unapproved edit'],
 ['docs/klink-owner-release-exercise-view-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/exercise-view-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])test('rejects changed '+file,()=>assert.throws(()=>verifyExerciseViewRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
