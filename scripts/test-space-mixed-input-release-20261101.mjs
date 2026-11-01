import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifySpaceMixedInputRelease} from './check-space-mixed-input-release-20261101.mjs';
test('approved minimal focus repair and complete mixed-input evidence pass',()=>assert.equal(verifySpaceMixedInputRelease().approvedBy,'Nico'));
for(const file of ['hooks/use-practice-keyboard.ts','components/product/package-exercise-browser.tsx','docs/space-mixed-input-20261101/local/mixed.json','docs/space-mixed-input-20261101/local/audio.json']) {
  test('reject altered source or proof: '+file,()=>assert.throws(()=>verifySpaceMixedInputRelease(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from(' ')]):readFileSync(f))));
}
for(const [file,key] of [['docs/klink-owner-release-space-mixed-input-20261101.json','publicationApproved'],['docs/space-mixed-input-20261101/backup.json','fullReadback']]) {
  test('reject missing '+key,()=>assert.throws(()=>verifySpaceMixedInputRelease(f=>{
    const bytes=readFileSync(f);return f===file?Buffer.from(JSON.stringify({...JSON.parse(bytes),[key]:false})):bytes;
  })));
}
