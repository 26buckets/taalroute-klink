import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {verifyDialoguePlaybackRelease} from './check-dialogue-playback-release.mjs';
test('Whole-conversation default stays bound to the accepted proposal, source, prior release and backup',()=>{
 const r=JSON.parse(readFileSync('docs/klink-owner-release-dialogue-playback-20261026.json'));verifyDialoguePlaybackRelease(r);
 for(const change of [x=>x.publicationApproved=false,x=>x.userRequest='other',x=>x.acceptedProposal.automaticPlaybackOnOpen=true,x=>x.dialogues=127,x=>x.newAudio=1,x=>x.newImages=1,x=>x.baselineSourceCommit='0'.repeat(40),x=>x.previousAuthorization='other.json',x=>delete x.files['components/product/dialogue-surface.tsx'],x=>delete x.files['docs/klink-dialogue-playback-20261026/source-drive-verification.json']]){const bad=structuredClone(r);change(bad);assert.throws(()=>verifyDialoguePlaybackRelease(bad));}
});
