import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyMenuPhotoRelease} from './check-menu-photo-release.mjs';
const path='docs/klink-owner-release-menu-photos-20261029.json';
await test('menu/photo successor preserves the current live teacher release',()=>assert.equal(verifyMenuPhotoRelease().publicationApproved,true));
for(const field of ['publicationApproved','baselineSourceCommit','userRequest']) await test(`reject changed ${field}`,()=>assert.throws(()=>verifyMenuPhotoRelease(file=>file===path?JSON.stringify({...JSON.parse(readFileSync(file)),[field]:false}):readFileSync(file))));
for(const target of ['data/klink-media.json','components/product/practice-chapters.tsx','public/package-media/word-photo-repair-20261029/vijf.webp'])await test(`reject changed bytes ${target}`,()=>assert.throws(()=>verifyMenuPhotoRelease(file=>file===target?Buffer.from('changed'):readFileSync(file))));
