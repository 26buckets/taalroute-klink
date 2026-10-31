import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyWorksheetCleanupRelease} from './check-worksheet-cleanup-release-20261031.mjs';
test('bounded worksheet cleanup retains all 58 lessons, answers and verified backup',()=>assert.equal(verifyWorksheetCleanupRelease().observationAppCreated,false));
for(const [name,file,edit]of[
 ['unapproved board design','components/product/teacher-classroom.css',s=>s+'\n.kpd-big-word{color:red}\n'],
 ['changed answers','components/product/teacher-classroom.tsx',s=>s.replace('Antwoorden voor de docent','Antwoorden gewijzigd')],
 ['missing backup','docs/worksheet-cleanup-20261031/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
 ['unapproved scope','docs/klink-owner-release-worksheet-cleanup-20261031.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
])test('rejects '+name,()=>assert.throws(()=>verifyWorksheetCleanupRelease(f=>{const b=readFileSync(f);return f===file?Buffer.from(edit(b.toString())):b;})));
