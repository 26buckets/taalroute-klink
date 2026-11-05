// Isolated, database-free A/B trial; never prepares a production deployment.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, globSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import ignore from 'ignore';

const [candidateCommit, baselineCommit = 'c266bef2739509be3dc08d606a461fc978d6c759', evidenceDir = 'docs/browser-opening-wait-20261105'] = process.argv.slice(2);
assert(/^[a-f0-9]{40}$/.test(candidateCommit), 'Supply the reviewed runtime commit');
assert(/^[a-f0-9]{40}$/.test(baselineCommit), 'Supply the preserved runtime commit');
const round = evidenceDir.split('/').at(-1);
const builds = [
  ['baseline', process.env.KLINK_STAGING_BASELINE_ROOT, baselineCommit],
  ['candidate', 'dist', candidateCommit],
];
const prepared = builds.map(([version, root, commit]) => {
  assert(root, 'Set KLINK_STAGING_BASELINE_ROOT to the preserved previous clean staging build');
  root = resolve(root);
  const release = JSON.parse(readFileSync(root + '/client/release.json'));
  assert.equal(release.sourceCommit, commit);
  assert.equal(release.sourceClean, true);
  const original = JSON.parse(readFileSync(root + '/server/wrangler.json'));
  assert.equal(original.name, 'taalroute-klink');
  const ignored = ignore().add(['/.assetsignore', '/_headers', '/_redirects']).add(readFileSync(root + '/client/.assetsignore', 'utf8'));
  const files = globSync('**/*', { cwd: root + '/client', dot: true }).filter(path => statSync(root + '/client/' + path).isFile() && !ignored.ignores(path));
  assert(files.length <= 20000, 'Existing asset limit must not be raised');
  const config = {
    name: `klink-pr12-${version}`,
    main: root + '/server/index.js',
    compatibility_date: original.compatibility_date,
    compatibility_flags: original.compatibility_flags,
    no_bundle: true,
    rules: original.rules,
    assets: { directory: root + '/client', binding: 'ASSETS' },
    workers_dev: true,
    preview_urls: false,
    routes: [],
    observability: { enabled: true },
    vars: { KLINK_STAGING_ROUND: round },
  };
  assert(['klink-pr12-baseline', 'klink-pr12-candidate'].includes(config.name));
  assert(!Object.keys(config).some(key => /database|namespace|service|secret|bucket|domain/.test(key)));
  return { version, root, commit, round, assets: files.length, config, configSha256: createHash('sha256').update(JSON.stringify(config, null, 2) + '\n').digest('hex') };
});
for (const row of prepared) writeFileSync(row.root + '/server/pr12-staging.wrangler.json', JSON.stringify(row.config, null, 2) + '\n');
writeFileSync(`${evidenceDir}/staging-config.json`, JSON.stringify(prepared, null, 2) + '\n');
console.log(prepared.map(row => `${row.config.name}: ${row.assets} assets, ${row.commit}, round ${round}, no database or custom routes`).join('\n'));
