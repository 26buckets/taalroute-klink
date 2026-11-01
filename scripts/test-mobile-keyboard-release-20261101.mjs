import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{verifyMobileKeyboardRelease}from'./check-mobile-keyboard-release-20261101.mjs';
void test('keyboard viewport and smaller controls retain original handlers and data',()=>assert.equal(verifyMobileKeyboardRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['app/learner-layout.css',s=>s+'\n.cp-text-entry{display:none}'],
 ['components/product/package-exercise-browser.tsx',s=>s.replace("viewport?.addEventListener('resize', resize)","viewport?.addEventListener('scroll', resize)")],
 ['docs/klink-owner-release-mobile-keyboard-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/mobile-keyboard-20261101/keyboard-checks.json',s=>s.replace('"allControlsReachable": true','"allControlsReachable": false')],
 ['docs/mobile-keyboard-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])void test('rejects altered '+file,()=>assert.throws(()=>verifyMobileKeyboardRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
