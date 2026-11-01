import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyPhotoRepairRelease } from './check-alfa-c-photo-repair-release.mjs';
const path = 'docs/klink-owner-release-alfa-c-photo-repair-20261029.json';
void test('complete repair proof retains the approved publication ancestry', () => assert.equal(verifyPhotoRepairRelease().newAudio, 98));
for (const field of ['publicationApproved', 'liveSourceCommit']) void test(`reject changed ${field}`, () => {
  assert.throws(() => verifyPhotoRepairRelease(file => file === path ? JSON.stringify({...JSON.parse(readFileSync(file)), [field]: false}) : readFileSync(file)));
});
for (const file of ['data/klink-alfa-c-dagelijks.json', 'public/package-audio/alfa-c-support-20261029/KAC-SUP-ROOM106-V3.mp3']) void test(`reject changed delivery bytes: ${file}`, () => {
  assert.throws(() => verifyPhotoRepairRelease(path => path === file ? Buffer.from('changed') : readFileSync(path)));
});
void test('reject unverified cloud backup even with updated checksum', () => {
  const release = JSON.parse(readFileSync(path));
  const original = readFileSync(release.backupPath);
  assert.throws(() => verifyPhotoRepairRelease(file => file === release.backupPath ? JSON.stringify({...JSON.parse(original), downloadedByteIdentical: false}) : readFileSync(file)));
});
