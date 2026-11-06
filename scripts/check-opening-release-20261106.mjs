import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const folder = 'docs/pr12-publication-20261106/';
const baseline = '78d139ae947e6a46dc3a0a06d4fc5c74fce2786d';
const candidate = '1e8e2db7dba93b25106e401accbef4a98f86d477';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort();
const roots = ["app", "components", "hooks", "data", "lib", "public", "scripts", "db", "drizzle", ".github", "AGENTS.md", "PUBLICATIE.md", "VORMGEVING-VASTGEZET.md", "docs/appearance-floor-20261031", "docs/KLINK-DOCENTHANDLEIDING.md", "vite.config.ts", "next.config.ts", "package.json", "package-lock.json", "wrangler.jsonc", "middleware.ts", "worker.ts", ".gitignore", "tsconfig.json"];
const expected = [
 "app/page.tsx",
 "components/product/alfa-c-dagelijks.tsx",
 "components/product/alfa-c-functioneel.tsx",
 "components/product/classroom-boundary.tsx",
 "components/product/learner-app.tsx",
 "components/product/learner-module-boundary.tsx",
 "components/product/learner-rounds-extra.ts",
 "components/product/learner-rounds.ts",
 "components/product/load-learner-rounds.ts",
 "components/product/load-practice-workspace.ts",
 "components/product/practice-chapters.tsx",
 "components/product/practice-workspace.tsx",
 "components/product/word-listening.tsx",
 "lib/alfa-c-audio.ts",
 "lib/alfa-c-dagelijks.ts",
 "lib/alfa-c-functioneel.ts",
 "lib/connected-content-data.ts",
 "lib/connected-content.ts",
 "lib/extended-practice.ts",
 "lib/group-practice.ts",
 "lib/imported-practice.ts",
 "package-lock.json",
 "package.json",
 "public/_headers",
 "scripts/check-concurrent-request-release-20261106.mjs",
 "scripts/check-opening-release-20261106.mjs",
 "scripts/compact-lexicon-module.mjs",
 "scripts/compare-deferred-audio-appearance.mjs",
 "scripts/compare-performance-appearance.mjs",
 "scripts/measure-browser-opening.mjs",
 "scripts/measure-cache-and-alfa-c.mjs",
 "scripts/measure-first-exercise.mjs",
 "scripts/measure-help-button-network.mjs",
 "scripts/measure-learner-reloads.mjs",
 "scripts/measure-network-origin.mjs",
 "scripts/measure-network-peaks.mjs",
 "scripts/measure-opening-cpu.mjs",
 "scripts/measure-staging-document-browser.mjs",
 "scripts/measure-staging-document-trial.mjs",
 "scripts/precompute-connected-content.mjs",
 "scripts/prepare-browser-opening-staging.mjs",
 "scripts/prepare-pr12-compression.mjs",
 "scripts/prepare-staging-document-trial.mjs",
 "scripts/profile-browser-opening.mjs",
 "scripts/sanitize-staging-document-tail.py",
 "scripts/serve-network-benchmark.mjs",
 "scripts/summarize-browser-opening.mjs",
 "scripts/summarize-split-download.mjs",
 "scripts/summarize-staging-document-trial.mjs",
 "scripts/summarize-total-download.mjs",
 "scripts/test-alfa-c-functioneel-browser.mjs",
 "scripts/test-alfa-c-functioneel.mjs",
 "scripts/test-alfa-c-readalong-browser.mjs",
 "scripts/test-alfa-c-support.mjs",
 "scripts/test-compact-lexicon-browser.mjs",
 "scripts/test-compact-lexicon-module.mjs",
 "scripts/test-deferred-alfa-c-audio.mjs",
 "scripts/test-deferred-bundle.mjs",
 "scripts/test-deferred-players-browser.mjs",
 "scripts/test-imported-alfa-c-recovery-20261031.mjs",
 "scripts/test-imported-pack-matching.mjs",
 "scripts/test-network-content-preservation.mjs",
 "scripts/test-network-entry-browser.mjs",
 "scripts/test-opening-content-preservation.mjs",
 "scripts/test-opening-loader-once-navigation-20261103.mjs",
 "scripts/test-opening-release-20261106.mjs",
 "scripts/test-pr12-compression-guard.mjs",
 "scripts/test-precomputed-connected-content.mjs",
 "scripts/test-prepared-pages.mjs",
 "scripts/test-quiet-controls-browser.mjs",
 "scripts/test-server-workspace-boundary.mjs",
 "scripts/test-source-repeat-browser-20261101.mjs",
 "scripts/test-split-practice-bundles.mjs",
 "scripts/test-static-cache-policy.mjs",
 "scripts/test-word-listening-browser.mjs",
 "tsconfig.json",
 "vite.config.ts"
];
export function verifyOpeningRelease(read = readFileSync) {
 const json = path => JSON.parse(read(path)), r = json(folder + 'approval.json');
 assert.equal(r.approvedBy, 'Nico'); assert.equal(r.publicationApproved, true); assert.equal(r.designChanged, false);
 assert.equal(r.userRequest, 'Neem aan dat alles online is, zorg dat alles online staat.');
 assert.equal(r.baselineSourceCommit, baseline); assert.equal(r.checkedCandidateCommit, candidate);
 git('merge-base', '--is-ancestor', baseline, 'HEAD'); git('merge-base', '--is-ancestor', candidate, 'HEAD');
 const changed = [...new Set([...lines(git('diff', '--name-only', baseline, '--', ...roots)), ...lines(git('ls-files', '--others', '--exclude-standard', '--', ...roots))])].sort();
 assert.deepEqual(changed, expected); assert.deepEqual(r.changedFiles, expected); assert.deepEqual(Object.keys(r.files).sort(), expected);
 for (const [path, hash] of Object.entries({...r.files, ...r.evidenceFiles})) assert.equal(sha(read(path)), hash, path);
 for (const path of expected.filter(p => /^(app|components|lib|public)\//.test(p) || ['vite.config.ts', 'tsconfig.json', 'package.json', 'package-lock.json'].includes(p))) assert.equal(sha(read(path)), sha(git('show', candidate + ':' + path)), path);
 assert.equal(git('diff', '--name-only', baseline, '--', 'data', 'db', 'drizzle', 'hooks', '.github', 'worker.ts', 'wrangler.jsonc', 'app/layout.tsx', 'app/globals.css', 'app/learner-layout.css', 'app/exercise-flow.css', 'docs/appearance-floor-20261031').toString().trim(), '');
 assert.deepEqual(lines(git('diff', '--name-only', baseline, '--', 'public')), ['public/_headers']);
 const live = json(folder + 'live-before.json'); assert.equal(live.sourceCommit, '7e87eca15c1e5d63fe2b68d6623d9cce0334bce2'); assert(live.sourceClean); assert.equal(live.branch, 'main');
 const config = json(folder + 'production-config-proof.json'); assert.equal(config.normalCommand, 'npm run deploy'); assert.equal(config.newMeteredServices, 0); assert.equal(config.extraWorkerFirstPaths, 0); assert.equal(config.compressionWrapperPublished, false); assert(config.databaseUnchanged && config.routesUnchanged && config.noMigrations);
 const quiet = json('docs/quiet-controls-speed-20261106/controls/checks.json'); assert.equal(quiet.checks.length, 8); assert(quiet.checks.every(c => c.controlsSilent && c.realTextAndExplicitAudioEnded)); assert.deepEqual(quiet.errors, []);
 const appearance = json(folder + 'appearance/comparison.json'); assert.equal(appearance.length, 32); assert(appearance.every(c => c.changedPixels === 0));
 const prepared = json(folder + 'prepared-pages.json'); assert(prepared.preservedAssets >= 20000 && prepared.assets <= 20000 && prepared.head);
 const speed = json(folder + 'normal-vs-live/visits.json'); assert.equal(speed.rows.length, 8); assert.deepEqual(speed.errors, []);
 assert(read(folder + 'unit-final.log').toString().includes('fail 0')); assert.equal(read(folder + 'types.log').toString().trim(), '');
 const backup = json(folder + 'backup.json'); assert(backup.driveId && backup.fullReadback && backup.allPayloadHashesMatch); assert.deepEqual(backup.files, r.files); assert.deepEqual(backup.evidenceFiles, r.evidenceFiles);
 return r;
}
export function readBeforeOpening(file, release, read = readFileSync) { return release.changedFiles.includes(file) ? git('show', release.baselineSourceCommit + ':' + file) : read(file); }
