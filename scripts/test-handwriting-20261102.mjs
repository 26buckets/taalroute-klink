import {test}from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
import{createHash}from'node:crypto';
import{learningGoalFor}from'../lib/learning-goals.ts';
import{validateProductionCollection}from'../lib/production-practice.ts';
const folder='docs/handwriting-20261102/',base='9918e0ad6bf496856c32f1e0d9f9fe6ed6ffab1a',json=p=>JSON.parse(readFileSync(p)),before=p=>execFileSync('git',['show',base+':'+p],{maxBuffer:64e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const manifest=json(folder+'import-manifest.json'),sources=readFileSync(folder+'source-records.jsonl','utf8').trim().split('\n').map(JSON.parse),banks=manifest.newRows.map(({row,sha256})=>{const bytes=readFileSync('public'+row.url);assert.equal(sha(bytes),sha256);return{row,exercises:validateProductionCollection(JSON.parse(bytes),row.id,row.count)};}),exercises=banks.flatMap(x=>x.exercises);
void test('All100 native source identities/revisions are preserved and linked exactly once',()=>{
 assert.equal(sources.length,100);assert.equal(exercises.length,100);assert.equal(new Set(exercises.map(e=>e.exerciseId)).size,100);
 const registry=json('docs/klink-invullen-20261101/writing-source-register.json');
 for(const source of sources){const record=registry.records.find(x=>x.id===source.id);for(const key of['id','documentId','revisionId','paragraphIndex','recordSha256'])assert.deepEqual(source[key],record[key]);assert(exercises.some(e=>e.writingSourceId===source.id));}
 const revisions=json(folder+'native-documents-revision.json');assert(revisions.allFiveCurrentRevisionsUnchanged);assert.equal(revisions.documents.length,5);
});
void test('Handwriting requires actual strokes,explicit comparison and participation only',()=>{
 for(const e of exercises){assert.equal(e.componentId,'ALF-CMP-012');assert.equal(e.mode,'paper-dictation');assert(e.handwritingOnly&&e.requiresAudio&&e.requiresExplicitCompletion&&e.manualAdvance&&e.audioOnly);assert.equal(e.assessment,'participation');assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.sourceWordId,null);assert.equal(e.fields,undefined);assert.equal(learningGoalFor(e).id,'woord-dictee');assert.equal(e.target,e.helpWord);}
});
void test('Fifteen short rounds retain all1652 prior rows,public assets and word cards',()=>{
 const index=json('data/klink-production-index.json'),prior=JSON.parse(before('data/klink-production-index.json')),ids=new Set(manifest.newRows.map(x=>x.row.id));assert.equal(prior.length,1652);assert.deepEqual(index.filter(x=>!ids.has(x.id)),prior);assert.equal(banks.length,15);
 for(let i=0;i<banks.length;i++){assert.equal(banks[i].exercises.length,[7,7,6][i%3]);assert.equal(banks[i].row.activity,'paper-dictation');assert.equal(banks[i].row.level,'alfa-c');assert.equal(banks[i].row.help,'practice');}
 assert.equal(execFileSync('git',['diff','--name-only','--diff-filter=MD',base,'--','public']).length,0);assert(readFileSync('data/klink-word-library-index.json').equals(before('data/klink-word-library-index.json')));assert(readFileSync('data/klink-word-audio-twenty-reviewed-20261101.json').equals(before('data/klink-word-audio-twenty-reviewed-20261101.json')));
});
void test('Only eight missing word recordings extend the pool; all old defaults stay exact',()=>{
 const pool=json('data/klink-word-listening-audio.json'),old=JSON.parse(before('data/klink-word-listening-audio.json')),index=json('data/klink-word-listening.json'),oldIndex=JSON.parse(before('data/klink-word-listening.json')),review=json(folder+'audio-review.json');assert.equal(Object.keys(old).length,5651);assert.equal(Object.keys(pool).length,5659);assert.equal(Object.keys(oldIndex).length,12283);assert.equal(Object.keys(index).length,12291);
 for(const[k,v]of Object.entries(old))assert.deepEqual(pool[k],v);for(const[k,v]of Object.entries(oldIndex))assert.deepEqual(index[k],v);
 assert.equal(review.selectedNewModels.length,8);assert.equal(review.reportedIncludedCredits,63);assert.equal(review.paidBudgetIncrease,0);assert.equal(review.humanListeningPerformed,false);
 for(const row of review.selectedNewModels){const r=pool[row.target];assert.equal(r.sha256,sha(readFileSync('public'+r.source)));assert(r.technicalApproved&&r.metadataApproved);assert.notEqual(r.voiceId,'h6uBOiAjLKklte8hdYio');assert.equal(r.humanPronunciationReview,'not performed; owner standing approval');assert(row.whisper.exactWords||row.dutchCtc.text.replace(/\s/g,'')===row.target);}
});
void test('Spelling hints retain explicit units and document the three actual source corrections',()=>{
 const changes=json(folder+'editorial-adaptations.json').changes;assert.deepEqual(changes.map(x=>x.sourceId),['KSW-AC-HS-071','KSW-AC-HS-084','KSW-AC-HS-086']);
 for(const change of changes){const e=exercises.find(x=>x.exerciseId===change.sourceId);assert.equal(e.meaning,change.after);assert.notEqual(change.before,change.after);}
 assert.equal(exercises.find(x=>x.exerciseId==='KSW-AC-HS-071').meaning,'Markt eindigt op kt.');assert.equal(exercises.find(x=>x.exerciseId==='KSW-AC-HS-084').meaning,'Mug eindigt op g.');assert.equal(exercises.find(x=>x.exerciseId==='KSW-AC-HS-086').meaning,'Berg eindigt op g.');
 const unit=exercises.find(x=>x.exerciseId==='KSW-AC-HS-038');assert(unit.writingHintUnits.includes(unit.meaning.indexOf('spraak.')));assert(json(folder+'local/word-coverage/source-coverage.json').missing.length===0);
});
