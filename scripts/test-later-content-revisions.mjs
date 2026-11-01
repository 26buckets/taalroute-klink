import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { readBeforeLaterContentRevisions, contentRevisionCheckpoints } from './check-later-content-revisions.mjs';
import { readBeforeSentenceRevision } from './check-sentence-revision.mjs';
import { verifyContentAmendments } from './check-content-repair-release.mjs';
const file = 'data/klink-imported-practice.json';
void test('Approved later content reconstructs the exact historical bank without changing current content', () => {
  const before = readFileSync(file);
  assert.deepEqual(JSON.parse(readBeforeLaterContentRevisions(file)), JSON.parse(execFileSync('git', ['show', `${contentRevisionCheckpoints.before}:${file}`], { maxBuffer: 20e6 })));
  verifyContentAmendments(readBeforeSentenceRevision);
  assert.deepEqual(readFileSync(file), before);
});
void test('Reviewed and unrelated fields, media bindings and register entries cannot escape the source guard', () => {
  for (const [path, edit] of [
    [file, bank => { bank.items.find(item => item.id === 'kg-b1-g62-001').prompt += ' ongevraagd'; }],
    [file, bank => { bank.items.find(item => item.id === 'kg-b1-g62-001').teacherWorkflow.phases[0].instruction += ' ongevraagd'; }],
    [file, bank => { bank.items.find(item => item.id === 'kg-b1-g62-001').teacherWorkflow.phases[0].learnerText[2] += ' ongevraagd'; }],
    [file, bank => { bank.items.find(item => item.id === 'kg-b1-g62-001').prerequisites[1] += ', ongevraagd'; }],
    [file, bank => { bank.items[243].teacherGuidance += ' ongevraagd'; }],
    [file, bank => { bank.items[0].id += '-changed'; }],
    [file, bank => { bank.items.pop(); }],
    ['data/klink-media.json', bank => { bank['B5R-e8279948dbb7'].audio = '/wrong.mp3'; }],
    ['public/content-register/summary.json', bank => { bank.unapproved = true; }],
    ['public/content-register/active.json', bank => { bank.push({ id: 'unapproved' }); }],
  ]) {
    const bank = JSON.parse(readFileSync(path)); edit(bank);
    assert.throws(() => readBeforeLaterContentRevisions(path, () => Buffer.from(JSON.stringify(bank))));
  }
});
void test('Unrelated files pass through unchanged and returned snapshots cannot poison later checks', () => {
  const bytes = Buffer.from('unrelated content'); let requested;
  assert.equal(readBeforeLaterContentRevisions('other.json', path => { requested = path; return bytes; }), bytes);
  assert.equal(requested, 'other.json');
  const snapshot = readBeforeLaterContentRevisions(file), original = Buffer.from(snapshot); snapshot.fill(0);
  assert.deepEqual(readBeforeLaterContentRevisions(file), original);
});
