import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifySessionAudioRelease} from './check-session-audio-release.mjs';
test('Session audio release binds the request, tempo, scope, previous approval and verified backup',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-session-audio-20261026.json'));verifySessionAudioRelease(release);
 for(const change of [r=>r.publicationApproved=false,r=>r.userRequest='other',r=>r.slowRate=.5,r=>r.dialogues=127,r=>r.newAudio=1,r=>r.newImages=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['lib/media-player.ts']]){const bad=structuredClone(release);change(bad);assert.throws(()=>verifySessionAudioRelease(bad));}
 assert.throws(()=>verifySessionAudioRelease(release,file=>file==='lib/media-player.ts'?Buffer.from(readFileSync(file)+'\n// altered'):readFileSync(file)));
 assert.throws(()=>verifySessionAudioRelease(release,file=>file.endsWith('/source-drive-verification.json')?Buffer.from('{}'):readFileSync(file)));
});
