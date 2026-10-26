import {verifyPracticeAvailabilityRelease,readBeforePracticeAvailability} from './check-practice-availability-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-readalong-20261026';
export const readalongFiles=['app/globals.css','components/product/dialogue-surface.tsx','components/product/package-exercise-browser.tsx','data/klink-teacher-manual.json','docs/KLINK-DOCENTHANDLEIDING.md','scripts/check-readalong-release.mjs','scripts/check-session-audio-release.mjs','scripts/test-readalong-browser.mjs','scripts/test-readalong-native.mjs','scripts/test-readalong-release.mjs','scripts/test-dialogue-repair-browser.mjs','scripts/test-publication-proof.mjs'];
export function verifyReadalongRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-readalong-20261026.json')),readFile){
 const availability=verifyPracticeAvailabilityRelease();
 readFile ||= file=>readBeforePracticeAvailability(file,availability);
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'meelezen wil ik ook automatisch selecteren. De 2de keer gaat hij automatisch uit.');
 assert.equal(release.baselineSourceCommit,'2747e03b49c2253ee32e740a6671ce7375034d26');
 assert.equal(release.liveSourceCommit,'5bfebf4db52631b54dcb3a8c927050487f4ae54f');
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-session-audio-20261026.json');
 assert.equal(release.dialogues,128);assert.equal(release.newImages,0);assert.equal(release.newAudio,0);assert.equal(release.firstWithText,true);assert.equal(release.secondWithoutText,true);
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,availability.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=[]; // The availability successor checks the current source delta.
 assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a.localeCompare(b)),readalongFiles.filter(f=>!f.startsWith('docs/')).sort((a,b)=>a.localeCompare(b)));
 const required=[...readalongFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort((a,b)=>a.localeCompare(b)),required.sort((a,b)=>a.localeCompare(b)));
 for(const [file,hash] of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(r=>r.path),[...readalongFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');assert.equal(review.firstWithText,128);assert.equal(review.secondWithoutText,128);
 for(const field of ['manualChoice','abortedAttempt','singleTurns','retry','newConversationReset','slowPreserved','nativeAudio','sourceAndMediaPreserved','buildPassed','typesPassed','scopedLintPassed'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return {...release,availability};
}
export function readBeforeReadalong(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readBeforePracticeAvailability(file,release?.availability,readFile);}
