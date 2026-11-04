import assert from 'node:assert/strict';
import { globSync, readFileSync, writeFileSync } from 'node:fs';
import { Miniflare } from 'miniflare';

const baseline = process.env.KLINK_NETWORK_BASELINE_BUILD;
assert(baseline, 'Preserved baseline build required');
const rows = [];
for (let repeat = 0; repeat < 6; repeat++) {
  const builds = [['before', baseline], ['after', 'dist']];
  for (const [version, root] of repeat % 2 ? builds.reverse() : builds) {
    const modules = ['index.js', ...globSync('**/*.js', { cwd: root + '/server' }).filter(p => p !== 'index.js')].map(path => ({ type: 'ESModule', path, contents: readFileSync(root + '/server/' + path, 'utf8') }));
    const start = performance.now();
    const worker = new Miniflare({ modules, modulesRoot: '/', modulesRules: [{ type: 'ESModule', include: ['**/*.js'], fallthrough: true }], compatibilityDate: '2026-05-15', compatibilityFlags: ['nodejs_compat'], assets: { binding: 'ASSETS', directory: root + '/client', routerConfig: { has_user_worker: true } }, d1Databases: ['DB'], host: '127.0.0.1', port: 0 });
    try {
      await worker.ready;
      const initializedMs = performance.now() - start;
      for (const visit of ['first', 'repeat']) {
        const request = performance.now();
        const response = await worker.dispatchFetch('http://localhost/');
        const ttfbMs = performance.now() - request;
        assert.equal(response.status, 200);
        if (version === 'after') assert.equal(response.headers.get('x-vinext-cache'), 'HIT', 'Every new instance must use the prepared page');
        assert((await response.text()).includes('Klink'));
        rows.push({ version, repeat, visit, cache: response.headers.get('x-vinext-cache'), initializedMs, ttfbMs, completeMs: performance.now() - request });
      }
    } finally { await worker.dispose(); }
  }
}
writeFileSync(process.env.KLINK_NETWORK_ORIGIN_OUTPUT || 'docs/network-peaks-20261104/origin.json', JSON.stringify({ conditions: 'fresh local Miniflare instance per version/repetition; no external network; first and repeated anonymous HTML GET; initialization includes local harness overhead, not a production cold-start estimate', rows }, null, 2));
console.log(`PASS ${rows.length} isolated first/repeat HTML checks`);
