import {verifyGapDemoRelease,readBeforeGapDemo} from './check-gap-demo-release.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const sort=items=>items.toSorted((a,b)=>a.localeCompare(b));
const evidence='docs/klink-build-demo-20261026';
export const buildDemoFiles=['app/learner-ui.css','components/product/package-exercise-browser.tsx','scripts/test-build-demo-browser.mjs','scripts/check-build-demo-release.mjs','scripts/test-build-demo-release.mjs','scripts/check-popup-style-release.mjs','scripts/test-publication-proof.mjs'];
export function verifyBuildDemoRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-build-demo-20261026.json')),readFile){
  const gapDemo=verifyGapDemoRelease();
  readFile ||= file=>readBeforeGapDemo(file,gapDemo);
  assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
  assert.equal(release.userRequest,'Oké, maak het voordoen bij woorden bouwen ook zo duidelijk: een groen handje tikt op de letter en je ziet die in het vak komen. Geen extra knoppen. Behoud de indeling, controleer mobiel en zet het online.');
  assert.equal(release.baselineSourceCommit,'52d051ca357c1dcd579db57f59f3ee44dc4b4908');
  assert.equal(release.liveSourceCommit,release.baselineSourceCommit);
  assert.equal(release.previousAuthorization,'docs/klink-owner-release-popup-style-20261026.json');
  assert.equal(release.newAudio,0);assert.equal(release.newLessons,0);assert.equal(release.extraControls,false);
  git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
  assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  const roots=['app','components','hooks','data','lib','public','scripts'];
  const changed=git('diff','--name-only',release.baselineSourceCommit,gapDemo.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
  const untracked=[]; // The gap-demo successor checks the current delta.
  assert.deepEqual(sort([...new Set([...changed,...untracked])]),sort(buildDemoFiles));
  const required=[...buildDemoFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
  assert.deepEqual(sort(Object.keys(release.files)),sort(required));
  for(const[file,hash]of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
  const owner=JSON.parse(readFile(`${evidence}/owner-request.json`));assert.equal(owner.userRequest,release.userRequest);
  const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(manifest.map(r=>r.path),[...buildDemoFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
  for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
  const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');
  for(const field of ['tapBeforeArrival','greenHandWithoutFrame','replayCurrentLetter','letterGroups','manualPace','noExtraControls','mobile','reducedMotion','progressPreserved','matchingPreserved','contentAndMediaPreserved','typesPassed','lintPassed','buildPassed'])assert.equal(review[field],true,field);
  const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
  return {...release,gapDemo};
}
export function readBeforeBuildDemo(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readBeforeGapDemo(file,release?.gapDemo,readFile);}
