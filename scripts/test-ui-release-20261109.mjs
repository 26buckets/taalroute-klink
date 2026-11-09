import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {verifyUiRelease} from './check-ui-release-20261109.mjs';
const approval = 'docs/ui-publication-20261109/approval.json';
await test('approved UI preserves reviewed source and evidence', () => assert(verifyUiRelease().publicationApproved));
for (const [name, path, change] of [
  ['source bytes', 'components/product/exercise-listen.tsx', bytes => Buffer.concat([bytes, Buffer.from('\n// changed')])],
  ['live basis', approval, bytes => JSON.stringify({...JSON.parse(bytes), liveSourceCommit: '0'.repeat(40)})],
  ['audio version', approval, bytes => JSON.stringify({...JSON.parse(bytes), liveAudioWorkerVersion: 'unknown'})],
  ['authorization', approval, bytes => JSON.stringify({...JSON.parse(bytes), publicationApproved: false})],
  ['cost scope', approval, bytes => JSON.stringify({...JSON.parse(bytes), newMeteredServices: 1})],
  ['visual floor', 'docs/appearance-floor-20261031/floor.json', bytes => JSON.stringify({...JSON.parse(bytes), referenceFiles: {}})],
  ['media preservation', 'docs/ui-publication-20261109/verification.json', bytes => JSON.stringify({...JSON.parse(bytes), originalMediaByteIdentical: false})],
]) await test('rejects changed ' + name, () => assert.throws(() => verifyUiRelease(file => file === path ? change(readFileSync(file)) : readFileSync(file))));
