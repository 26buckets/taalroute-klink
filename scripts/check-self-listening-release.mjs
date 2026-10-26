import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-self-listening-20261026';
export const selfListeningFiles=['lib/content-levels.ts','components/product/dialogue-surface.tsx','data/klink-teacher-manual.json','docs/KLINK-DOCENTHANDLEIDING.md','scripts/test-guided-entry.mjs','scripts/test-self-listening-browser.mjs','scripts/check-self-listening-release.mjs','scripts/test-self-listening-release.mjs','scripts/check-practice-availability-release.mjs','scripts/test-publication-proof.mjs'];
export function verifySelfListeningRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-self-listening-20261026.json')),readFile=readFileSync){
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'akkoord: Zelf oefenen bij het luisteren en Met de docent alleen bij samen bespreken of begrip beoordelen. Alleen luisteren bewijst namelijk nog niet dat iemand het gesprek begrijpt.');
 assert.equal(release.baselineSourceCommit,'5ddaee5e98a4ef17aadf5e4d0e254b60c624de24');assert.equal(release.liveSourceCommit,release.baselineSourceCommit);
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-practice-availability-20261026.json');
 assert.equal(release.dialogues,128);assert.equal(release.newImages,0);assert.equal(release.newAudio,0);assert.equal(release.participationOnly,true);
 git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
 assert.deepEqual([...new Set([...changed,...untracked])].sort(),selfListeningFiles.filter(f=>!f.startsWith('docs/')).sort());
 const required=[...selfListeningFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort(),required.sort());for(const[file,hash]of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));assert.deepEqual(manifest.map(r=>r.path),[...selfListeningFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');assert.equal(review.dialogues,128);
 for(const field of ['independentCards','filtersAndRoutes','participationOnly','teacherTasksRetained','progressPreserved','readalongPreserved','slowPreserved','buildPassed','typesPassed','scopedLintPassed','sourceAndMediaPreserved'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return release;
}
export function readBeforeSelfListening(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readFile(file);}
