import {verifySoundAudioRelease, readBeforeSoundAudioRelease} from './check-sound-audio-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyArticleReviewRelease} from './check-article-review-release.mjs';
test('The review release requires exact scope, owner approval and unchanged audio',()=>{
 const sounds=verifySoundAudioRelease();
 const readBefore=file=>readBeforeSoundAudioRelease(file,sounds);
 const release=JSON.parse(readFileSync('docs/klink-owner-release-article-review-20261025.json'));
 verifyArticleReviewRelease(release,readBefore,sounds.baselineSourceCommit);
 for(const mutate of [r=>r.publicationApproved=false,r=>r.newAudio=1,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['app/learner-ui.css'],r=>delete r.files['docs/klink-article-review-20261025/review.json'],r=>delete r.files['docs/klink-article-review-20261025/source-drive-verification.json']]){
  const changed=structuredClone(release);mutate(changed);assert.throws(()=>verifyArticleReviewRelease(changed,readBefore,sounds.baselineSourceCommit));
 }
});
