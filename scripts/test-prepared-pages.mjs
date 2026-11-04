import assert from 'node:assert/strict';
import { globSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import ignore from 'ignore';

const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const baseline = process.env.KLINK_NETWORK_BASELINE_BUILD;
assert(baseline, 'Preserved baseline build required');
const manifest = JSON.parse(readFileSync('dist/server/vinext-prerender.json'));
const rendered = manifest.routes.filter(route => route.status === 'rendered').map(route => route.path ?? route.route).sort();
assert.deepEqual(rendered, ['/', '/404', '/docenten', '/proef-alfa-c']);
assert(manifest.routes.filter(route => route.route.startsWith('/api/')).every(route => route.status === 'skipped'));
const config = JSON.parse(readFileSync('dist/server/wrangler.json'));
assert.equal(config.assets.binding, 'ASSETS');
assert.equal(config.d1_databases[0].database_id, '0e67ae90-83e1-4506-af60-287a40bf08ef');
assert.equal(config.kv_namespaces.length + config.durable_objects.bindings.length, 0);
const ignored = ignore().add(['/.assetsignore', '/_headers', '/_redirects']).add(readFileSync('dist/client/.assetsignore', 'utf8'));
const files = globSync('**/*', { cwd: 'dist/client', dot: true }).filter(p => statSync('dist/client/' + p).isFile() && !ignored.ignores(p));
assert(files.length <= 20000, `Asset budget exceeded: ${files.length}`);
let preservedAssets = 0;
for (const path of globSync('**/*', { cwd: baseline + '/client', dot: true })) {
  if (!statSync(baseline + '/client/' + path).isFile() || path.startsWith('_next/') || ['release.json', 'vinext-client-entry-manifest.json'].includes(path)) continue;
  const hash = root => createHash('sha256').update(readFileSync(root + '/client/' + path)).digest('hex');
  assert.equal(hash('dist'), hash(baseline), `Changed existing content/media: ${path}`);
  preservedAssets++;
}
const checks = [];
for (const path of ['/', '/docenten', '/proef-alfa-c', '/docenten/hoofdstuk-5', '/missing-document-wait-test']) {
  for (const options of [{}, { headers: { cookie: 'klink_test=synthetic-only', authorization: 'Bearer synthetic-test' } }]) {
    const response = await fetch(base + path, options);
    const body = await response.text();
    assert.equal(response.status, path.startsWith('/missing') ? 404 : 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert(!body.includes('synthetic-test') && !body.includes('synthetic-only'));
    if (['/', '/docenten', '/proef-alfa-c'].includes(path)) {
      assert.equal(response.headers.get('x-vinext-cache'), 'HIT');
      assert(body.includes(manifest.buildId), 'Prepared response must belong to this build');
      assert.equal(body, readFileSync('dist/server/prerendered-routes/' + (path === '/' ? 'index' : path.slice(1)) + '.html', 'utf8'));
    }
    checks.push({ path, syntheticCredentials: !!options.headers, status: response.status, cache: response.headers.get('x-vinext-cache') });
  }
}
for (const path of ['/', '/docenten', '/proef-alfa-c']) {
  const rsc = await fetch(base + path + '?_rsc=synthetic', { headers: { RSC: '1' } });
  assert.equal(rsc.status, 200);
  assert.match(rsc.headers.get('content-type'), /text\/x-component/);
  assert(!(await rsc.text()).startsWith('<!DOCTYPE'));
  const query = await fetch(base + path + '?diagnostic=synthetic');
  assert.equal(query.status, 200);
  assert.match(query.headers.get('content-type'), /text\/html/);
  checks.push({ path, rscAndQuery: true });
}
for (const path of ['/api/attempts', '/api/review-items']) for (const method of ['GET', 'POST']) {
  const response = await fetch(base + path, { method });
  assert.equal(response.status, 410);
  assert.notEqual(response.headers.get('x-vinext-cache'), 'HIT');
  checks.push({ path, method, status: response.status });
}
const head = await fetch(base + '/', { method: 'HEAD' });
assert.equal(head.status, 200);
assert.equal(await head.text(), '');
writeFileSync('docs/document-wait-20261104/prepared-pages.json', JSON.stringify({ rendered, buildId: manifest.buildId, assets: files.length, preservedAssets, checks, head: true }, null, 2));
console.log(`PASS prepared pages: ${checks.length + 1} request checks; ${preservedAssets} existing assets byte-identical; ${files.length}/20000 assets`);
