import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateProductionCollection,productionIndex} from '../lib/production-practice.ts';
import {chapterCollections} from '../lib/practice-chapters.ts';
import {emptyWritingFormAnswer,updateWritingFormAnswer,validateWritingFormAnswer} from '../lib/writing-form.ts';
const d='docs/self-writing-ab-ready10-20261104',m=JSON.parse(readFileSync(d+'/manifest.json')),s=JSON.parse(readFileSync(d+'/selected-items.json')),bank=JSON.parse(readFileSync(d+'/source-bank.json'));
void test('Complete source-bound Alfa B collection preserves model-supported, free self-review',()=>{
 assert.deepEqual(productionIndex.find(x=>x.id===m.row.id),m.row);assert.equal(chapterCollections('write').find(x=>x.id===m.row.id).exerciseCount,10);assert.equal(validateProductionCollection(bank,m.row.id,10).length,10);
 for(const[i,e]of bank.exercises.entries()){assert.equal(e.exerciseId,s[i].sourceId);assert.equal(e.writingSourceId,s[i].sourceId);assert.equal(e.sourceWritingContext,s[i].instruction);assert.equal(e.sourceWritingExamples[0].text,s[i].example);assert.deepEqual(e.sourceWritingCriteria,s[i].criteria);assert(!e.sourceWritingContext.includes(s[i].example));assert(e.sourceFreeWriting);assert.equal(e.assessment,'participation');assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.accepted,undefined);assert.equal(e.instructionAudio.src,m.instructionReuse.src);}
});
void test('The actual text-field storage contract retains raw draft, first and latest values',()=>{
 const fields=[{id:'text',label:'Jouw tekst',acceptedAnswers:[],wrongExamples:[],normalization:'exact',feedback:{correct:'',retry:''},maxLength:10000}];
 for(const e of bank.exercises){const first='  '+e.sourceWritingExamples[0].text+'  ',last='Mijn andere formulering.';let a=updateWritingFormAnswer(emptyWritingFormAnswer(),{text:first},fields,true);a=updateWritingFormAnswer(a,{text:last},fields,true);a=updateWritingFormAnswer(a,{text:'los concept'},fields);const stored=validateWritingFormAnswer(JSON.parse(JSON.stringify(a)),fields);assert.equal(stored.first.text,first);assert.equal(stored.last.text,last);assert.equal(stored.draft.text,'los concept');}
});
