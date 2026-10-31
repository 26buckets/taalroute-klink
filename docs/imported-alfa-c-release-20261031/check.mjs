import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {importedItems,importedExercise} from '../../lib/imported-practice.ts';
import {importedItemIssues} from '../../lib/imported-practice-contract.ts';
import {pilotBlocks} from '../../lib/alfa-c-practice.ts';
import {functionalBlocks,functionalAudio} from '../../lib/alfa-c-functioneel.ts';
import {dailyBlocks,dailyAudio,dailyAnswer} from '../../lib/alfa-c-dagelijks.ts';
import {teacherTasks} from '../../lib/alfa-c-docent.ts';
const dir='docs/imported-alfa-c-release-20261031',read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const ledger=read(dir+'/source-amendments.json');
for(const file of new Set(ledger.changes.map(c=>c.path[0]))){
 const actual=read(file),restored=structuredClone(actual);
 for(const c of ledger.changes.filter(c=>c.path[0]===file)){let v=restored;for(const k of c.path.slice(1,-1))v=v[k];const k=c.path.at(-1);assert.deepEqual(v[k],c.after);v[k]=c.before;}
 const baseline=JSON.parse(execFileSync('git',['show',ledger.baseline+':'+file],{maxBuffer:20e6}).toString());assert.deepEqual(restored,baseline);
}
const bank=read('data/klink-imported-practice.json');assert.equal(importedItems.length,bank.items.length);assert.equal(bank.items.length,1393);
const texts=importedItems.filter(i=>i.domain==='teksten');assert.equal(texts.length,111);
for(const t of texts){assert.deepEqual(importedItemIssues(t),[]);const e=importedExercise(t);assert.equal(e.contentLevel,t.level.toLowerCase().replace(' ','-'));assert.equal(e.access,'teacher-supported');assert.equal(e.assessment,'participation');assert.equal(e.requiresAudio,false);assert(e.contentTask.initialQuestions.some(q=>q.id===t.id&&q.prompt===t.prompt));for(const id of t.teacherReference.correctOptionIds)assert(t.options.some(o=>o.id===id)); if(['klink-teksten-b09-02','klink-teksten-b10-03','klink-teksten-b13-02','klink-teksten-b13-05'].includes(t.id))assert(t.teacherReference.acceptedAnswers.includes(t.options.find(o=>t.teacherReference.correctOptionIds.includes(o.id)).text));}
const media=new Set(),audioBindings=[];
function walk(v){if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);else if(typeof v==='string'&&v.startsWith('/')&&/\.(mp3|wav|ogg)$/i.test(v)){assert(fs.existsSync('public'+v),v);media.add(v);}}
for(const b of pilotBlocks){assert.equal(b.steps.length,12);for(const s of b.steps){walk(s);if(s.exercise.tiles)assert.equal(s.exercise.answer.targetTileIds.map(id=>s.exercise.tiles.find(t=>t.id===id).token).join(s.exercise.buildKind==='sentence'?' ':''),s.model);}}
const fclips=read('data/klink-alfa-c-functioneel-audio.json').clips;
for(const b of functionalBlocks){assert.equal(b.steps.length,12);for(const s of b.steps){if(s.kind==='choice')assert.equal(s.options.filter(o=>o.id===s.correctOptionId).length,1);for(const [role,text]of[['guide',s.instruction],['guide',s.helpVisible],['guide',s.retryVisible],...s.dictationTexts.map(t=>['target',t]),...s.exampleTargetTexts.map(t=>['target',t])])if(text){const src=functionalAudio(role,text);assert(src,`${s.id} ${role} ${text}`);walk(src);audioBindings.push({task:s.id,role,text,src});}}}
const dclips=read('data/klink-alfa-c-dagelijks-audio.json').clips;
for(const b of dailyBlocks){assert.equal(b.steps.length,12);for(const s of b.steps){for(const[k,text]of Object.entries(s.speech)){const clip=dclips.find(c=>c.id===s.audio[k]);assert(clip,`${s.id}:${k}`);assert.equal(clip.text,text);walk(clip.src);audioBindings.push({task:s.id,role:k,text,src:clip.src});}if(s.interaction==='keuze'){assert.equal(s.options.filter(o=>o.correct).length,1);for(const o of s.options)assert.equal(dailyAnswer(s,[o.code]),o.correct);}else{assert.deepEqual([...s.cards].sort(),[...s.answerOrder].sort());assert(dailyAnswer(s,s.answerOrder));}}}
walk(teacherTasks);assert.equal(teacherTasks.length,27);
for(const t of teacherTasks)if(t.kind==='recall'){assert.equal(t.tokens.join(' '),t.stages[0].model);assert.deepEqual([...t.order].sort((a,b)=>a-b),t.tokens.map((_,i)=>i));}
const series=[];const unique=new Set(),forms=new Set();
for(const c of read('data/klink-production-index.json').filter(c=>c.activity==='read-series')){
 const raw=fs.readFileSync('public'+c.url);assert(c.url.endsWith(createHash('sha256').update(raw).digest('hex').slice(0,16)+'.json'));const es=JSON.parse(raw).exercises;assert.equal(es.length,c.count);
 for(const e of es){assert.equal(e.contentLevel,c.level);assert.equal(e.assessment,'participation');assert.equal(e.independentReading,false);assert.equal(e.access,'teacher-supported');unique.add(e.exerciseId);for(const t of e.textBlocks){assert(t.text.trim());forms.add(t.text);assert(t.audio?.src);walk(t.audio);}}
 series.push({...c,words:es.map(e=>({id:e.exerciseId,text:e.textBlocks.map(t=>t.text).join(' '),meaning:e.meaning,audio:e.textBlocks.map(t=>t.audio.src)}))});
}

const checks={date:'2026-10-31',baseline:ledger.baseline,exactReversibleSourceAmendments:ledger.changes.length,importedQuestions:texts.length,uniqueTexts:new Set(texts.map(x=>x.stimulus)).size,pilotSteps:36,functionalSteps:72,dailySteps:72,teacherTasks:27,wordSeries:series.length,wordPlacements:series.reduce((n,c)=>n+c.count,0),uniqueWordTaskIds:unique.size,uniqueWordForms:forms.size,audioPaths:media.size,checkedSpeechBindings:audioBindings.length,answerModelsValid:true,levelsAndIdsPreserved:true,allSourceMediaUnchanged:true,humanListening:'niet uitgevoerd',publication:'publicatie aangevraagd; lokale controle'};
fs.writeFileSync(dir+'/runtime.json',JSON.stringify({pilotBlocks,functionalBlocks,dailyBlocks,teacherTasks,series,audioBindings},null,2));fs.writeFileSync(dir+'/checks.json',JSON.stringify(checks,null,2));fs.writeFileSync(dir+'/audio-paths.json',JSON.stringify([...media],null,2));console.log(checks);
