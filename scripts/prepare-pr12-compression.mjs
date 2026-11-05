// Serve pre-compressed, byte-identical modules on the isolated PR 12 candidate only.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { brotliCompressSync, brotliDecompressSync, constants } from 'node:zlib';

const [rootArg, evidence] = process.argv.slice(2);
assert(rootArg && evidence, 'Usage: node scripts/prepare-pr12-compression.mjs <build-root> <evidence.json>');
const root = resolve(rootArg);
const staging = JSON.parse(readFileSync(root + '/server/pr12-staging.wrangler.json'));
assert.equal(staging.name, 'klink-pr12-candidate');
assert.equal(staging.workers_dev, true);
assert.equal(staging.preview_urls, false);
assert.deepEqual(staging.routes, []);
assert.deepEqual(staging.assets, { directory: root + '/client', binding: 'ASSETS' });
assert.equal(staging.main, root + '/server/index.js');
assert.deepEqual(Object.keys(staging).sort(), ['assets', 'compatibility_date', 'compatibility_flags', 'main', 'name', 'no_bundle', 'observability', 'preview_urls', 'routes', 'rules', 'vars', 'workers_dev']);
const manifest = JSON.parse(readFileSync(root + '/client/.vite/manifest.json'));
const names = ['shared-ui', 'route-settings', 'practice-word-bank', 'practice-source-bank'];
const sha256 = value => createHash('sha256').update(value).digest('hex');
const files = names.map((name, i) => {
  const candidates = Object.values(manifest).filter(entry => entry.name === name);
  assert.equal(candidates.length, 1, name);
  const file = candidates[0].file;
  assert.match(file, /^_next\/static\/chunks\/[A-Za-z0-9_-]+\.js$/);
  const body = readFileSync(root + '/client/' + file);
  const compressed = brotliCompressSync(body, { params: {
    [constants.BROTLI_PARAM_QUALITY]: 11,
    [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
  } });
  assert(compressed.length < body.length);
  assert(brotliDecompressSync(compressed).equals(body));
  const module = `./pr12-${i}.br`;
  writeFileSync(root + '/server/' + module, compressed);
  return { path: '/' + file, module, originalBytes: body.length, compressedBytes: compressed.length, sha256: sha256(body) };
});
const imports = files.map(({ module }, i) => `import m${i} from ${JSON.stringify(module)};`).join('\n');
const entries = files.map(({ path, sha256 }, i) => `[${JSON.stringify(path)}, {body:m${i}, etag:'"br-${sha256}"'}]`).join(',\n');
const worker = `import app from './index.js';
${imports}
const assets = new Map([${entries}]);
export default {
  fetch(request, env, ctx) {
    const asset = assets.get(new URL(request.url).pathname);
    if (!asset) return app.fetch(request, env, ctx);
    const accepted = request.cf?.clientAcceptEncoding ?? request.headers.get('Accept-Encoding') ?? '';
    const brotli = accepted.split(',').some(coding => {
      const [name, ...params] = coding.trim().toLowerCase().split(';');
      return name.trim() === 'br' && !params.some(param => /^\\s*q\\s*=\\s*0(?:\\.0*)?\\s*$/.test(param));
    });
    if (!brotli || !['GET', 'HEAD'].includes(request.method) || ['range', 'if-match', 'if-unmodified-since'].some(header => request.headers.has(header))) {
      return env.ASSETS.fetch(request);
    }
    const headers = {
      'Cache-Control': 'public, max-age=31536000, immutable, no-transform',
      'Content-Encoding': 'br',
      'Content-Type': 'text/javascript',
      'ETag': asset.etag,
      'Vary': 'Accept-Encoding',
      'X-Klink-Compression': 'prebuilt-br',
    };
    const fresh = request.headers.get('If-None-Match')?.split(',').some(tag => tag.trim() === '*' || tag.trim().replace(/^W\\//, '') === asset.etag);
    if (fresh) return new Response(null, { status: 304, headers, encodeBody: 'manual' });
    return new Response(request.method === 'HEAD' ? null : asset.body, { headers, encodeBody: 'manual' });
  },
};
`;
writeFileSync(root + '/server/pr12-compression.js', worker);
const config = {
  ...staging,
  main: root + '/server/pr12-compression.js',
  assets: { ...staging.assets, run_worker_first: files.map(file => file.path) },
  rules: [{ type: 'Data', globs: ['pr12-*.br'] }, ...staging.rules],
  vars: { ...staging.vars, KLINK_STAGING_ROUND: 'pr12-tail-compression' },
};
writeFileSync(root + '/server/pr12-compression.wrangler.json', JSON.stringify(config, null, 2) + '\n');
writeFileSync(evidence, JSON.stringify({ files }, null, 2) + '\n');
