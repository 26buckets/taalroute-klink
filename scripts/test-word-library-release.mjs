import { verifyDialogueRelease, readBeforeDialogueRelease } from './check-dialogue-release.mjs';
import { verifySoundAudioRelease, readBeforeSoundAudioRelease } from './check-sound-audio-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyWordLibraryRelease } from './check-word-library-release.mjs';
test('Word-library publication requires the approved source, full coverage and verified recovery', () => {
  const dialogueRelease = verifyDialogueRelease();
  const readBeforeDialogues = file => readBeforeDialogueRelease(file, dialogueRelease);
  const sounds = verifySoundAudioRelease(undefined, readBeforeDialogues, dialogueRelease.baselineSourceCommit);
  const readBeforeSounds = file => readBeforeSoundAudioRelease(file, sounds, readBeforeDialogues);
  const release = JSON.parse(readFileSync('docs/klink-owner-release-word-library-20261025.json'));
  verifyWordLibraryRelease(release, readBeforeSounds, sounds.baselineSourceCommit);
  for (const mutate of [r => r.publicationApproved = false, r => r.newAudio = 1, r => r.wordCount--, r => r.baselineSourceCommit = '0'.repeat(40), r => delete r.files['lib/word-library.ts'], r => delete r.files['docs/klink-word-library-20261025/review.json'], r => delete r.files['docs/klink-word-library-20261025/source-drive-verification.json']]) {
    const changed = structuredClone(release); mutate(changed);
    assert.throws(() => verifyWordLibraryRelease(changed, readBeforeSounds, sounds.baselineSourceCommit));
  }
});
