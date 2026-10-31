import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyAutomaticImagesRelease } from './check-automatic-images-release-20261031.mjs';
verifyAutomaticImagesRelease();
for (const [file, mutate] of [
  ['package.json', value => ({ ...value, scripts: { ...value.scripts, prebuild: 'node scripts/write-klink-release.mjs' } })],
  ['package.json', value => ({ ...value, scripts: { ...value.scripts, predeploy: 'echo skip' } })],
  ['docs/automatic-images-20261031/backup.json', value => ({ ...value, verified: false })],
  ['docs/automatic-images-20261031/review.json', value => ({ ...value, originalsPreserved: false })],
]) assert.throws(() => verifyAutomaticImagesRelease(path => path === file ? Buffer.from(JSON.stringify(mutate(JSON.parse(readFileSync(path))))) : readFileSync(path)), file);
console.log('PASS automatic image release and four rejection checks');
