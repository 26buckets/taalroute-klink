import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const uiBaseline = '0e72bf0ead44306e77b85dd06ae4856e663ad755';
const reviewed = '31635a5492b22a10d7ea853971ca13db7a422aba';
const folder = 'docs/ui-publication-20261109/';
const git = (...args) => execFileSync('git', args, {maxBuffer: 128e6});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const expected = [
  "VORMGEVING-VASTGEZET.md",
  "app/globals.css",
  "app/learner-layout.css",
  "app/learner-ui.css",
  "components/product/alfa-c-dagelijks.tsx",
  "components/product/alfa-c-functioneel.tsx",
  "components/product/alfa-c-workspace.css",
  "components/product/alfa-c-workspace.tsx",
  "components/product/entry-design.tsx",
  "components/product/exercise-listen.tsx",
  "components/product/exercise-view.tsx",
  "components/product/learner-app.tsx",
  "components/product/package-exercise-browser.tsx",
  "components/product/practice-chapters.tsx",
  "components/product/teacher-classroom.css",
  "components/product/teacher-classroom.tsx",
  "docs/appearance-floor-20261031/approved-updates/ui-quality-20261109.json",
  "docs/appearance-floor-20261031/floor.json",
  "lib/practice-chapters.ts",
  "lib/word-library.ts",
  "public/taalroute-menu/menu-controls.js",
  "scripts/audit-ui-accessibility-20261109.mjs",
  "scripts/check-listen-labels-release-20261109.mjs",
  "scripts/check-ui-release-20261109.mjs",
  "scripts/deploy-static-audio.mjs",
  "scripts/test-audio-word-practice-browser.mjs",
  "scripts/test-card-titles-word-filters.mjs",
  "scripts/test-connected-instructions-browser.mjs",
  "scripts/test-continuous-flow-browser.mjs",
  "scripts/test-learner-ux-audio-browser.mjs",
  "scripts/test-listen-labels-20261109.mjs",
  "scripts/test-production-answers.mjs",
  "scripts/test-review-availability-20261109.mjs",
  "scripts/test-review-saved-words-browser.mjs",
  "scripts/test-teacher-direct-board-browser.mjs",
  "scripts/test-ui-controls-20261109.mjs",
  "scripts/test-ui-quality-20261109.mjs",
  "scripts/test-ui-release-20261109.mjs",
  "scripts/test-word-audio-ui-browser.mjs",
  "scripts/test-word-library-browser.mjs",
  "scripts/test-word-library.mjs",
  "scripts/test-word-placeholder-browser-20261031.mjs"
];
export function verifyUiRelease(read = readFileSync) {
  const json = path => JSON.parse(read(path)), r = json(folder + 'approval.json');
  assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true); assert.equal(r.appearanceChangeApproved, true);
  assert.equal(r.userRequest, 'Publiceer het.'); assert.equal(r.baselineSourceCommit, uiBaseline); assert.equal(r.reviewedSourceCommit, reviewed);
  assert.equal(r.liveSourceCommit, '75cda7ec2ec683aa74d393b70f1289400e5a21c9');
  assert.equal(r.liveWorkerVersion, 'a1ee33ba-1cd4-4d7d-a8f6-b46824590758');
  assert.equal(r.liveAudioWorkerVersion, '43e33cde-fb7c-4a8c-a4a8-98876f334a07');
  assert.equal(r.audioWorkerPreviouslyExists, true); assert.equal(r.newMeteredServices, 0); assert.equal(r.normalCommand, 'npm run deploy');
  git('merge-base', '--is-ancestor', r.liveSourceCommit, uiBaseline); git('merge-base', '--is-ancestor', reviewed, 'HEAD');
  const changed = [...new Set([...lines(git('diff', '--name-only', uiBaseline)), ...lines(git('ls-files', '--others', '--exclude-standard'))])]
    .filter(path => !/^docs\/ui-(quality|refinement|publication)-20261109\//.test(path) && path !== 'PUBLICATIE-ACTUEEL.md').sort();
  assert.deepEqual(changed, expected); assert.deepEqual(Object.keys(r.files).sort(), expected);
  for (const [path, hash] of Object.entries({...r.files, ...r.evidenceFiles})) assert.equal(sha(read(path)), hash, path);
  const runtime = expected.filter(path => /^(app|components|lib|public)\//.test(path));
  for (const path of runtime) assert.equal(sha(read(path)), sha(git('show', reviewed + ':' + path)), 'Reviewed runtime: ' + path);
  const floor = 'docs/appearance-floor-20261031/floor.json', update = 'docs/appearance-floor-20261031/approved-updates/ui-quality-20261109.json';
  const oldFloor = JSON.parse(git('show', uiBaseline + ':' + floor));
  assert.deepEqual(json(floor), {...oldFloor, approvedUpdates: [...oldFloor.approvedUpdates, update]});
  const appearance = json(update); assert.equal(appearance.userRequest, r.userRequest); assert(appearance.appearanceChangeApproved && appearance.publicationApproved);
  assert.deepEqual(Object.keys(appearance.files).sort(), runtime);
  for (const [path, hash] of Object.entries(appearance.files)) assert.equal(sha(read(path)), hash, path);
  const v = json(folder + 'verification.json');
  assert(v.reviewedRuntimeUnchanged && v.originalMediaByteIdentical && v.metadataPreserved && v.localHttpPassed && v.localUiPassed && v.noWorkflows && v.noPaidServices);
  const backup = json(folder + 'backup.json');
  assert(backup.driveId && backup.fullReadback && backup.zipIntegrity && backup.allSourceHashesMatch);
  assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
  return r;
}
export function readBeforeUi(path, release, read = readFileSync) {
  return release && Object.hasOwn(release.files, path) ? git('show', uiBaseline + ':' + path) : read(path);
}
