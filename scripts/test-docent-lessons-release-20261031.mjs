import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDocentLessonsRelease} from './check-docent-lessons-release-20261031.mjs';
verifyDocentLessonsRelease();
for(const [file,mutate]of [
 ['docs/klink-owner-release-docent-lessons-20261031.json',o=>({...o,publicationApproved:false})],
 ['docs/klink-owner-release-docent-lessons-20261031.json',o=>({...o,baselineSourceCommit:'HEAD'})],
 ['docs/docent-lessen-release-20261031/backup.json',o=>({...o,verified:false})],
 ['docs/docent-lessen-release-20261031/review.json',o=>({...o,contentPreserved:false})],
 ['data/klink-docent-lessons.json',o=>o.slice(1)],
])assert.throws(()=>verifyDocentLessonsRelease(f=>f===file?Buffer.from(JSON.stringify(mutate(JSON.parse(readFileSync(f))))):readFileSync(f)),file);
assert.throws(()=>verifyDocentLessonsRelease(f=>f==='components/product/teacher-classroom.tsx'?Buffer.from('broken'):readFileSync(f)));
console.log('PASS scoped teacher release and six rejection checks');
