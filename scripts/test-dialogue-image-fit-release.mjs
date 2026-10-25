import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyDialogueImageFitRelease} from './check-dialogue-image-fit-release.mjs';
test('Photo correction preserves historical approval and rejects scope, evidence and crop regressions', () => {
 const release=JSON.parse(readFileSync('docs/klink-owner-release-dialogue-image-fit-20261025.json'));
 verifyDialogueImageFitRelease(release);
 for (const mutate of [r=>r.publicationApproved=false,r=>r.userRequest='other',r=>r.newImages=1,r=>r.newAudio=1,r=>r.dialogues=127,r=>r.baselineSourceCommit='0'.repeat(40),r=>r.previousAuthorization='other.json',r=>delete r.files['app/globals.css'],r=>delete r.files['docs/klink-dialogue-image-fit-20261025/source-drive-verification.json']]) {
  const bad=structuredClone(release);mutate(bad);assert.throws(()=>verifyDialogueImageFitRelease(bad));
 }
 const css=readFileSync('app/globals.css','utf8').replace('height: auto; max-height: none; object-fit: contain; border: 0;', 'height: 170px; max-height: none; object-fit: cover; border: 0;');
 const bad=structuredClone(release);bad.files['app/globals.css']=createHash('sha256').update(css).digest('hex');
 assert.throws(()=>verifyDialogueImageFitRelease(bad,file=>file==='app/globals.css'?Buffer.from(css):readFileSync(file)),/full-photo sizing/);
});
