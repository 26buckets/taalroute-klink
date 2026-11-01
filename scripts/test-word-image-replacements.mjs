import {approvedWords} from './check-approved-word-snapshot.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyWordImageReplacements } from './check-word-image-replacements.mjs';
import { allPackageWords } from '../lib/package-content.ts';

void test('All fifteen replacements reach their existing word cards', () => {
  const images = JSON.parse(readFileSync('docs/klink-word-images-20261026/images.json'));
  assert.equal(images.length, 15);
  for (const image of images) for (const id of image.ids) {
    const word = allPackageWords.find(row => row.id === id);
    assert(word?.meaning, id);
    assert.equal(word.image, approvedWords.get(id).image, id);
  }
});

void test('Replacement release rejects wrong scope, quantity defaults, changed audio and image tampering', () => {
  const release = JSON.parse(readFileSync('docs/klink-owner-release-word-images-20261026.json'));
  verifyWordImageReplacements(release);
  for (const mutate of [r => r.publicationApproved = false, r => r.images = 14, r => r.quantityVariantsPublished = true, r => r.baselineSourceCommit = '0'.repeat(40), r => r.previousAuthorization = 'other.json', r => delete r.files['data/klink-media.json']]) {
    const bad = structuredClone(release); mutate(bad);
    assert.throws(() => verifyWordImageReplacements(bad));
  }
  const media = JSON.parse(readFileSync('data/klink-media.json'));
  media['klink-woord-bus'].audio = '/unauthorized.mp3';
  assert.throws(() => verifyWordImageReplacements(release, file => file === 'data/klink-media.json' ? Buffer.from(JSON.stringify(media)) : readFileSync(file)), /Only the reviewed image connections/);
  assert.throws(() => verifyWordImageReplacements(release, file => file.endsWith('/k202.webp') ? Buffer.from('wrong image') : readFileSync(file)), /K202/);
  const path = 'docs/klink-word-images-20261026/images.json';
  const images = JSON.parse(readFileSync(path)); images.find(row => row.code === 'K202').kind = 'quantity';
  assert.throws(() => verifyWordImageReplacements(release, file => file === path ? Buffer.from(JSON.stringify(images)) : readFileSync(file)));
});
