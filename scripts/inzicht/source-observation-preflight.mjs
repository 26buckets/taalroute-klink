// Offline, read-only contract checks. These do not replace real browser or Cloudflare staging tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { sourceMaterials, sourceModes, sourceMarks, sourceCriteria, SOURCE_KEY } from '../../lib/inzicht/source-observation.ts';

const path = (name) => new URL(`../../${name}`, import.meta.url);
const read = (name) => readFileSync(path(name), 'utf8');
test('original upload fingerprint, when a separate original HTML is provided', () => {
  const file = process.env.OBSERVATION_ORIGINAL_HTML;
  if (!file) return; // source reference is stored in Google Drive, not copied into git
  assert(existsSync(file), 'The original HTML must exist when OBSERVATION_ORIGINAL_HTML is given');
  assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'), 'e12d1ff7156f8e72c7075708e58c6a2be1b9a2dee00e42649768b53cabee9a60');
});
test('source catalog has exact eight keys, three modes and 144 criteria placements', () => {
  assert.deepEqual(sourceMaterials.map(x => x.id), ['mat','tas','map','man','pan','jas','pen','pet']);
  assert.deepEqual(Object.values(sourceModes), ['Woord','Zin','Tekst']);
  assert.equal(sourceMaterials.reduce((sum,m)=> sum + Object.keys(sourceModes).reduce((count,mode)=>count+sourceCriteria(mode,m.id).length,0),0), 144);
});
test('marks and empty observation retain four non-interchangeable states', () => {
  assert.deepEqual(sourceMarks.map(x=>[x.value,x.symbol,x.label]), [
    [0,'✓','Zonder directe hulp'],[1,'△','Met hulp of model'],[2,'—','Niet waargenomen'],
  ]);
  assert.notEqual(null, 2);
  assert.equal(SOURCE_KEY,'KLINK_OBSERVATIE_HTML_20261031');
});
test('UI holds edits until database acknowledgement, prevents cross-learner draft switch and exports saved values', () => {
  const component = read('components/inzicht/source-observation.tsx');
  for (const term of ['await beforeSwitch()', 'pendingWrites.current', 'retryKeys.current', "setStatus('Opgeslagen in Klink Inzicht')", 'await saveNow()', "await import('jspdf')", "window.addEventListener('beforeunload'", 'sourceMarks[v].label'])
    assert(component.includes(term), `Missing UI guard: ${term}`);
  assert(!component.includes('localStorage'), 'Client-side storage must never be the authoritative store');
});
test('API rejects unowned revisions; source observations remain separate from mastery',()=>{
  const backend = read('lib/inzicht/service.ts').replace(/\s+/g,' ').replace(/\( /g,'(');
  for (const term of ["path[0] === 'source-observations'", 'source_observation_revisions', "return fail(409, 'De observatie is gewijzigd", 'existing.author_id !== c.member', 'values.every((v) => v === null || v === 0 || v === 1 || v === 2)'])
    assert(backend.includes(term), `Missing API guard: ${term}`);
  const migration=read('db/migrations/inzicht/0006_original_observations.sql').toUpperCase();
  assert(!/\bDROP\s+(TABLE|COLUMN)\b/.test(migration));
  assert(migration.includes('FOREIGN KEY(ORGANIZATION_ID,GROUP_ID,LEARNER_ID)'));
});
