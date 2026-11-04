import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateProductionCollection } from '../lib/production-practice.ts';

export function readProductionBank(row) {
  let bytes;
  if (row.url.startsWith('/api/grammar-aa-assets/')) {
    const match = /^\/api\/grammar-aa-assets\/([a-f0-9]{64}\.json)$/.exec(row.url);
    assert(match, 'Invalid server bank URL');
    const assets = JSON.parse(readFileSync('data/klink-grammar-aa-assets.json'));
    assert(Object.hasOwn(assets, match[1]), 'Unknown server bank');
    const asset = assets[match[1]];
    assert.equal(asset.mime, 'application/json; charset=utf-8');
    bytes = Buffer.from(asset.body, 'base64');
    assert.equal(bytes.length, asset.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
    assert.equal(match[1], asset.sha256 + '.json');
  } else {
    assert(row.url.startsWith('/practice-content/') && !row.url.includes('..'), 'Invalid public bank URL');
    bytes = readFileSync('public' + row.url);
  }
  const bank = JSON.parse(bytes);
  validateProductionCollection(bank, row.id, row.count);
  return bank;
}
