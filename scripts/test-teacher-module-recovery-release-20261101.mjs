import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTeacherModuleRecoveryRelease} from './check-teacher-module-recovery-release-20261101.mjs';
void test('approved bounded teacher recovery preserves appearance, lessons and progress',()=>assert.equal(verifyTeacherModuleRecoveryRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['components/product/classroom-boundary.tsx',s=>s+'\n// unapproved change'],
 ['components/product/teacher-module-recovery.ts',s=>s.replace("setItem(recoveryKey, '1')","clear()")],
 ['docs/klink-owner-release-teacher-module-recovery-20261101.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
 ['docs/teacher-module-recovery-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifyTeacherModuleRecoveryRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
