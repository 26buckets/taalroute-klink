import {verifyPopupStyleRelease,readBeforePopupStyle} from './check-popup-style-release.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const sha = b => createHash('sha256').update(b).digest('hex');
const git = (...args) => execFileSync('git', args, { maxBuffer: 32*1024*1024 });
const evidence = 'docs/klink-demo-hand-20261026';
export const demoHandFiles = ['app/learner-ui.css', 'components/product/package-exercise-browser.tsx', 'scripts/test-demo-hand-browser.mjs', 'scripts/check-demo-hand-release.mjs', 'scripts/test-demo-hand-release.mjs', 'scripts/check-practice-explanations-release.mjs', 'scripts/test-publication-proof.mjs'];
export function verifyDemoHandRelease(release = JSON.parse(readFileSync('docs/klink-owner-release-demo-hand-20261026.json')), readFile) {
  const popupStyle = verifyPopupStyleRelease();
  readFile ||= file => readBeforePopupStyle(file, popupStyle);
  assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
  assert.equal(release.baselineSourceCommit, 'cb16773f5ce5e7604f2dcc0f654ce5f400638076');
  assert.equal(release.liveSourceCommit, '84827995817bfca452a01365d7b0d0b0bfaced3e');
  assert.equal(release.previousAuthorization, 'docs/klink-owner-release-practice-explanations-20261026.json');
  assert.equal(release.newAudio, 0); assert.equal(release.newLessons, 0); assert.equal(release.extraControls, false);
  git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
  git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
  assert.equal(sha(readFile(release.previousAuthorization)), sha(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
  const roots = ['app','components','hooks','data','lib','public','scripts'];
  const changed = git('diff','--name-only',release.baselineSourceCommit,popupStyle.baselineSourceCommit,'--',...roots).toString().trim().split('\n').filter(Boolean);
  const untracked = []; // The phone-style successor checks the current source delta.
  assert.deepEqual([...new Set([...changed,...untracked])].sort((a,b)=>a.localeCompare(b)), [...demoHandFiles].sort((a,b)=>a.localeCompare(b)));
  const required = [...demoHandFiles,...['owner-request','live-baseline','review','source-manifest','source-drive-verification'].map(n=>`${evidence}/${n}.json`)];
  assert.deepEqual(Object.keys(release.files).sort((a,b)=>a.localeCompare(b)), required.sort((a,b)=>a.localeCompare(b)));
  for (const [file,hash] of Object.entries(release.files)) assert.equal(sha(readFile(file)),hash,file);
  const owner = JSON.parse(readFile(`${evidence}/owner-request.json`));
  assert.equal(owner.publicationRequest, release.userRequest);
  assert.equal(owner.latestRefinement, release.latestRefinement);
  assert.match(release.userRequest, /zet het daarna online/);
  assert.match(release.latestRefinement, /kleine animatie/);
  const manifest = JSON.parse(readFile(`${evidence}/source-manifest.json`));
  assert.deepEqual(manifest.map(r=>r.path), [...demoHandFiles,...['owner-request','live-baseline','review'].map(n=>`${evidence}/${n}.json`)]);
  for (const row of manifest) assert.equal(row.sha256,release.files[row.path]);
  const review = JSON.parse(readFile(`${evidence}/review.json`));
  assert.equal(review.status,'passed-local');
  for (const field of ['singleGreenHand','transparentBackground','orderedTaps','manualPace','replay','mobile','reducedMotion','progressPreserved','contentAndMediaPreserved','typesPassed','lintPassed','buildPassed']) assert.equal(review[field],true,field);
  const backup = JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
  assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
  assert.equal(backup.manifestEntriesVerified,manifest.length);
  return {...release, popupStyle};
}
export function readBeforeDemoHand(file, release, readFile = readFileSync) {
  return release?.files[file] ? git('show',`${release.baselineSourceCommit}:${file}`) : readBeforePopupStyle(file, release?.popupStyle, readFile);
}
