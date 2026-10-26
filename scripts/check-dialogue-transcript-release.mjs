import {verifySessionAudioRelease,readBeforeSessionAudio} from './check-session-audio-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-dialogue-transcript-20261026';
export const transcriptFiles=['app/globals.css','scripts/check-dialogue-transcript-release.mjs','scripts/check-word-image-replacements.mjs','scripts/test-dialogue-transcript-browser.mjs','scripts/test-dialogue-transcript-release.mjs','scripts/test-publication-proof.mjs'];
export function verifyDialogueTranscriptRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-dialogue-transcript-20261026.json')),readFile){
 const sessionAudio=verifySessionAudioRelease();
 readFile ||= file=>readBeforeSessionAudio(file,sessionAudio);
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'kunnen we deze duidelijker maken en weergeven. Standaard opmaak voor alle dialogen');
 assert.equal(release.baselineSourceCommit,'9db5424f254263d43bb1d77669a69f5127c00a2a');
 assert.equal(release.liveSourceCommit,'548caafc11f8d8e8d9695822a7837808735d4652');
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-word-images-20261026.json');
 assert.equal(release.dialogues,128);assert.equal(release.newImages,0);assert.equal(release.newAudio,0);
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,sessionAudio.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=[]; // The session-audio successor checks the current source delta.
 assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a.localeCompare(b)),[...transcriptFiles].sort((a,b)=>a.localeCompare(b)));
 const strip=css=>css.replace(/\.cp-dialogue-transcript summary[\s\S]*?(?=@media \(max-width: 760px\))/, '');
 assert.equal(strip(readFile('app/globals.css').toString()),strip(git('show',`${release.baselineSourceCommit}:app/globals.css`).toString()),'Only transcript styles may change');
 const required=[...transcriptFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort((a,b)=>a.localeCompare(b)),required.sort((a,b)=>a.localeCompare(b)));
 for(const [file,hash] of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(r=>r.path),[...transcriptFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');assert.equal(review.transcriptLayouts,384);
 for(const field of ['keyboardAudio','wholeConversationPreserved','fullPhotosPreserved','sourceAndMediaPreserved','buildPassed','typesPassed','scopedLintPassed'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return {...release,sessionAudio};
}
export function readBeforeDialogueTranscript(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readBeforeSessionAudio(file,release?.sessionAudio,readFile);}
