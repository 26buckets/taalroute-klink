import test from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
import{checkWritingFormField,completeWritingForm,emptyWritingFormAnswer,updateWritingFormAnswer,validateWritingFormAnswer,writingFormLiteralRanges}from'../lib/writing-form.ts';
import{spokenWords}from'../lib/word-listening-text.ts';
import{learningGoalFor}from'../lib/learning-goals.ts';
import{productionAssetUrl,validateProductionCollection}from'../lib/production-practice.ts';
import{createHash}from'node:crypto';
const json=p=>JSON.parse(readFileSync(p)),folder='docs/writing-forms-20261102/',manifest=json(folder+'import-manifest.json'),sources=readFileSync(folder+'source-records.jsonl','utf8').trim().split('\n').map(JSON.parse),banks=manifest.newRows.map(x=>json('public'+x.row.url));
const field=(normalization='exact')=>({id:'field',label:'Gegeven',acceptedAnswers:['Nora'],normalization,wrongExamples:['Bakker'],feedback:{correct:'Overgenomen.',retry:'Vergelijk met de kaart.'}});
void test('The shared delivery asset selects each exact source bank and leaves older asset URLs alone',()=>{
 const bytes=readFileSync('public'+manifest.deliveryBundle.src),bundle=JSON.parse(bytes),sha=b=>createHash('sha256').update(b).digest('hex');
 assert.equal(bytes.length,manifest.deliveryBundle.bytes);assert.equal(sha(bytes),manifest.deliveryBundle.sha256);assert.equal(Object.keys(bundle.banks).length,21);
 for(const {row,sha256} of manifest.newRows){assert.equal(productionAssetUrl(row.url),manifest.deliveryBundle.src);const source=Buffer.from(bundle.banks[row.id]);assert.equal(sha(source),sha256);assert(source.equals(readFileSync('public'+row.url)));assert.deepEqual(validateProductionCollection(bundle,row.id,row.count),JSON.parse(source).exercises);}
 const old=json('data/klink-production-index.json')[0];assert.equal(productionAssetUrl(old.url),old.url);
 assert.throws(()=>validateProductionCollection(bundle,'missing-bank',1));assert.throws(()=>validateProductionCollection(bundle,manifest.newRows[0].row.id,1));
});
void test('Every original source card,field label and395 model values stays bound to its own current document',()=>{
 assert.equal(sources.length,140);assert.equal(banks.length,21);const byId=new Map(sources.map(r=>[r.id,r])),seen=new Set();let fields=0;
 for(const bank of banks){assert([6,7].includes(bank.exercises.length));for(const e of bank.exercises){assert(!seen.has(e.exerciseId));seen.add(e.exerciseId);const r=byId.get(e.exerciseId);let s=r.sourceRecord;while(typeof s==='string')s=JSON.parse(s);const card=typeof s.sourceCard==='string'?s.sourceCard:s.sourceCard.text??s.sourceCard.label+': '+s.sourceCard.value,raw=s.fields??s.form?.fields??s.formFields;
 assert.equal(e.sourceCard.text,card);assert.equal(e.title,s.instruction??s.learnerInstruction);assert.equal(e.fields.length,raw.length);assert.equal(e.fields.length,new Set(e.fields.map(f=>f.id)).size);
 for(const[fIndex,f]of e.fields.entries()){const source=raw[fIndex],model=String(source.valueExpected??source.model??source.canonical??source.answer??source.expected);assert.equal(f.label,source.label??source.name??source.key);assert.deepEqual(f.acceptedAnswers,source.acceptedAnswers??[model]);assert.equal(checkWritingFormField(model,f),'matched');fields++;}
 assert.equal(e.sourceForm,true);assert.equal(e.componentId,'ALF-CMP-011');assert.equal(learningGoalFor(e)?.id,'formulier');assert.equal(e.assessment,'participation');assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);assert.equal(e.sourceWordId,null);assert(e.requiresExplicitCompletion&&e.manualAdvance);}}
 assert.equal(seen.size,140);assert.equal(fields,395);
});
void test('Exact source copying preserves case,internal spaces,punctuation and leading zeros; unknown values request review',()=>{
 const f=field();assert.equal(checkWritingFormField('  Nora  ',f),'matched');for(const value of['nora','N ora','Nora!'])assert.equal(checkWritingFormField(value,f),'review');assert.equal(checkWritingFormField('Bakker',f),'retry');assert.equal(checkWritingFormField('Samira',f),'review');assert.equal(checkWritingFormField('  ',f),'missing');
 assert.equal(checkWritingFormField('0057',{...f,acceptedAnswers:['0057']}),'matched');assert.equal(checkWritingFormField('57',{...f,acceptedAnswers:['0057']}),'review');assert.equal(checkWritingFormField('4.50',{...f,acceptedAnswers:['4,50']}),'review');
});
void test('Only explicitly supplied case,spacing,date,time and telephone contracts recognize their permitted variants',()=>{
 assert.equal(checkWritingFormField('nORA',field('case')),'matched');assert.equal(checkWritingFormField('N ora',field('case')),'review');assert.equal(checkWritingFormField(' Nora   Bakker ',{...field('case-space'),acceptedAnswers:['Nora Bakker']}),'matched');
 const date={...field('date'),acceptedAnswers:['17-05-1995']};assert.equal(checkWritingFormField('17/05/1995',date),'matched');for(const value of['17/05-1995','17-5-1995','1995-05-17','32-05-1995','17-05-1996'])assert.equal(checkWritingFormField(value,date),'review');
 const time={...field('time'),acceptedAnswers:['09:00']};assert.equal(checkWritingFormField('09:00',time),'matched');for(const value of['9:00','09.00','21:00','09:60'])assert.equal(checkWritingFormField(value,time),'review');
 const phone={...field('digits'),acceptedAnswers:['06 0000 0000']};assert.equal(checkWritingFormField('0600000000',phone),'matched');for(const value of['600000000','06-0000-0000','0600000001'])assert.equal(checkWritingFormField(value,phone),'review');
});
void test('Raw drafts and immutable first submission stay separate from normalized comparison and later corrections',()=>{
 const fields=[field(),{...field(),id:'second'}],draft={field:' NORA ',second:' Mijn eigen tekst '};let state=updateWritingFormAnswer(emptyWritingFormAnswer(),draft,fields);assert.equal(state.first,undefined);assert(completeWritingForm(state.draft,fields));state=updateWritingFormAnswer(state,draft,fields,true);const first=structuredClone(state.first);state=updateWritingFormAnswer(state,{...draft,field:'Nora'},fields,true);assert.deepEqual(state.first,first);assert.equal(state.last.field,'Nora');assert.equal(state.first.field,' NORA ');state=updateWritingFormAnswer(state,{},fields);assert.deepEqual(state.first,first);assert.equal(state.last.field,'Nora');assert(!completeWritingForm(state.draft,fields));assert.throws(()=>updateWritingFormAnswer(state,{},fields,true));
});
void test('Unknown versions,foreign fields,nontext/oversized data and incomplete history are rejected before persistence',()=>{
 const fields=[field()];for(const invalid of[null,[],{version:2,draft:{}},{version:1,draft:{other:'Keep original'}},{version:1,draft:{field:7}},{version:1,draft:{field:'x'.repeat(501)}},{version:1,draft:{},first:{field:'Nora'}},{version:1,draft:{},first:{},last:{}},{version:1,draft:{},future:'Keep original'}])assert.throws(()=>validateWritingFormAnswer(invalid,fields));assert.deepEqual(validateWritingFormAnswer(emptyWritingFormAnswer(),fields),{version:1,draft:{}});
});
void test('Only explicit source-form data ranges stay literal; names,streetnames and ordinary words remain audible',()=>{
 const text='Naam: Nora Kaya. E-mail: nora.kaya@example.org. Postcode: 1234 AB. Groep: A1-2. Aantal: 3. Straat: Tulpenpad.',ranges=writingFormLiteralRanges(text),words=spokenWords(text).filter(t=>!ranges.some(r=>t.start>=r.start&&t.end<=r.end)).map(t=>t.key);assert.deepEqual(words,['naam','nora','kaya','e-mail','postcode','groep','aantal','straat','tulpenpad']);assert.deepEqual(writingFormLiteralRanges('Nora Kaya werkt in Werkhuis.'),[]);assert.deepEqual(writingFormLiteralRanges('AB is een code.'),[]);
});
void test('All current previous index rows,instructions,word library and existing form renderer remain unchanged',()=>{
 const base=manifest.baselineSourceCommit,git=p=>execFileSync('git',['show',base+':'+p],{maxBuffer:32e6}),before=JSON.parse(git('data/klink-production-index.json')),current=json('data/klink-production-index.json');assert.equal(before.length,manifest.priorRowsCount);assert.deepEqual(current.slice(0,before.length),before);assert.deepEqual(current.slice(before.length,before.length+manifest.newRows.length),manifest.newRows.map(x=>x.row));const instructions=json('data/klink-production-instructions.json'),old=JSON.parse(git('data/klink-production-instructions.json'));assert.deepEqual(instructions.slice(0,old.length),old);const selected=json(folder+'audio-review.json').selectedInstruction;assert.deepEqual(instructions[old.length],{src:selected.src,voiceId:selected.voiceId,text:selected.script,sha256:selected.sha256});assert(readFileSync('data/klink-word-library-index.json').equals(git('data/klink-word-library-index.json')));
 const file='components/product/package-exercise-browser.tsx',body=s=>s.slice(s.indexOf('function FormSurface('),s.indexOf('\nfunction ',s.indexOf('function FormSurface(')+1));assert.equal(body(readFileSync(file,'utf8')),body(git(file).toString()));
});
