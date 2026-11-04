import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {validateProductionCollection} from '../lib/production-practice.ts';
import {checkWritingFormField,emptyWritingFormAnswer,updateWritingFormAnswer} from '../lib/writing-form.ts';
import {isInstructionAudioEnabled} from '../lib/audio-policy.ts';
const root='docs/message-card-ac-ready10-20261104/',json=p=>JSON.parse(readFileSync(p)),m=json(root+'manifest.json'),bank=json(root+'source-bank.json'),selected=json(root+'selected-message-cards.json'),sources=json(root+'current-source-records.json');
assert(availableChapterCollections('functional-form',{chapter:'writing',level:'alfa-c',help:'practice'}).some(r=>r.id===m.row.id));
assert.equal(validateProductionCollection(bank,m.row.id,10).length,10);
for(const [i,e] of bank.exercises.entries()){
 const s=selected[i];assert.equal(e.exerciseId,s.sourceId);assert.equal(e.writingSourceId,s.sourceId);assert.equal(e.sourceDocumentId,m.sourceDocumentId);
 for(const source of sources){assert.equal(source[e.exerciseId].Leerlinginstructie,e.title);assert.equal(source[e.exerciseId]['Modelantwoord / antwoordsleutel'],`Van = ${s.from}; Bericht = ${s.message}`);}
 assert.equal(e.sourceCard.text,`Van: ${s.from}\nBericht: ${s.message}`);assert.deepEqual(e.fields.map(f=>f.id),['from','message']);assert.deepEqual(e.fields.map(f=>f.acceptedAnswers),[[s.from],[s.message]]);
 assert.equal(e.assessment,'participation');assert(!e.reviewEligible&&!e.independentReading);assert(e.requiresExplicitCompletion&&e.manualAdvance);assert(isInstructionAudioEnabled(e.instructionAudio.src));
 for(const f of e.fields){assert.equal(checkWritingFormField('',f),'missing');assert.equal(checkWritingFormField(f.wrongExamples[0],f),'retry');assert.equal(checkWritingFormField('Andere eigen tekst',f),'review');assert.equal(checkWritingFormField(' '+f.acceptedAnswers[0].toLowerCase().replaceAll(' ','  ')+' ',f),'matched');}
 const wrong={from:s.message,message:s.from},good={from:s.from,message:s.message};let saved=updateWritingFormAnswer(emptyWritingFormAnswer(),wrong,e.fields,true);saved=updateWritingFormAnswer(saved,good,e.fields,true);const restored=JSON.parse(JSON.stringify(saved));assert.deepEqual(restored.first,wrong);assert.deepEqual(restored.last,good);assert.deepEqual(e.fields.map(f=>checkWritingFormField(restored.last[f.id],f)),['matched','matched']);
}
console.log('Ten exact source cards, menu, separate field decisions and immutable first/last answers passed.');
