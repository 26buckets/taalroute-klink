import { verifyDialogueImageFitRelease, readBeforeDialogueImageFit } from './check-dialogue-image-fit-release.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(readFileSync(file));
const git = (...args) => execFileSync('git', args, {maxBuffer: 32 * 1024 * 1024});
const evidence = 'docs/klink-gesprekken-release-20261025';
export const dialogueSourceFiles = [
 'AGENTS.md', 'PUBLICATIE.md', 'app/globals.css', 'components/product/dialogue-surface.tsx',
 'components/product/package-exercise-browser.tsx', 'lib/dialogue-repair.ts', 'lib/connected-content.ts',
 'data/klink-dialogue-repair.json', 'public/content-register/active.json', 'public/content-register/planned.json', 'public/content-register/summary.json',
 'scripts/build-audio-register.mjs', 'scripts/test-audio-register.mjs', 'scripts/test-sections.mjs', 'scripts/test-connected-content-browser.mjs', 'scripts/browser-route-helpers.mjs', 'scripts/test-connected-content.mjs',
 'scripts/test-dialogue-repair.mjs', 'scripts/test-dialogue-repair-browser.mjs', 'scripts/test-dialogue-all-media.mjs',
 'scripts/check-dialogue-release.mjs', 'scripts/test-dialogue-release.mjs', 'scripts/check-sound-audio-release.mjs',
 'scripts/check-curriculum-release.mjs', 'scripts/test-publication-proof.mjs', 'scripts/test-sound-audio-release.mjs',
 'scripts/test-word-library-release.mjs', 'scripts/test-article-review-release.mjs', 'scripts/verify-live-release.mjs',
];
export function verifyDialogueRelease(release = read('docs/klink-owner-release-gesprekken-20261025.json')) {
 const imageFit = verifyDialogueImageFitRelease();
 assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
 assert.equal(release.userRequest, 'zorg dat dit online komt te staan alvast, zodat dat gelijk standaard doorgevoerd is bij de juiste opdrachten.');
 assert.equal(read(`${evidence}/owner-request.json`).userRequest, release.userRequest);
 assert.equal(release.baselineSourceCommit, '40625330feb9018798dfd9d30308a31733cf0f3c');
 assert.equal(release.liveSourceCommit, '8b493aecf3eb8249b2f9109d3758aa21424694da');
 assert.equal(release.previousAuthorization, 'docs/klink-owner-release-klankaudio-20261025.json');
 assert.equal(release.newAudio, 512); assert.equal(release.dialogues, 128);
 assert.equal(release.humanListeningReview, 'open'); assert.equal(release.instructionAudioGenerated, false);
 assert.equal(release.imageGenerationInWorkStopped, true);
 git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
 git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
 assert.equal(hash(readFileSync(release.previousAuthorization)), hash(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const repair = read('data/klink-dialogue-repair.json');
 assert.equal(repair.dialogues.length, 128);
 const original = read('data/klink-connected-content.json');
 assert.equal(hash(readFileSync('data/klink-connected-content.json')), hash(git('show', `${release.baselineSourceCommit}:data/klink-connected-content.json`)));
 const cast = new Map(repair.cast.map(c => [c.personId, c]));
 const media = new Set();
 for (const d of repair.dialogues) {
  const source = original.items.find(item => item.id === d.id);
  assert(source && source.kind === 'dialogue'); assert.equal(d.sourceLevel, source.sourceLevel);
  assert.equal(d.turns.length, 4); assert.equal(new Set(d.turns.map(t => t.voiceId)).size, 2);
  assert(d.image.src.startsWith('/dialogue-scenes/')); media.add('public' + d.image.src);
  for (const [index, turn] of d.turns.entries()) {
   const block = source.blocks[index];
   assert.equal(turn.id, block.id); assert.equal(turn.text, block.text); assert.equal(turn.originalSrc, block.audio.src);
   assert.equal(turn.voiceId, cast.get(turn.personId)?.voiceId); assert.notEqual(turn.voiceId, 'h6uBOiAjLKklte8hdYio');
   assert.equal(turn.status, 'candidate'); assert.equal(turn.humanListeningReview, 'open');
   assert(turn.metadataVerified && turn.audioPacketsUnchanged);
   for (const field of ['artist','album_artist','publisher']) assert.equal(turn.metadata[field], 'Taalroute');
   assert.equal(turn.src, `/package-audio/dialogue-repair/${turn.id}.mp3`);
   const file = 'public' + turn.src; media.add(file);
   assert.equal(hash(readFileSync(file)), turn.sha256); assert.equal(release.files[file], turn.sha256);
  }
 }
 assert.equal(media.size, 528);
 const expected = [...dialogueSourceFiles.filter(p => /^(app|components|data|lib|public)\//.test(p)), ...media].sort((a,b)=>a.localeCompare(b));
 const changed = git('diff', '--name-only', release.baselineSourceCommit, '--', 'app','components','hooks','data','lib','public').toString().trim().split('\n').filter(Boolean);
 const untracked = git('ls-files', '--others', '--exclude-standard', '--', 'app','components','hooks','data','lib','public').toString().trim().split('\n').filter(Boolean);
 assert.deepEqual([...new Set([...changed, ...untracked])].sort((a,b)=>a.localeCompare(b)), expected);
 const manifest = read(`${evidence}/source-manifest.json`);
 assert.deepEqual(manifest.map(row => row.path), [...dialogueSourceFiles, ...[...media].sort((a,b)=>a.localeCompare(b))]);
 for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
 for (const file of dialogueSourceFiles) assert(release.files[file], file);
 for (const name of ['owner-request','source-manifest','source-drive-verification','review','live-baseline','preservation','image-review','original-manifest','metadata-review']) assert(release.files[`${evidence}/${name}.json`]);
 for (const [file, sha] of Object.entries(release.files)) assert.equal(hash(readBeforeDialogueImageFit(file, imageFit)), sha, file);
 const review = read(`${evidence}/review.json`), backup = read(`${evidence}/source-drive-verification.json`);
 assert.equal(review.status, 'passed-local'); assert.equal(review.humanListeningReview, 'open');
 for (const key of ['buildPassed','typesPassed','lintPassed','sourcePreservationPassed','dialogueBrowserPassed','all128RoutesPassed','all512PlaybackPassed','metadataPassed','regressionPassed']) assert.equal(review[key], true, key);
 assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
 assert.equal(backup.manifestEntriesVerified, manifest.length);
 return release;
}
export function readBeforeDialogueRelease(file, release) {
 return release.files[file] ? git('show', `${release.baselineSourceCommit}:${file}`) : readFileSync(file);
}
