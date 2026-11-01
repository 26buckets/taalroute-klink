import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyDialogueMobilePhotoRelease}from'./check-dialogue-mobile-photo-release-20261101.mjs';
test('only approved mobile photo overrides preserve the latest app and original recordings',()=>assert.equal(verifyDialogueMobilePhotoRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['app/learner-layout.css',s=>s+'\n/* unapproved */'],
 ['docs/klink-owner-release-dialogue-mobile-photo-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/dialogue-mobile-photo-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])test('rejects changed '+file,()=>assert.throws(()=>verifyDialogueMobilePhotoRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
