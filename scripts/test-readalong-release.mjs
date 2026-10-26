import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyReadalongRelease} from './check-readalong-release.mjs';
test('Readalong release preserves the requested rounds, prior approval, scoped source and backup',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-readalong-20261026.json'));verifyReadalongRelease(release);
 for(const change of [r=>r.publicationApproved=false,r=>r.userRequest='other',r=>r.firstWithText=false,r=>r.secondWithoutText=false,r=>r.dialogues=127,r=>r.newAudio=1,r=>r.newImages=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['components/product/dialogue-surface.tsx']]){const bad=structuredClone(release);change(bad);assert.throws(()=>verifyReadalongRelease(bad));}
 assert.throws(()=>verifyReadalongRelease(release,file=>file==='components/product/dialogue-surface.tsx'?Buffer.from(readFileSync(file)+'\n// altered'):readFileSync(file)));
 assert.throws(()=>verifyReadalongRelease(release,file=>file.endsWith('/source-drive-verification.json')?Buffer.from('{}'):readFileSync(file)));
});
