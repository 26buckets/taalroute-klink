import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {collectionProgressId} from '../lib/round-progress.ts';
const root='docs/klink10-bingo-20261102',m=JSON.parse(readFileSync(root+'/manifest.json')),json=p=>JSON.parse(readFileSync(p)),sha=b=>createHash('sha256').update(b).digest('hex'),base=p=>execFileSync('git',['show',m.baselineMain+':'+p]);
const before=JSON.parse(base('data/klink-production-index.json')),after=json('data/klink-production-index.json');assert.equal(after.length,before.length);
const changed=new Map(m.rows.map(x=>[x.row.id,x]));for(const row of after)assert.deepEqual(row,changed.get(row.id)?.row??before.find(r=>r.id===row.id));
const aliases=json('data/klink-progress-image-aliases-20261030.json'),oldAliases=JSON.parse(base('data/klink-progress-image-aliases-20261030.json'));for(const[k,v]of Object.entries(oldAliases))assert.equal(aliases[k],v);
const checks=[];
for(const r of m.rows){
 assert.deepEqual({...r.row,url:r.oldRow.url},r.oldRow);assert.equal(sha(readFileSync('public'+r.row.url)),r.sha256);assert.equal(sha(readFileSync('public'+r.oldRow.url)),r.oldSha256);
 assert.equal(collectionProgressId('word-bingo',r.row.id,r.row.url),collectionProgressId('word-bingo',r.oldRow.id,r.oldRow.url));
 const bank=json('public'+r.row.url),old=json('public'+r.oldRow.url);assert.equal(bank.exercises.length,old.exercises.length);
 for(const e of bank.exercises){const prior=old.exercises.find(x=>x.exerciseId===e.exerciseId);if(r.questionIds.includes(e.exerciseId)){
  const target=e.cells.find(c=>c.cellId===e.answer.correctCellId).text;assert(e.requiresAudio);assert.equal(e.access,'teacher-supported');
  assert.equal(new Set(e.cells.map(c=>c.text)).size,3);for(const c of e.cells)assert.equal(c.feedback,c.cellId===e.answer.correctCellId?`Je hoort ${target}.`:`Je hoort ${target}, niet ${c.text}.`);
  const stripped=structuredClone(e);stripped.cells.forEach(c=>delete c.feedback);assert.deepEqual(stripped,prior);checks.push({id:e.exerciseId,source:m.positions.find(p=>p.canonicalQuestion===e.exerciseId).sourceId,answerUnchanged:true,audioUnchanged:true});
 }else assert.deepEqual(e,prior);}
}
assert.equal(checks.length,30);assert.equal(new Set(checks.map(x=>x.source)).size,10);for(const[src,meta]of Object.entries(m.media))assert.equal(sha(readFileSync('public'+src)),meta.sha256);
assert.equal(execFileSync('git',['diff','--name-only','--diff-filter=MD',m.baselineMain,'--','public']).length,0);
writeFileSync(root+'/local/content.json',JSON.stringify({checks,existingBanksPreserved:true,unchangedMedia:true,progressAliasesPreserved:true,newQuestions:0},null,2)+'\n');console.log('PASS 10 reviewed boards / 30 existing turns; only option feedback changed; IDs, answers, audio, neighbours and progress preserved.');
