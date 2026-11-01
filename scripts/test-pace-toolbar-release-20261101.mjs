import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyPaceToolbarRelease}from'./check-pace-toolbar-release-20261101.mjs';
void test('approved spacing keeps original listeners, pace handlers and data',()=>assert.equal(verifyPaceToolbarRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['app/learner-layout.css',s=>s+'\n.cp-pace-controls{gap:0}'],
 ['components/product/package-exercise-browser.tsx',s=>s.replace('setPaceSeconds(seconds)','setPaceSeconds(0)')],
 ['docs/klink-owner-release-pace-toolbar-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/pace-toolbar-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifyPaceToolbarRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
