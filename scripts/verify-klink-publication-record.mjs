// Combine the original publication record with a fresh read of the live Worker.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const archive = process.argv[2];
if (!archive) throw Error('Pass the original publication-audit archive.');
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fromArchive = path => execFileSync('tar', ['-xOf', archive, path]);
const reportBytes = fromArchive('outputs/Taalroute-audio-merkherstel-20261014.json');
const deploymentBytes = fromArchive('work/final-deployments.json');
const logBytes = fromArchive('work/deploy-klink.log');
const report = JSON.parse(reportBytes);
const deployment = JSON.parse(deploymentBytes)['deploy-klink'];
const entry = report.repos.find(item => item.repo === 'taalroute-klink');
const readiness = JSON.parse(readFileSync('data/klink-release-readiness.json'));
const live = JSON.parse(readFileSync('work/live-proof/download-manifest.json'));
assert.equal(entry.commit, readiness.baseline.sourceCommit);
assert.deepEqual(deployment.versions, [readiness.baseline.liveWorkerVersion]);
assert(logBytes.toString().includes(`Current Version ID: ${live.version}`));
assert.equal(live.version, readiness.baseline.liveWorkerVersion);
assert(live.activeDeployment.versions.some(item => item.version_id === live.version && item.percentage === 100));
assert(live.modules.some(item => item.name === 'ssr/index.js'));
// Re-read the public client module too; an old local download is not live evidence.
const pageResponse = await fetch('https://klink.taalroute.nl/', { cache: 'no-store' });
assert(pageResponse.ok, 'Live page is unavailable');
const html = await pageResponse.text();
const clientPaths = [...new Set(html.match(/\/_next\/static\/chunks\/page-[A-Za-z0-9_-]+\.js/g) || [])];
assert.equal(clientPaths.length, 1, 'Identify the live application chunk before continuing');
const clientResponse = await fetch(new URL(clientPaths[0], 'https://klink.taalroute.nl'), { cache: 'no-store' });
assert(clientResponse.ok, 'Live client module is unavailable');
const client = Buffer.from(await clientResponse.arrayBuffer());
assert.equal(sha(client), sha(readFileSync('work/live-page.js')), 'The public client application has changed');
execFileSync('git', ['merge-base', '--is-ancestor', entry.commit, 'HEAD']);
// This existing check compares actual application code and both original API routes.
execFileSync(process.execPath, ['scripts/verify-klink-baseline.mjs'], { stdio: 'pipe' });
const code = JSON.parse(readFileSync('outputs/media-connection/baseline-evidence.json'));
assert(code.clientPageScopedAstEqual);
for (const file of ['page-BpudT-XI.js', 'route-CYFw3Xt7.js', 'route-D2Vxntf3.js']) {
  const expected = code.exactModuleMatches.find(item => item.file === file);
  assert(expected, `Missing previous application module: ${file}`);
  assert(live.modules.some(item => item.sha256 === expected.sha256), `Fresh deployed module differs: ${file}`);
}
const evidence = {
  verifiedAt: new Date().toISOString(), sourceCommit: entry.commit, liveWorkerVersion: live.version,
  sourceCommitDocumented: true,
  basis: 'Original archived release report names the Klink commit; its deployment log and final deployment record name the still-active version. Fresh Worker application/API modules and the freshly fetched public client application agree.',
  freshClientPath: clientPaths[0], freshClientSha256: sha(client),
  originalArchiveSha256: sha(readFileSync(archive)), reportSha256: sha(reportBytes), deploymentRecordSha256: sha(deploymentBytes), deploymentLogSha256: sha(logBytes),
  freshWorkerManifestSha256: sha(readFileSync('work/live-proof/download-manifest.json')),
  freshWorkerModuleCount: live.modules.length,
  normalizedClientPageSha256: code.normalizedClientPageSha256,
  limitation: 'Historical publication provenance is documented. A bit-identical reproduction of every generated runtime/build ID is not claimed. Media approval remains separate.',
};
mkdirSync('outputs/media-completion-20261016', { recursive: true });
writeFileSync('outputs/media-completion-20261016/publication-record-check.json', JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({ sourceCommit: entry.commit, liveWorkerVersion: live.version, publicationRecordVerified: true, mediaApproved: false }));
