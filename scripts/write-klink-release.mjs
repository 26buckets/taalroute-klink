import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sourceCommit = git('rev-parse', 'HEAD');
assert(/^[a-f0-9]{40}$/.test(sourceCommit));
const readiness = JSON.parse(readFileSync('data/klink-release-readiness.json'));
const routing = JSON.parse(readFileSync('data/klink-content-routing.json'));
const record = {
  application: 'Klink', builtAt: new Date().toISOString(), sourceCommit,
  branch: git('branch', '--show-current'),
  sourceClean: git('status', '--porcelain', '--untracked-files=no') === '',
  curriculumEdition: readiness.curriculumEdition,
  lexiconExportSha256: routing.exportSha256,
  sectionsSha256: createHash('sha256').update(readFileSync('data/klink-sections.json')).digest('hex'),
  sectionPhotosSha256: createHash('sha256').update(readFileSync('data/klink-section-photos.json')).digest('hex'),
  contentSha256: createHash('sha256').update(readFileSync('data/klink-connected-content.json')).digest('hex'),
};
writeFileSync('public/release.json', JSON.stringify(record, null, 2) + '\n');
assert.deepEqual(JSON.parse(readFileSync('public/release.json')), record);
console.log(`Klink release marker: ${sourceCommit}, clean=${record.sourceClean}`);
