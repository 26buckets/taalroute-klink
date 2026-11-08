import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as source from '../lib/connected-content-data.ts';
import { connectedContentModule } from './precompute-connected-content.mjs';

const generated = connectedContentModule(source);
const restored = await import('data:text/javascript;base64,' + Buffer.from(generated).toString('base64'));
const rows = [];
for (const [name, value] of Object.entries(source)) {
  const map = value instanceof Map;
  assert.equal(restored[name] instanceof Map, map);
  assert.deepEqual(restored[name], value, `${name}: preserve exact object fields and values`);
  const original = JSON.stringify(map ? [...value] : value);
  const actual = JSON.stringify(map ? [...restored[name]] : restored[name]);
  assert.equal(actual, original, `${name}: every field, order, level, audio and provenance must remain exact`);
  rows.push({ name, sha256: createHash('sha256').update(actual).digest('hex'), bytes: Buffer.byteLength(actual) });
}
assert.throws(() => connectedContentModule({}), /deep-equal/);
assert.throws(() => connectedContentModule({ ...source, connectedContent: [{ missing: undefined }] }), /preserve every value/);
assert.throws(() => connectedContentModule({ ...source, connectedContent: [{ count: NaN }] }), /preserve every value/);
const content = source.connectedContent;
assert.equal(content.length, JSON.parse(readFileSync('data/klink-connected-content.json')).items.length);
assert(content.some(item => item.kind === 'dialogue'));
// Compiling remains a build operation, with no fetch, database or dynamic import in its output.
assert(!/\b(?:fetch|import)\s*\(/.test(generated));
console.log(JSON.stringify({ exports: rows, exactRoundTrip: true, sourceItems: content.length, runtimeRequestsAdded: 0 }, null, 2));
