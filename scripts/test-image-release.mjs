import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertImageMappings } from './check-image-release.mjs';
import { allPackageWords } from '../lib/package-content.ts';
import { readFileSync } from 'node:fs';

test('Image publication preserves audio and rejects unrelated, missing or duplicate changes', () => {
  const before = { word: { audio: '/recording.wav', image: '/old.webp', imageUse: 'context' } };
  const images = [{ ids: ['word'], image: '/new.webp' }];
  const after = { word: { ...before.word, image: '/new.webp' } };
  assert.equal(assertImageMappings(before, after, images), 1);
  assert.throws(() => assertImageMappings(before, { word: { image: '/new.webp' } }, images));
  assert.throws(() => assertImageMappings(before, { ...after, extra: {} }, images));
  assert.throws(() => assertImageMappings(before, before, images));
  assert.throws(() => assertImageMappings(before, after, [...images, ...images]));
});
test('Every approved image reaches the existing word cards without losing meanings', () => {
  const images = JSON.parse(readFileSync('docs/klink-images-20261025/images.json'));
  for (const image of images) for (const id of image.ids) {
    const word = allPackageWords.find(word => word.id === id);
    assert(word, id); assert.equal(word.image, image.image, id); assert(word.meaning, id);
  }
});
