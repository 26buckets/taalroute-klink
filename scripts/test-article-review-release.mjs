import { verifyDialogueRelease, readBeforeDialogueRelease } from './check-dialogue-release.mjs';
import {verifySoundAudioRelease,readBeforeSoundAudioRelease} from './check-sound-audio-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyWordLibraryRelease,readBeforeWordLibrary} from './check-word-library-release.mjs';
import {verifyArticleReviewRelease} from './check-article-review-release.mjs';
test('The review release requires exact scope, owner approval and unchanged audio',()=>{
 const dialogueRelease = verifyDialogueRelease();
  const readBeforeDialogues = file => readBeforeDialogueRelease(file, dialogueRelease);
  const sounds = verifySoundAudioRelease(undefined, readBeforeDialogues, dialogueRelease.baselineSourceCommit);
 const readBeforeSounds=file=>readBeforeSoundAudioRelease(file, sounds, readBeforeDialogues);
 const library=verifyWordLibraryRelease(undefined,readBeforeSounds,sounds.baselineSourceCommit);
 const verify=release=>verifyArticleReviewRelease(release,file=>readBeforeWordLibrary(file,library,readBeforeSounds),library.baselineSourceCommit);
 const release=JSON.parse(readFileSync('docs/klink-owner-release-article-review-20261025.json'));
 verify(release);
 for(const mutate of [r=>r.publicationApproved=false,r=>r.newAudio=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['app/learner-ui.css'],r=>delete r.files['docs/klink-article-review-20261025/review.json'],r=>delete r.files['docs/klink-article-review-20261025/source-drive-verification.json']]){
  const changed=structuredClone(release);mutate(changed);assert.throws(()=>verify(changed));
 }
});
