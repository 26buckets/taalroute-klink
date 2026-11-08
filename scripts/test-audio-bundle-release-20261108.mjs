import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {verifyAudioBundleRelease} from './check-audio-bundle-release-20261108.mjs';
const approval = 'docs/audio-bundles-publication-20261108/approval.json';
await test('approved successor retains exact source and local evidence', () => assert(verifyAudioBundleRelease().publicationApproved));
for (const [name, path, change] of [
  ['source bytes', 'lib/media-player.ts', bytes => Buffer.concat([bytes, Buffer.from('\n// tampered')])],
  ['prior worker', approval, bytes => JSON.stringify({...JSON.parse(bytes), liveWorkerVersion: 'unknown'})],
  ['authorization', approval, bytes => JSON.stringify({...JSON.parse(bytes), publicationApproved: false})],
  ['cost scope', approval, bytes => JSON.stringify({...JSON.parse(bytes), newMeteredServices: 1})],
  ['audio preservation', 'docs/audio-start-click-repair-20261108/checks/preservation.json', bytes => JSON.stringify({...JSON.parse(bytes), oldAudioBytesAndPathsPreserved: false})],
]) await test('rejects changed ' + name, () => assert.throws(() => verifyAudioBundleRelease(file => file === path ? change(readFileSync(file)) : readFileSync(file))));
