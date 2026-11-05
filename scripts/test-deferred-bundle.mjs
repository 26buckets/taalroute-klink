import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { globSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { chromium, webkit } from 'playwright';
import ignore from 'ignore';
import postcss from 'postcss';

const before = process.argv[2];
assert(before, 'Pass the preserved preceding staging build');
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:19120';
const out = process.env.KLINK_DEFERRED_BUNDLE_OUTPUT || 'docs/total-download-20261105/bundle-checks';
mkdirSync(out, { recursive: true });
const hash = value => createHash('sha256').update(value).digest('hex');
const files = root => globSync('**/*', { cwd: root, dot: true }).filter(file => statSync(`${root}/${file}`).isFile());
const client = files('dist/client');
for (const file of client.filter(file => /\/(?:framework|vinext)-[^/]+\.js$/.test(file))) {
  assert(!/\bfrom["'`]\.\/(?:shared-ui|route-settings|learner-app|practice-(?:word|source)-bank)-/.test(readFileSync('dist/client/' + file, 'utf8')), 'Framework helpers must not depend on application/data initialization');
}
const ignored = ignore().add(['/.assetsignore', '/_headers', '/_redirects']).add(readFileSync('dist/client/.assetsignore', 'utf8'));
const assets = client.filter(file => !ignored.ignores(file)).length;
assert(assets <= 20000, 'Keep the existing asset ceiling');
// Splitting changes stylesheet boundaries; retain every declaration and its selector/layer.
const css = root => files(root).filter(file => file.endsWith('.css')).flatMap(file => {
  const rows = [];
  postcss.parse(readFileSync(`${root}/${file}`, 'utf8')).walkDecls(declaration => {
    const parents = [];
    for (let parent = declaration.parent; parent?.type !== 'root'; parent = parent.parent) parents.unshift(parent.type === 'rule' ? parent.selector : `${parent.name} ${parent.params}`);
    rows.push(JSON.stringify([parents, declaration.prop, declaration.value, Boolean(declaration.important)]));
  });
  return rows;
}).sort();
assert.deepEqual(css('dist/client'), css(`${before}/client`), 'Every stylesheet declaration and selector remains unchanged');
const sources = {
  'practice-source-bank': ['klink-imported-practice.json', 'klink-word-use-self.json'],
  'practice-word-bank': ['klink-curriculum.json', 'klink-lexicon-wordbuild-rest.json', 'klink-lexicon-wordbuild-20.json', 'klink-media.json'],
};
const banks = Object.entries(sources).map(([name, sources]) => {
  const matches = client.filter(file => new RegExp(`/` + name + '-[^/]+\\.js$').test(file));
  assert.equal(matches.length, 1);
  return { name, url: '/' + matches[0], sources: sources.map(file => ({ file, sha256: hash(JSON.stringify(JSON.parse(readFileSync('data/' + file, 'utf8')))) })) };
});
const rows = [], errors = [];
for (const [engine, type] of Object.entries({ chromium, webkit })) {
  const browser = await type.launch();
  try {
    const page = await browser.newPage();
    page.on('pageerror', error => errors.push({ engine, message: error.message }));
    const requests = [];
    page.on('request', request => requests.push(new URL(request.url()).pathname));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Start met oefenen', exact: true }).waitFor();
    assert(!requests.some(path => /(?:practice-source-bank|practice-word-bank|klink-word-library-index)-/.test(path)), 'Landing must not download exercise banks or the word library');
    for (const bank of banks) {
      const exported = await page.evaluate(async url => {
        const loaded = await import(url);
        const hashes = [];
        for (const value of Object.values(loaded)) {
          const json = JSON.stringify(value);
          if (json === undefined) continue;
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
          hashes.push([...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join(''));
        }
        return hashes;
      }, bank.url);
      assert(!requests.some(path => /(?:route-settings|learner-app|staff-apps|teacher-classroom)-/.test(path)), 'Data banks must load independently without a circular workspace dependency');
      for (const source of bank.sources) {
        assert(exported.includes(source.sha256), `${engine}: full source, field order and answers must match ${source.file}`);
        rows.push({ engine, bank: bank.name, ...source });
      }
    }
  } finally { await browser.close(); }
}
assert.deepEqual(errors, []);
writeFileSync(out + '/checks.json', JSON.stringify({ assets, rows, errors, cssDeclarationsUnchanged: true, landingDefersBanks: true }, null, 2) + '\n');
console.log(`PASS ${rows.length} complete compiled-bank hashes; all CSS declarations preserved; ${assets}/20000 assets; no eager exercise bank on landing`);
