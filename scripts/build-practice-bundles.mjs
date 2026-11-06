import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync} from 'node:fs';
import {dirname} from 'node:path';

const check = process.argv.includes('--check');
const folder = 'public/practice-content/bundled-rounds';
const marker = '# Generated practice bundles: original files remain in the source and at their old URLs.\n';
const index = JSON.parse(readFileSync('data/klink-production-index.json'));
const groups = new Map(), delivery = {}, files = new Map();
const limit = 1024 * 1024;
for (const row of index.filter(row => row.url.startsWith('/practice-content/') && !row.bundleUrl)) {
  assert(/^\/practice-content\/[a-zA-Z0-9_./-]+\.json$/.test(row.url) && !row.url.includes('..'));
  const bytes = readFileSync('public' + row.url), text = bytes.toString('utf8'), bank = JSON.parse(text);
  assert(Buffer.from(text).equals(bytes), 'Source must round-trip without byte changes');
  assert.equal(bank.id, row.id); assert.equal(bank.exercises.length, row.count);
  const key = dirname(row.url) + '/' + row.level;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({row, text});
}
const encode = banks => JSON.stringify({bundleType: 'klink-production-rounds-v1', banks});
function save(banks, rows) {
  if (!rows.length) return;
  const bytes = Buffer.from(encode(banks));
  assert(bytes.length <= limit, 'Practice bundle exceeds 1 MiB');
  const name = createHash('sha256').update(bytes).digest('hex') + '.json';
  files.set(name, bytes);
  for (const row of rows) {
    assert(!Object.hasOwn(delivery, row.url), 'Duplicate source URL');
    delivery[row.url] = {bundleUrl: '/practice-content/bundled-rounds/' + name, id: row.id};
  }
}
for (const group of groups.values()) {
  let banks = {}, rows = [];
  for (const {row, text} of group) {
    assert(!Object.hasOwn(banks, row.id), 'Duplicate bank ID');
    if (Buffer.byteLength(encode({...banks, [row.id]: text})) > limit) {
      save(banks, rows); banks = {}; rows = [];
    }
    banks[row.id] = text; rows.push(row);
  }
  save(banks, rows);
}
function output(path, bytes) {
  if (check) assert(Buffer.from(bytes).equals(readFileSync(path)), 'Outdated generated file: ' + path);
  else writeFileSync(path, bytes);
}
mkdirSync(folder, {recursive: true});
for (const [name, bytes] of files) output(folder + '/' + name, bytes);
for (const name of readdirSync(folder)) if (!files.has(name)) {
  assert(/^[a-f0-9]{64}\.json$/.test(name), 'Unexpected file in generated bundle directory');
  assert(!check, 'Obsolete practice bundle: ' + name);
  unlinkSync(folder + '/' + name);
}
output('data/klink-practice-delivery.json', JSON.stringify(delivery, null, 2) + '\n');
const originalIgnore = readFileSync('public/.assetsignore', 'utf8').split(marker)[0];
output('public/.assetsignore', originalIgnore + marker + Object.keys(delivery).join('\n') + '\n');
console.log(`${Object.keys(delivery).length} unchanged practice files in ${files.size} bundles (max 1 MiB).`);
