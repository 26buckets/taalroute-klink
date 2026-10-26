import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const sha=b=>createHash('sha256').update(b).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:32*1024*1024});
const sort=items=>items.toSorted((a,b)=>a.localeCompare(b));
const evidence='docs/klink-demo-mobile-20261026';
export const demoMobileFiles=['app/learner-ui.css','components/product/package-exercise-browser.tsx','scripts/test-demo-mobile-browser.mjs','scripts/check-demo-mobile-release.mjs','scripts/test-demo-mobile-release.mjs','scripts/check-gap-demo-release.mjs','scripts/test-publication-proof.mjs'];
export function verifyDemoMobileRelease(release=JSON.parse(readFileSync('docs/klink-owner-release-demo-mobile-20261026.json')),readFile=readFileSync){
  assert.equal(release.approvedBy,'Nico');assert.equal(release.publicationApproved,true);
  assert.equal(release.userRequest,'Oké, controleer nu alle voordoevoorbeelden samen op mobiel. Laat het groene handje overal duidelijk zien wat de cursist moet doen. Geen extra knoppen, behoud de indeling en zet eventuele verbeteringen online.');
  assert.equal(release.baselineSourceCommit,'79f0583d32fc9c6315a6680ec76442ffaafcbce1');
  assert.equal(release.liveSourceCommit,release.baselineSourceCommit);
  assert.equal(release.previousAuthorization,'docs/klink-owner-release-gap-demo-20261026.json');
  assert.equal(release.newAudio,0);assert.equal(release.newLessons,0);assert.equal(release.extraControls,false);
  git('merge-base','--is-ancestor',release.baselineSourceCommit,'HEAD');
  assert.equal(sha(readFile(release.previousAuthorization)),sha(git('show',`${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  const roots=['app','components','hooks','data','lib','public','scripts'];
  const changed=git('diff','--name-only',release.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
  const untracked=git('ls-files','--others','--exclude-standard','--',...roots).toString().trim().split('\n').filter(Boolean);
  assert.deepEqual(sort([...new Set([...changed,...untracked])]),sort(demoMobileFiles));
  const required=[...demoMobileFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
  assert.deepEqual(sort(Object.keys(release.files)),sort(required));
  for(const[file,hash]of Object.entries(release.files))assert.equal(sha(readFile(file)),hash,file);
  const owner=JSON.parse(readFile(`${evidence}/owner-request.json`));assert.equal(owner.userRequest,release.userRequest);
  const manifest=JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(manifest.map(r=>r.path),[...demoMobileFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
  for(const row of manifest)assert.equal(row.sha256,release.files[row.path]);
  const review=JSON.parse(readFile(`${evidence}/review.json`));assert.equal(review.status,'passed-local');
  for(const field of ['sevenTypesReviewed','greenHandWithoutFrame','replay','selectionAfterTap','manualPace','noExtraControls','mobile','landscape','reducedMotion','progressPreserved','popupPreserved','contentAndMediaPreserved','typesPassed','lintPassed','buildPassed'])assert.equal(review[field],true,field);
  const backup=JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified&&backup.downloadedByteIdentical&&backup.zipCrcVerified);assert.equal(backup.manifestEntriesVerified,manifest.length);
  return release;
}
export function readBeforeDemoMobile(file,release,readFile=readFileSync){return release?.files[file]?git('show',`${release.baselineSourceCommit}:${file}`):readFile(file);}
