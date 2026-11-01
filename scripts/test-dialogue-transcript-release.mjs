import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDialogueTranscriptRelease} from './check-dialogue-transcript-release.mjs';
void test('Transcript release preserves scope, previous approval, source hashes and backup',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-dialogue-transcript-20261026.json'));verifyDialogueTranscriptRelease(release);
 for(const change of [r=>r.publicationApproved=false,r=>r.userRequest='other',r=>r.dialogues=127,r=>r.newAudio=1,r=>r.newImages=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['app/globals.css']]){const bad=structuredClone(release);change(bad);assert.throws(()=>verifyDialogueTranscriptRelease(bad));}
 assert.throws(()=>verifyDialogueTranscriptRelease(release,file=>file==='app/globals.css'?Buffer.from(readFileSync(file)+'\nbody {display:none;}'):readFileSync(file)),/Only transcript styles/);
 assert.throws(()=>verifyDialogueTranscriptRelease(release,file=>file.endsWith('/source-drive-verification.json')?Buffer.from('{}'):readFileSync(file)));
});
