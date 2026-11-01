import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
import{verifySentenceListenRepairRelease}from'./check-sentence-listen-repair-release-20261101.mjs';
void test('approved autoplay repair preserves the latest live content, audio and progress',()=>assert.equal(verifySentenceListenRepairRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['components/product/package-exercise-browser.tsx',s=>s+'\n// unapproved change'],
 ['app/learner-layout.css',s=>s+'\n/* unapproved style */'],
 ['docs/klink-owner-release-sentence-listen-repair-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/sentence-listen-repair-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifySentenceListenRepairRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
