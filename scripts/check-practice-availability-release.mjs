import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-practice-availability-20261026';
export const availabilityFiles=[
  "app/learner-ui.css",
  "components/product/imported-practice-surface.tsx",
  "components/product/imported-teacher-workflow.tsx",
  "components/product/practice-chapters.tsx",
  "components/product/route-settings.tsx",
  "lib/practice-chapters.ts",
  "scripts/check-practice-availability-release.mjs",
  "scripts/check-readalong-release.mjs",
  "scripts/test-cumulative-routes-browser.mjs",
  "scripts/test-cumulative-workflow-browser.mjs",
  "scripts/test-existing-player-browser.mjs",
  "scripts/test-guided-entry-browser.mjs",
  "scripts/test-guided-entry.mjs",
  "scripts/test-imported-practice-browser.mjs",
  "scripts/test-practice-availability-browser.mjs",
  "scripts/test-practice-availability-release.mjs",
  "scripts/test-practice-availability.mjs",
  "scripts/test-practice-chapters-browser.mjs",
  "scripts/test-practice-chapters.mjs",
  "scripts/test-publication-proof.mjs",
  "scripts/test-route-panel-browser.mjs",
  "scripts/test-sounds-browser.mjs"
];
export function verifyPracticeAvailabilityRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-practice-availability-20261026.json')),readFile=readFileSync){
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.userRequest,'doe dit en zet online');
 assert.equal(release.baselineSourceCommit,'d3a1942487cb61b1fb7de6ecfe983d5a16afc687');
 assert.equal(release.liveSourceCommit,'d3a1942487cb61b1fb7de6ecfe983d5a16afc687');
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-readalong-20261026.json');
 assert.equal(release.newImages,0);assert.equal(release.newAudio,0);assert.equal(release.newLessons,0);
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
 assert.deepEqual([...new Set([...changed,...untracked])].sort(),[...availabilityFiles].sort(),'Only approved practice UI, route availability and their checks may change');
 const required=[...availabilityFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(Object.keys(release.files).sort(),required.sort());
 for(const [file,hash] of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
 assert.deepEqual(manifest.map(r=>r.path),[...availabilityFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
 for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const owner=JSON.parse(readFile(`${evidence}/owner-request.json`));assert.equal(owner.publicationRequest,release.userRequest);
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');
 for(const field of ['availabilityMatrix','disabledChoices','staleLinks','noLevelDowngrade','singleActivityShortcut','guidedWorkflow','savedAnswers','responsiveScroll','latestAudioPreserved','sourceAndMediaPreserved','buildPassed','typesPassed','scopedLintPassed'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return release;
}
export function readBeforePracticeAvailability(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readFile(file);}
