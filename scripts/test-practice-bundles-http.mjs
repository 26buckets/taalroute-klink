import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {relative, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import ignore from 'ignore';
const base = process.env.KLINK_TEST_BASE || 'http://127.0.0.1:19128';
assert(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local test only');
const out = process.env.KLINK_TEST_OUTPUT || 'outputs/practice-bundles-20261106';
const before = 'outputs/practice-bundles-20261106/baseline-dist/client';
const matcher = ignore().add(['/.assetsignore', '/_headers', '/_redirects', ...readFileSync(before + '/.assetsignore', 'utf8').split('\n')]);
const paths = readdirSync(before, {recursive:true, withFileTypes:true}).filter(f => f.isFile()).map(f => relative(resolve(before), resolve(f.parentPath,f.name))).filter(p => !matcher.ignores(p) && p !== 'release.json' && existsSync('public/' + p));
const delivery = JSON.parse(readFileSync('data/klink-practice-delivery.json'));
const bundles = [...new Set(Object.values(delivery).map(e => e.bundleUrl))];
const api = JSON.parse(readFileSync('data/klink-grammar-aa-assets.json'));
const checks = [], sha = bytes => createHash('sha256').update(bytes).digest('hex');
const jobs = [...paths.map(path => ({path: '/' + path, file:'public/' + path})), ...bundles.map(path => ({path, file:'public' + path})), ...Object.entries(api).map(([name,e]) => ({path: '/api/grammar-aa-assets/' + name, body:e.body}))];
let next=0;
try {
  await Promise.all(Array.from({length:6}, async () => {
    while (next < jobs.length) {
      const job = jobs[next++], {path} = job;
      const bytes = job.file ? readFileSync(job.file) : Buffer.from(job.body,'base64');
      const response = await fetch(base + path);
      assert.equal(response.status,200,path);
      const actual = Buffer.from(await response.arrayBuffer());
      assert(actual.equals(bytes),path);
      checks.push({path,bytes:bytes.length,sha256:sha(actual)});
      if(checks.length%2000===0)console.log('Verified',checks.length);
    }
  }));
  const url = Object.keys(delivery)[0], original = readFileSync('public' + url);
  const head = await fetch(base + url,{method:'HEAD'}); assert.equal(head.status,200);
  assert.equal(Number(head.headers.get('Content-Length')),original.length);
  const cached = await fetch(base + url,{headers:{'If-None-Match':head.headers.get('ETag')}});assert.equal(cached.status,304);
  assert.equal((await fetch(base + url,{method:'POST'})).status,405);
  assert.equal((await fetch(base + '/practice-content/unknown-bank.json')).status,404);
  const sourceOnly = JSON.parse(readFileSync('data/klink-production-index.json')).find(r=>r.bundleUrl);
  assert.equal((await fetch(base + sourceOnly.url)).status,404,'Previously excluded original must remain excluded');
  console.log('PASS',paths.length,'existing assets,',bundles.length,'bundles and',Object.keys(api).length,'API files: exact bytes; HEAD/304/405/404 verified.');
} finally {
  mkdirSync(out,{recursive:true}); writeFileSync(out + '/http.json',JSON.stringify({base,expected:jobs.length,verified:checks.length,checks},null,2)+'\n');
}
