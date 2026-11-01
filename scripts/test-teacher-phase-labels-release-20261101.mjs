import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTeacherPhaseLabelsRelease} from './check-teacher-phase-labels-release-20261101.mjs';
void test('approved phase titles preserve all content, controls and saved work',()=>assert.equal(verifyTeacherPhaseLabelsRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['lib/teacher-classroom.ts',s=>s+'\n// unrelated change'],
 ['docs/klink-owner-release-teacher-phase-labels-20261101.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
 ['docs/teacher-phase-labels-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifyTeacherPhaseLabelsRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
