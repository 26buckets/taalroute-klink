import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const base = '59100e0242cd3ef790dc20b27e129b83ed90c549';
const live = '6a4c2acd346c436cb0344b77da21de8dadc09c16';
const candidate = '6c3f777585557b81be4762b662e249463ce95065';
const folder = 'docs/grammar-publication-20261101/';
export const grammarPublicationFile = folder + 'approval.json';
const approvalHash = 'PENDING';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean);
const sorted = values => values.toSorted((a,b) => a < b ? -1 : a > b ? 1 : 0);
export function verifyGrammarPublication(read = readFileSync) {
  const bytes = read(grammarPublicationFile);
  assert.equal(sha(bytes), approvalHash, 'Only the source-bound owner publication is allowed');
  const r = JSON.parse(bytes);
  assert.equal(r.approvedBy, 'Nico');
  assert.equal(r.publicationApproved, true);
  assert.equal(r.productionBatch, false);
  assert.equal(r.baselineSourceCommit, base);
  assert.equal(r.liveSourceCommit, live);
  assert.equal(r.localCandidate, candidate);
  assert.equal(r.userRequest, 'Goed, rond nu ook de historische archieftest af en los eventuele afwijkingen veilig op. Behoud de opmaak en aanklikbare woordaudio. Dan gaan we alles online zetten. Daarna is alles is gelukt. Doe dat direct.');
  for (const revision of [base, live, r.localCandidate]) git('merge-base', '--is-ancestor', revision, 'HEAD');
  const changed = sorted([...new Set([...lines(git('diff','--name-only',base)), ...lines(git('ls-files','--others','--exclude-standard'))])].filter(file => !file.startsWith(folder) && file !== 'scripts/check-grammar-publication-20261101.mjs'));
  assert.deepEqual(changed, sorted(Object.keys(r.files)), 'Every publication change must be reviewed');
  for (const [file, record] of Object.entries(r.files)) {
    assert.equal(sha(read(file)), record.after, file);
    if (record.before) assert.equal(sha(git('show', base + ':' + file)), record.before, file);
  }
  for (const [file, hash] of Object.entries(r.evidenceFiles)) assert.equal(sha(read(file)), hash, file);
  const archive = JSON.parse(read(folder + 'archive-results.json'));
  assert.equal(archive.length, 110);
  assert.equal(new Set(archive.map(row => row.file)).size, 110);
  assert(archive.every(row => row.exitCode === 0), 'All historical archive files must pass');
  return r;
}
export function readBeforeGrammarPublication(file, proof, read = readFileSync) {
  return proof.files[file]?.before ? git('show', base + ':' + file) : read(file);
}
