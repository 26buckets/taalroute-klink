import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyMobileDictationFitRelease}from'./check-mobile-dictation-fit-release-20261101.mjs';
void test('complete mobile task is checked with original content, audio and progress',()=>assert.equal(verifyMobileDictationFitRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['app/learner-layout.css',s=>s+'\n.cp-text-entry{display:none}'],
 ['docs/klink-owner-release-mobile-dictation-fit-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/mobile-dictation-fit-20261101/checks.json',s=>s.replace('"allControlsFullyVisible": true','"allControlsFullyVisible": false')],
 ['docs/mobile-dictation-fit-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifyMobileDictationFitRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
