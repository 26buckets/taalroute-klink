import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { worksheets, worksheetHash, worksheetSelection } from '../lib/teacher-worksheets.ts';
import { classroomLessons } from '../lib/teacher-classroom.ts';

const source = JSON.parse(readFileSync('docs/werkbladen-koppeling-20261031/sources.json'));
const sha = data => createHash('sha256').update(data).digest('hex');
assert.equal(sha(readFileSync('data/klink-docent-worksheets.json')), source.catalogSha256);
assert.deepEqual(worksheets.map(x => x.id), classroomLessons.map(x => x.id));
const ids = new Set();
for (const lesson of worksheets) for (const round of ['a', 'b', 'c']) {
  const sheet = lesson.rounds[round];
  assert.equal(sheet.answers.length, 10);
  assert.deepEqual(sheet.answers.map(x => x.number), [1,2,3,4,5,6,7,8,9,10]);
  for (const answer of sheet.answers) { assert(answer.title && answer.answer); assert(!ids.has(answer.id)); ids.add(answer.id); }
  const parsed = worksheetSelection(worksheetHash(lesson.id, round, true));
  assert.equal(parsed.lesson.id, lesson.id); assert.equal(parsed.round, round); assert(parsed.fromLesson);
  const info = execFileSync('pdfinfo', ['public' + sheet.pdf], { encoding: 'utf8' });
  assert.match(info, /Pages:\s+2\b/); assert.match(info, /Page size:.*A4/);
  for (const file of [sheet.pdf, ...sheet.previews]) {
    const record = source.files.find(x => x.path === 'public' + file);
    assert(record); assert.equal(sha(readFileSync(record.path)), record.sha256);
  }
}
assert.equal(ids.size, 240);
assert.equal(worksheetSelection('#teacher/materials?lesson=unknown&round=bad').lesson, undefined);
assert.equal(worksheetSelection('#teacher/materials?lesson=tas&round=bad').round, 'a');
assert.equal(sha(readFileSync('public/docent-werkbladen/kpd08/docentantwoorden.pdf')), source.answerSha256);
console.log('PASS: 24 unchanged double-sided A4 PDFs, 48 previews, 240 unique answers, validated lesson/round links');
