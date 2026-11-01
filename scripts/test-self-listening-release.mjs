import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import{verifySelfListeningRelease}from'./check-self-listening-release.mjs';
void test('Independent dialogue release remains scoped, preserves participation and verified backups',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-self-listening-20261026.json'));verifySelfListeningRelease(release);
 for(const change of [r=>r.publicationApproved=false,r=>r.participationOnly=false,r=>r.dialogues=127,r=>r.newAudio=1,r=>r.newImages=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['lib/content-levels.ts']]){const bad=structuredClone(release);change(bad);assert.throws(()=>verifySelfListeningRelease(bad));}
 assert.throws(()=>verifySelfListeningRelease(release,file=>file==='lib/content-levels.ts'?Buffer.from('changed'):readFileSync(file)));
 assert.throws(()=>verifySelfListeningRelease(release,file=>file.endsWith('/source-drive-verification.json')?Buffer.from('{}'):readFileSync(file)));
});
