import {verifyDemoMobileRelease,readBeforeDemoMobile} from './check-demo-mobile-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const sort=items=>items.toSorted((a,b)=>a.localeCompare(b));
const evidence='docs/klink-gap-demo-20261026';
export const gapDemoFiles=['app/learner-ui.css','components/product/package-exercise-browser.tsx','scripts/test-gap-demo-browser.mjs','scripts/check-gap-demo-release.mjs','scripts/test-gap-demo-release.mjs','scripts/check-build-demo-release.mjs','scripts/test-publication-proof.mjs'];
export function verifyGapDemoRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-gap-demo-20261026.json')),readFile){
  const demoMobile=verifyDemoMobileRelease();
  readFile ||= file=>readBeforeDemoMobile(file,demoMobile);
  assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
  assert.equal(release.userRequest,'Oké, maak het voordoen bij ‘Wat ontbreekt?’ ook zo duidelijk: een groen handje tikt op de juiste letter en die verschijnt in het woord. Geen extra knoppen. Behoud de indeling, controleer mobiel en zet het online.');
  assert.equal(release.baselineSourceCommit,'5019e9e3c75a31ff2060d28e42f9a8e5b4cdbd5b');
  assert.equal(release.liveSourceCommit,release.baselineSourceCommit);
  assert.equal(release.previousAuthorization,'docs/klink-owner-release-build-demo-20261026.json');
  assert.equal(release.newAudio,0);assert.equal(release.newLessons,0);assert.equal(release.extraControls,false);
  git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
  assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  const roots=['app','components','hooks','data','lib','public','scripts'];
  const changed=git('diff','--name-only',release.baselineSourceCommit,demoMobile.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
  const untracked=[]; // The mobile-demo successor checks the current delta.
  assert.deepEqual(sort([...new Set([...changed,...untracked])]),sort(gapDemoFiles));
  const required=[...gapDemoFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
  assert.deepEqual(sort(Object.keys(release.files)),sort(required));
  for(const[file,hash]of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
  const owner=JSON.parse(readFile(`${evidence}/owner-request.json`));assert.equal(owner.userRequest,release.userRequest);
  const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(manifest.map(r=>r.path),[...gapDemoFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
  for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
  const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');
  for(const field of ['tapBeforeArrival','greenHandWithoutFrame','replayMissingLetter','letterGroups','manualPace','noExtraControls','mobile','reducedMotion','progressPreserved','matchingPreserved','buildingPreserved','contentAndMediaPreserved','typesPassed','lintPassed','buildPassed'])assert.equal(review[field],true,field);
  const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
  return {...release,demoMobile};
}
export function readBeforeGapDemo(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readBeforeDemoMobile(file,release?.demoMobile,readFile);}
