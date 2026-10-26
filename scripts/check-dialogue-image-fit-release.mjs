import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, {maxBuffer: 32 * 1024 * 1024});
const evidence = 'docs/klink-dialogue-image-fit-20261025';
export const imageFitFiles = ['app/globals.css', 'scripts/check-dialogue-image-fit-release.mjs', 'scripts/check-dialogue-release.mjs', 'scripts/test-dialogue-image-fit-release.mjs', 'scripts/test-dialogue-image-fit-browser.mjs', 'scripts/test-publication-proof.mjs'];
export function verifyDialogueImageFitRelease(release = JSON.parse(readFileSync('docs/klink-owner-release-dialogue-image-fit-20261025.json')), readFile = readFileSync, sourceCommit) {
 assert.equal(release.approvedBy, 'Nico'); assert.equal(release.publicationApproved, true);
 assert.equal(release.userRequest, JSON.parse(readFile(`${evidence}/owner-request.json`)).userRequest);
 assert(release.userRequest.startsWith('Herstel dan ook meteen die mobiele weergave'));
 assert.equal(release.baselineSourceCommit, '7d1988e4ae8648da001bcf89b425d74668ddc576');
 assert.equal(release.liveSourceCommit, '4221681fda5449b66485e3d21b55893d9682b73e');
 assert.equal(release.previousAuthorization, 'docs/klink-owner-release-gesprekken-20261025.json');
 assert.equal(release.dialogues, 128); assert.equal(release.newImages, 0); assert.equal(release.newAudio, 0);
 git('merge-base', '--is-ancestor', release.liveSourceCommit, release.baselineSourceCommit);
 git('merge-base', '--is-ancestor', release.baselineSourceCommit, 'HEAD');
 assert.equal(sha(readFile(release.previousAuthorization)), sha(git('show', `${release.baselineSourceCommit}:${release.previousAuthorization}`)));
 const before = git('show', `${release.baselineSourceCommit}:app/globals.css`).toString();
 const expected = before.replace('.cp-dialogue-scene > img { width: 100%; max-height: 280px; object-fit: cover; border: 0; }', '.cp-dialogue-scene > img { width: 100%; height: auto; max-height: none; object-fit: contain; border: 0; }').replace(' .cp-dialogue-scene > img { max-height: 170px; }', '');
 assert.notEqual(expected, before);
 assert.equal(readFile('app/globals.css').toString(), expected, 'Only the full-photo sizing correction is authorized');
 const roots = ['app', 'components', 'hooks', 'data', 'lib', 'public'];
 const changed = git('diff', '--name-only', release.baselineSourceCommit, ...(sourceCommit ? [sourceCommit] : []), '--', ...roots).toString().trim().split('\n').filter(Boolean);
 const untracked = sourceCommit ? [] : git('ls-files', '--others', '--exclude-standard', '--', ...roots).toString().trim().split('\n').filter(Boolean);
 assert.deepEqual([...new Set([...changed, ...untracked])], ['app/globals.css']);
 const required = [...imageFitFiles, ...['owner-request', 'live-baseline', 'review', 'source-manifest', 'source-drive-verification'].map(name => `${evidence}/${name}.json`)];
 assert.deepEqual(Object.keys(release.files).sort(), required.sort());
 for (const [file, hash] of Object.entries(release.files)) assert.equal(sha(readFile(file)), hash, file);
 const manifest = JSON.parse(readFile(`${evidence}/source-manifest.json`));
 for (const row of manifest) assert.equal(row.sha256, release.files[row.path]);
 assert.deepEqual(manifest.map(row => row.path), [...imageFitFiles, ...['owner-request', 'live-baseline', 'review'].map(name => `${evidence}/${name}.json`)]);
 const review = JSON.parse(readFile(`${evidence}/review.json`));
 assert.equal(review.status, 'passed-local'); assert.equal(review.allDialogueRoutes, 128);
 for (const key of ['naturalImageRatio', 'noImageCropping', 'controlsReachable', 'sourceAndMediaPreserved', 'buildPassed', 'typesPassed', 'lintPassed']) assert.equal(review[key], true, key);
 const backup = JSON.parse(readFile(`${evidence}/source-drive-verification.json`));
 assert(backup.parentVerified && backup.downloadedByteIdentical && backup.zipCrcVerified);
 assert.equal(backup.manifestEntriesVerified, manifest.length);
 return release;
}
export function readBeforeDialogueImageFit(file, release, readFile = readFileSync) {
 return release.files[file] ? git('show', `${release.baselineSourceCommit}:${file}`) : readFile(file);
}
