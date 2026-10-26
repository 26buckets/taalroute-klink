import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-dialogue-playback-20261026';
export const playbackFiles=['components/product/dialogue-surface.tsx','components/product/package-exercise-browser.tsx','data/klink-teacher-manual.json','docs/KLINK-DOCENTHANDLEIDING.md','scripts/browser-route-helpers.mjs','scripts/test-connected-content-browser.mjs','scripts/test-dialogue-repair-browser.mjs','scripts/check-dialogue-playback-release.mjs','scripts/check-dialogue-release.mjs','scripts/check-dialogue-image-fit-release.mjs','scripts/test-dialogue-playback-release.mjs','scripts/test-dialogue-image-fit-release.mjs','scripts/test-publication-proof.mjs'];
export function verifyDialoguePlaybackRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-dialogue-playback-20261026.json'))) {
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);assert.equal(release.userRequest,'prima, doe dit');
 const owner=JSON.parse(readFileSync(`${evidence}/owner-request.json`));
 assert.deepEqual(release.acceptedProposal,owner.acceptedProposal);assert.equal(release.acceptedProposal.automaticPlaybackOnOpen,false);
 assert.equal(release.baselineSourceCommit,'429e0d89e8a67dbc4e1b41c3f732a92ba2f40c7e');assert.equal(release.liveSourceCommit,'2707c1043126db023229c89b8b86ec9085c5f3eb');
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-dialogue-image-fit-20261025.json');
 assert.equal(release.dialogues,128);assert.equal(release.newImages,0);assert.equal(release.newAudio,0);
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFileSync(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
 assert.deepEqual([...new Set([...changed,...untracked])],['components/product/dialogue-surface.tsx','components/product/package-exercise-browser.tsx','data/klink-teacher-manual.json']);
 const required=[...playbackFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort(),required.sort());
 for(const [file,hash] of Object.entries(release.files))assert.equal(sha(readFileSync(file)),hash,file);
 const manifest=JSON.parse(readFileSync(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(r=>r.path),[...playbackFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const review=JSON.parse(readFileSync(`${evidence}/review.json`));assert.equal(review.status,'passed-local');assert.equal(review.allDialoguesWholePlayback,128);
 for(const field of ['noAutoplay','perTurnWorks','optionalTextWorks','modeResetsBetweenExercises','pauseAndErrorHandling','fullPhotosPreserved','sourceAndMediaPreserved','buildPassed','typesPassed','scopedLintPassed'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFileSync(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return release;
}
export function readBeforeDialoguePlayback(file,release){return release.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readFileSync(file);}
