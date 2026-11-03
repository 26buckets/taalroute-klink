import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyOpeningLoaderOnceContent } from './check-opening-loader-once-release-20261103.mjs';
verifyOpeningLoaderOnceContent();
for (const file of [
  'components/product/klink-opening-loader.tsx',
  'components/product/classroom-boundary.tsx',
  'lib/word-listening.ts',
  'docs/appearance-floor-20261031/floor.json',
  'docs/opening-loader-once-20261103/local/checks.json',
  'docs/opening-loader-once-20261103/integration/checks.json',
]) {
  assert.throws(() => verifyOpeningLoaderOnceContent(path => path === file
    ? Buffer.concat([readFileSync(path), Buffer.from('tampered')]) : readFileSync(path)), undefined, file);
}
const owner = 'docs/klink-owner-release-opening-loader-once-20261103.json';
assert.throws(() => verifyOpeningLoaderOnceContent(path => path === owner
  ? Buffer.from(JSON.stringify({ ...JSON.parse(readFileSync(path)), publicationApproved: false })) : readFileSync(path)));
console.log('PASS loader-only release and seven tamper checks, including withheld performance changes');
