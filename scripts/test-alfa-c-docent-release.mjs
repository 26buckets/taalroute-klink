import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTeacherRelease} from './check-alfa-c-docent-release.mjs';
const manifest='docs/klink-owner-release-alfa-c-docent-20261029.json';
test('teacher release proves 27 IDs and retained live ancestry',()=>assert.equal(verifyTeacherRelease().publicationApproved,true));
for(const field of ['publicationApproved','baselineSourceCommit','userAnswer'])test('reject invalid '+field,()=>assert.throws(()=>verifyTeacherRelease(file=>file===manifest?JSON.stringify({...JSON.parse(readFileSync(file)),[field]:false}):readFileSync(file))));
for(const target of ['lib/alfa-c-docent.ts','data/klink-alfa-c-docent.json','components/product/alfa-c-docent.tsx'])test('reject changed '+target,()=>assert.throws(()=>verifyTeacherRelease(file=>file===target?Buffer.from('changed'):readFileSync(file))));
