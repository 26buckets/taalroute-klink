import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyPhotoChoiceFitRelease}from'./check-photo-choice-fit-release-20261101.mjs';
test('approved photo choices fit with original media and progress',()=>assert.equal(verifyPhotoChoiceFitRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['app/learner-layout.css',s=>s+'\n.cp-choice-grid img{display:none}'],
 ['docs/klink-owner-release-photo-choice-fit-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/photo-choice-fit-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])test('rejects altered '+file,()=>assert.throws(()=>verifyPhotoChoiceFitRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
