import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTeacherPackagesRelease} from './check-teacher-packages-release-20261031.mjs';
const file='docs/klink-owner-release-teacher-packages-1-9-20261031.json';
test('nine-package publication is bound to the latest approved source and verified files',()=>assert.equal(verifyTeacherPackagesRelease().approvedBy,'Nico'));
for(const [name,mutate]of Object.entries({wrongOwner:r=>r.approvedBy='other',missingPublication:r=>r.publicationApproved=false,olderLive:r=>r.liveSourceCommit='7b0e0a8862f50b519c70ce6d25acea3f641e8eed',layoutChange:r=>r.appearanceChanged=true,missingFile:r=>r.changedFiles.pop(),wrongHash:r=>r.files[Object.keys(r.files)[0]]='0'.repeat(64)}))test('reject '+name,()=>{
 const r=JSON.parse(readFileSync(file));mutate(r);
 assert.throws(()=>verifyTeacherPackagesRelease(f=>f===file?Buffer.from(JSON.stringify(r)):readFileSync(f)));
});
test('a changed original lesson or worksheet cannot pass the package hashes',()=>{
 const target='data/klink-docent-extra-lessons.json';
 assert.throws(()=>verifyTeacherPackagesRelease(f=>f===target?Buffer.from('[]'):readFileSync(f)));
});
