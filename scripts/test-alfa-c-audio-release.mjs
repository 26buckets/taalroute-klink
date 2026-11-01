import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyAlfaCAudioRelease} from './check-alfa-c-audio-release.mjs';
void test('Alfa C audio requires exact owner scope, distinct voice, unchanged targets, reviewed branded files and a verified backup',()=>{
 const r=verifyAlfaCAudioRelease();
 for(const mutate of [x=>x.publicationApproved=false,x=>x.newAudio=35,x=>x.newTargetAudio=1,x=>x.humanListeningReview=true,x=>x.voiceId=x.targetVoiceId,x=>x.userRequest='',x=>x.baselineSourceCommit='0'.repeat(40)]){const bad=structuredClone(r);mutate(bad);assert.throws(()=>verifyAlfaCAudioRelease(undefined,bad));}
 for(const p of ['data/klink-alfa-c-audio.json','data/klink-audio-policy.json','data/klink-alfa-c-texts.json','docs/klink-alfa-c-audio-20261027/metadata.json','docs/klink-alfa-c-audio-20261027/transcripts.json','docs/klink-alfa-c-audio-20261027/source-drive-verification.json'])assert.throws(()=>verifyAlfaCAudioRelease(f=>f===p?Buffer.from('{}'):readFileSync(f)));
});
