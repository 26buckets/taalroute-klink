import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-session-audio-20261026';
export const sessionAudioFiles=['app/globals.css','components/product/dialogue-surface.tsx','components/product/learner-app.tsx','components/product/shared.tsx','data/klink-teacher-manual.json','lib/media-player.ts','docs/KLINK-DOCENTHANDLEIDING.md','scripts/check-session-audio-release.mjs','scripts/check-dialogue-transcript-release.mjs','scripts/test-session-audio.mjs','scripts/test-session-audio-browser.mjs','scripts/test-session-audio-native.mjs','scripts/test-session-audio-release.mjs','scripts/test-publication-proof.mjs'];
export function verifySessionAudioRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-session-audio-20261026.json')),readFile=readFileSync){
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'Ik wil een langzmere aspeel knop voor alle dialogen inbouwen een selecteerbaar slakkenknopje. Deze geldt dan direct voor de gehele sessie ook als de persoon naar andere onderdelen gaat.');
 assert.equal(release.baselineSourceCommit,'01f019603b1eebd818a29f6e49825786cd488451');
 assert.equal(release.liveSourceCommit,'5c49940e8bbc0688a187840a606886550def9b2a');
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-dialogue-transcript-20261026.json');
 assert.equal(release.dialogues,128);assert.equal(release.newImages,0);assert.equal(release.newAudio,0);assert.equal(release.slowRate,.65);
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
 assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a.localeCompare(b)),sessionAudioFiles.filter(f=>!f.startsWith('docs/')).sort((a,b)=>a.localeCompare(b)));
 const required=[...sessionAudioFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort((a,b)=>a.localeCompare(b)),required.sort((a,b)=>a.localeCompare(b)));
 for(const [file,hash] of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(r=>r.path),[...sessionAudioFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');assert.equal(review.slowDialogues,128);assert.equal(review.slowTurns,512);
 for(const field of ['immediateRateChange','sessionPersistence','otherSections','exitResets','blockedStorage','normalPlaybackPreserved','nativeAudio','sourceAndMediaPreserved','buildPassed','typesPassed','scopedLintPassed'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return release;
}
export function readBeforeSessionAudio(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readFile(file);}
