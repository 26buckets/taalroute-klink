import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const evidence='docs/klink-popup-style-20261026';
export const popupStyleFiles=['app/learner-ui.css','components/product/practice-line.tsx','public/practice-explanations/style.css','scripts/test-practice-explanations-mobile-browser.mjs','scripts/check-popup-style-release.mjs','scripts/test-popup-style-release.mjs','scripts/check-demo-hand-release.mjs','scripts/test-publication-proof.mjs'];
export function verifyPopupStyleRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-popup-style-20261026.json')),readFile=readFileSync){
 assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
 assert.equal(release.baselineSourceCommit,'9960478c7da01a1a28e1dede2271136ed9a6b0b0');
 assert.equal(release.liveSourceCommit,'068301d2f0055ac69a184a6ab06efe04b4def597');
 assert.equal(release.previousAuthorization,'docs/klink-owner-release-demo-hand-20261026.json');
 assert.equal(release.priorPublicationRequest,'Ja, zo is het goed. Zet deze versie nu online in Klink, met behoud van de bestaande indeling en functies.');
 const owner=JSON.parse(readFile(`${evidence}/owner-request.json`));assert.equal(release.userRequest,owner.userRequest);assert(release.userRequest.includes('pop-ups')&&release.userRequest.includes('op een telefoon')&&release.userRequest.includes('kleuren'));
 assert.equal(release.newAudio,0);assert.equal(release.newLessons,0);assert.equal(release.newImages,0);
 git('merge-base','--is-ancestor',release.liveSourceCommit,release.baselineSourceCommit);git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const roots=['app','components','hooks','data','lib','public','scripts'];
 const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
 const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
 const sort=items=>items.toSorted((a,b)=>a.localeCompare(b));assert.deepEqual(sort([...new Set([...changed,...untracked])]),sort(popupStyleFiles));
 const required=[...popupStyleFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
 assert.deepEqual(sort(Object.keys(release.files)),sort(required));for(const [file,hash]of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
 const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));assert.deepEqual(manifest.map(r=>r.path),[...popupStyleFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
 const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');assert.equal(review.physicalDeviceTested,false);
 for(const field of ['appStyleMatched','threeBrowserEngines','sixPhoneViewports','touchTargets','landscapePlaybackVisible','largeTextReadable','keyboardAndFocus','layoutAndProgressPreserved','contentAndMediaPreserved','typesPassed','scopedLintPassed','buildPassed'])assert.equal(review[field],true,field);
 const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
 return release;
}
export function readBeforePopupStyle(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readFile(file);}
