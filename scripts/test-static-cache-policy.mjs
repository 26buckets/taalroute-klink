import assert from 'node:assert/strict';
import { globSync, readFileSync, statSync } from 'node:fs';

const before = process.argv[2];
assert(before, 'Pass the preserved build before the cache-policy change');
const expected = readFileSync(`${before}/client/_headers`, 'utf8').trimEnd() + '\n\n/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable\n';
assert.equal(readFileSync('public/_headers', 'utf8'), expected);
assert.equal(readFileSync('dist/client/_headers', 'utf8'), expected);
const paths = globSync('_next/static/**/*', { cwd: 'dist/client' }).filter(path => statSync(`dist/client/${path}`).isFile());
assert(paths.length > 0);
for (const path of paths) {
  assert(/[-.][A-Za-z0-9_-]{8,}\.(?:js|css|woff2)$/.test(path) || /^_next\/static\/[0-9a-f-]{36}\/_(?:ssg|build)Manifest\.js$/.test(path), `Immutable URL must contain a content hash or build ID: ${path}`);
}
const base = process.env.KLINK_TEST_URL;
if (base) {
  const script = paths.find(path => /route-settings-.*\.js$/.test(path));
  assert(script);
  const asset = await fetch(`${base}/${script}`, { method: 'HEAD' });
  assert.equal(asset.status, 200);
  assert.equal(asset.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  for (const path of ['/', '/release.json', '/api/attempts']) {
    const response = await fetch(base + path, { method: 'HEAD' });
    assert(!/immutable|max-age=31536000/.test(response.headers.get('cache-control') || ''), `Do not freeze ${path}`);
  }
}
console.log(`PASS ${paths.length} versioned static URLs; existing policy preserved; no HTML/API cache extension`);
