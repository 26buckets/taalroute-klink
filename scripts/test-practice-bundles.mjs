import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {productionIndex, productionAssetUrl, validateProductionCollection} from '../lib/production-practice.ts';
import {practiceBundleResponse} from '../lib/practice-bundle-response.ts';
import {readProductionBank} from './read-production-bank.mjs';
import {assetLevel, countAssets} from './check-asset-limit.mjs';
const delivery = JSON.parse(readFileSync('data/klink-practice-delivery.json'));
const sources = productionIndex.filter(row => row.url.startsWith('/practice-content/') && !row.bundleUrl);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const assets = {fetch: async url => new Response(readFileSync('public' + new URL(url).pathname))};

await test('All sources are byte-identical, retain IDs/counts/answers/media, and fit bounded immutable bundles', () => {
  assert.equal(sources.length, 1720); assert.equal(Object.keys(delivery).length, sources.length);
  const bundles = new Map();
  for (const row of sources) {
    const entry = delivery[row.url]; assert.equal(entry.id, row.id);
    const bytes = readFileSync('public' + entry.bundleUrl);
    assert(bytes.length <= 1024 * 1024); assert(entry.bundleUrl.endsWith('/' + sha(bytes) + '.json'));
    if (!bundles.has(entry.bundleUrl)) bundles.set(entry.bundleUrl, JSON.parse(bytes));
    const bundle = bundles.get(entry.bundleUrl), source = readFileSync('public' + row.url);
    assert(Buffer.from(bundle.banks[row.id]).equals(source), row.id);
    assert.deepEqual(validateProductionCollection(bundle, row.id, row.count), validateProductionCollection(JSON.parse(source), row.id, row.count));
    assert.equal(productionAssetUrl(row.url), entry.bundleUrl);
  }
  assert.equal(bundles.size, 113);
  for (const row of productionIndex) assert.equal(readProductionBank(row).exercises.length, row.count);
  for (const row of productionIndex.filter(row => !Object.hasOwn(delivery, row.url))) assert.equal(productionAssetUrl(row.url), row.bundleUrl || row.url);
  assert.equal(productionAssetUrl('/unknown.json'), '/unknown.json');
  execFileSync(process.execPath, ['scripts/build-practice-bundles.mjs', '--check']);
});

await test('Every old URL returns its exact original bytes, including query strings', async () => {
  for (const row of sources) {
    const response = await practiceBundleResponse(new Request('https://klink.test' + row.url + '?old=1'), assets);
    assert.equal(response.status, 200, row.url);
    assert(Buffer.from(await response.arrayBuffer()).equals(readFileSync('public' + row.url)), row.id);
  }
});

await test('Old URL headers, conditional requests, ranges, unknown URLs and failed/corrupt bundles', async () => {
  const row = sources[0], url = 'https://klink.test' + row.url;
  const bytes = readFileSync('public' + row.url), etag = '"' + sha(bytes) + '"';
  assert.equal((await practiceBundleResponse(new Request(url, {method: 'POST'}), assets)).status, 405);
  const head = await practiceBundleResponse(new Request(url, {method: 'HEAD'}), assets);
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  assert.equal(head.headers.get('Content-Length'), String(bytes.length));
  assert.equal(head.headers.get('ETag'), etag); assert.match(head.headers.get('Content-Type'), /application\/json/);
  for (const tag of [etag, `W/${etag}`, '*', `"other", ${etag}`]) {
    const response = await practiceBundleResponse(new Request(url, {headers: {'If-None-Match': tag}}), assets);
    assert.equal(response.status, 304); assert.equal(await response.text(), '');
  }
  // Match the static asset host: a Range request still receives the whole JSON.
  const range = await practiceBundleResponse(new Request(url, {headers: {Range: 'bytes=0-9', 'If-None-Match': '"old"'}}), assets);
  assert.equal(range.status, 200); assert(Buffer.from(await range.arrayBuffer()).equals(bytes));
  for (const path of ['/practice-content/missing.json', '/practice-content/__proto__', '/practice-content/constructor']) {
    assert.equal((await practiceBundleResponse(new Request('https://klink.test' + path), {fetch: () => assert.fail('Unknown path must not fetch')})).status, 404);
  }
  for (const fetch of [async () => new Response('', {status: 404}), async () => new Response('invalid'), async () => new Response('{"bundleType":"wrong","banks":{}}'), async () => {throw new Error('offline');}]) {
    const response = await practiceBundleResponse(new Request(url), {fetch});
    assert.equal(response.status, 503); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal((await practiceBundleResponse(new Request(url), assets)).status, 200);
});

await test('Asset warning thresholds and counting match deployment exclusions (including nested files and negations)', () => {
  for (const [count, level] of [[17999,'ok'], [18000,'warning'], [19999,'warning'], [20000,'warning'], [20001,'error']]) assert.equal(assetLevel(count), level);
  const root = mkdtempSync(join(tmpdir(), 'klink-assets-'));
  try {
    mkdirSync(root + '/nested'); mkdirSync(root + '/ignored');
    for (const path of ['visible.json','nested/a.json','ignored/a.json','ignored/keep.json','_headers','_redirects']) writeFileSync(root + '/' + path, '{}');
    writeFileSync(root + '/.assetsignore', '# test\n/ignored/*\n!/ignored/keep.json\n/nested/a.json\n');
    assert.equal(countAssets(root), 2);
  } finally {rmSync(root, {recursive: true});}
});
