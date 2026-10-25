import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDialogueRelease} from './check-dialogue-release.mjs';
test('Dialogue publication is bound to the owner request, current source, exact media and verified backup',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-gesprekken-20261025.json'));
 verifyDialogueRelease(release);
 for(const mutate of [r=>r.publicationApproved=false,r=>r.newAudio--,r=>r.dialogues--,r=>r.userRequest='other',r=>r.humanListeningReview='approved',r=>r.instructionAudioGenerated=true,r=>r.imageGenerationInWorkStopped=false,r=>r.baselineSourceCommit='0'.repeat(40),r=>r.previousAuthorization='other.json',r=>delete r.files['lib/dialogue-repair.ts'],r=>delete r.files['docs/klink-gesprekken-release-20261025/source-drive-verification.json'],r=>r.files['public/dialogue-scenes/een-ander-ingredient.webp']='0'.repeat(64)]) {
  const altered=structuredClone(release);mutate(altered);assert.throws(()=>verifyDialogueRelease(altered));
 }
});
