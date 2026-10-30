import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const read=f=>JSON.parse(readFileSync(f)),sha=b=>createHash('sha256').update(b).digest('hex');
const report=read('docs/remaining-links-20261030/media.json'),before=JSON.parse(execFileSync('git',['show',report.baselineSourceCommit+':data/klink-production-index.json'],{maxBuffer:8e6})),index=read('data/klink-production-index.json'),aliases=read('data/klink-progress-image-aliases-20261030.json');
const oldAliases=JSON.parse(execFileSync('git',['show',report.baselineSourceCommit+':data/klink-progress-image-aliases-20261030.json']));
for(const [k,v]of Object.entries(oldAliases))assert.equal(aliases[k],v);
const withoutImages=v=>Array.isArray(v)?v.map(withoutImages):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['image','placeholderWord'].includes(k)).map(([k,v])=>[k,withoutImages(v)])):v;
let existing=0;
for(const old of before){const row=index.find(x=>x.id===old.id);assert(row,old.id);const a=read('public'+old.url),b=read('public'+row.url);assert(b.exercises.length>=a.exercises.length);for(const e of a.exercises){const actual=b.exercises.find(x=>x.exerciseId===e.exerciseId);assert.deepEqual(withoutImages(actual),withoutImages(e),e.exerciseId);existing++;}if(row.url!==old.url)assert.equal(aliases[row.url],oldAliases[old.url]||old.url);for(const k of Object.keys(old).filter(k=>!['url','count','placeholderCount'].includes(k)))assert.deepEqual(row[k],old[k]);}
assert.equal(existing,58929);assert.equal(index.length,1414);assert.equal(index.reduce((n,x)=>n+x.count,0),58956);
const all=index.flatMap(r=>read('public'+r.url).exercises),serialized=JSON.stringify(all);
for(const a of report.assets){assert.equal(sha(readFileSync('public'+a.url)),a.sha256);assert(a.bytes<140000);assert(serialized.includes(a.url),a.code);}
assert.equal(report.newScenes.length,21);assert.equal(report.assets.length,56);
for(const c of ['KEL_A202_06','KEL_A204_06'])assert(!all.some(e=>e.exerciseId===c));
for(const c of report.newScenes)assert.equal(all.filter(e=>e.exerciseId===c).length,1);
const bingo=read('public'+report.bingo.url).exercises;assert.equal(bingo.length,3);assert.deepEqual(bingo.map(e=>e.prompt.audio.audioId),['TL1246','TL2007','TR-A1-K-864']);
for(const [i,e]of bingo.entries()){assert.deepEqual(e.cells,bingo[0].cells);assert.deepEqual(e.markedCellIds,e.cells.slice(0,i).map(c=>c.cellId));assert.equal(e.answer.correctCellId,e.cells[i].cellId);assert.equal(e.instructionAudio.src,'/package-audio/productie-instructies-20261029/KLINK-INS-312000524508.mp3');}
for(const row of report.bingos){const turns=read('public'+row.url).exercises;assert.equal(turns.length,3);for(const [i,e] of turns.entries()){assert.deepEqual(e.cells,turns[0].cells);assert.deepEqual(e.markedCellIds,e.cells.slice(0,i).map(c=>c.cellId));assert.equal(e.answer.correctCellId,e.cells[i].cellId);assert(e.meaning&&e.sourceDocumentId);}}
const registry=read('docs/placeholders-20261030/registry.json');assert.equal(registry.words.filter(w=>w.status==='placeholder').length,290);assert.deepEqual(registry.collections,index.filter(x=>x.id.startsWith('beta-images:')));
const delta=execFileSync('git',['diff','--name-only','--diff-filter=MD',report.baselineSourceCommit,'--','public']).toString();assert.equal(delta,'','Published public assets remain byte-identical');
const result={existingExercisePlacementsPreserved:existing,images:56,newScenes:21,bingoTurns:6,placeholders:290,contentAndAnswersPreserved:true,progressPreserved:true,immutableAssets:true,sourceLinks:true,localOnly:true};writeFileSync('docs/remaining-links-20261030/preservation.json',JSON.stringify(result,null,2));console.log(result);
