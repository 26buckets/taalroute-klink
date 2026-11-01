import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const base = '08fda5b385ed384d7bf6bebae7a8a2d388c4ac39';
const live = '6a4c2acd346c436cb0344b77da21de8dadc09c16';
const candidate = '6c3f777585557b81be4762b662e249463ce95065';
const folder = 'docs/grammar-publication-20261101/';
export const grammarPublicationFile = folder + 'approval.json';
const approvalHash = '29cb47719c9e52f5b5ad3ad62662a3f98670102f199d7a3b27d7897deb6317d2';
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
  const changed = sorted([...new Set([...lines(git('diff','--name-only',base)), ...lines(git('ls-files','--others','--exclude-standard'))])].filter(file => !file.startsWith(folder) && file !== 'scripts/check-grammar-publication-20261101.mjs' && file !== 'PUBLICATIE-ACTUEEL.md'));
  assert.deepEqual(changed, sorted(Object.keys(r.files)), 'Every publication change must be reviewed');
  for (const [file, record] of Object.entries(r.files)) {
    assert.equal(sha(read(file)), record.after, file);
    if (record.before) assert.equal(sha(git('show', base + ':' + file)), record.before, file);
  }
  const candidateChanges = sorted([...new Set([...lines(git('diff','--name-only',candidate)), ...lines(git('ls-files','--others','--exclude-standard'))])].filter(file => !file.startsWith(folder) && file !== 'scripts/check-grammar-publication-20261101.mjs' && file !== 'PUBLICATIE-ACTUEEL.md'));
  assert.deepEqual(candidateChanges, sorted(Object.keys(r.candidateFiles)));
  for (const [file, record] of Object.entries(r.candidateFiles)) {
    assert.equal(sha(read(file)), record.after, file);
    if (record.before) assert.equal(sha(git('show', candidate + ':' + file)), record.before, file);
  }
  for (const [file, hash] of Object.entries(r.evidenceFiles)) assert.equal(sha(read(file)), hash, file);
  const archive = JSON.parse(read(folder + 'archive-results.json'));
  assert.equal(archive.length, 110);
  assert.equal(new Set(archive.map(row => row.file)).size, 110);
  assert(archive.every(row => row.exitCode === 0), 'All historical archive files must pass');
  const media = JSON.parse(read(folder + 'audio-metadata.json'));
  assert.deepEqual(sorted(media.map(row => row.file)), sorted(Object.keys(r.files).filter(file => /^public\/.*\.(mp3|wav)$/.test(file))));
  for (const row of media) {
    assert.deepEqual(row.errors, []);
    assert.equal(row.sha256, r.files[row.file].after);
    assert(Number(row.duration) > 0);
    for (const key of ['artist','album_artist','publisher']) assert.equal(row.tags[key], 'Taalroute');
  }
  const published = JSON.parse(read('data/klink-word-audio-publication-20261101.json'));
  const recordings = JSON.parse(read('data/klink-inline-word-audio.json'));
  assert.equal(published.approvedBy, 'Nico');assert.equal(published.publicationApproved, true);
  assert.deepEqual(published.bindings, recordings.map(({word,src}) => ({word,src})));
  const wordMedia = JSON.parse(read(folder + 'released-word-audio-metadata.json'));
  assert.deepEqual(sorted(wordMedia.map(row => row.file)), sorted(published.bindings.map(row => 'public' + row.src)));
  for (const row of wordMedia) {
    assert.deepEqual(row.errors, []);assert.equal(sha(read(row.file)), row.sha256, row.file);
    for (const key of ['artist','album_artist','publisher']) assert.equal(row.tags[key], 'Taalroute');
  }
  return r;
}
export function readBeforeGrammarPublication(file, proof, read = readFileSync) {
  return proof.files[file]?.before ? git('show', base + ':' + file) : read(file);
}
export function readBeforeGrammarCandidate(file, proof, read = readFileSync) {
  return proof.candidateFiles[file]?.before ? git('show', candidate + ':' + file) : read(file);
}
