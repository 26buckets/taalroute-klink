import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
const source=readFileSync('components/product/grammar-instruction-example.tsx','utf8');
const js=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext}}).outputText.replace('"react/jsx-runtime"',JSON.stringify(pathToFileURL(resolve('node_modules/react/jsx-runtime.js')).href));
const {renderGrammarInstructionExample:render}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const items=JSON.parse(readFileSync('data/klink-imported-practice.json')).items;
const words=s=>s.replaceAll('&#x27;',"'").replaceAll('&amp;','&').match(/[\p{L}\p{N}]+/gu).join(' ');
void test('All 89 numbered grammar instructions keep every source word, number and order',()=>{
 const levels={};let count=0;
 for(const item of items)for(const phase of item.teacherWorkflow?.phases??[]){
  const result=render({kind:item.teacherWorkflow.kind,texts:phase.learnerText});if(!result)continue;
  count++;levels[item.level]=(levels[item.level]??0)+1;
  const html=renderToStaticMarkup(result),plain=html.replace(/<[^>]+>/g,' ').replace('Je situatie','');
  assert.equal(words(plain),words(phase.learnerText.join(' ')),item.id);
  const n=(phase.learnerText.at(-1).match(/^\d+\. /gm)||[]).length;
  assert.equal((html.match(/class="cp-instruction-step"/g)||[]).length,n,item.id);
  assert.equal((html.match(/class="cp-instruction-number"/g)||[]).length,n,item.id);
  assert(!html.includes('<button'));assert(!html.includes('<details'));assert(!html.includes('hidden'));
 }
 assert.equal(count,89);assert.deepEqual(levels,{A1:23,A2:39,B1:27});
});
void test('Reading texts, short Alfa sources and unsupported numbering use the unchanged presentation',()=>{
 const texts=items.find(x=>x.id==='kg-b1-g62-001').teacherWorkflow.phases[0].learnerText;
 for(const kind of ['spelling','writing','precise-response'])assert.equal(render({kind,texts}),null);
 for(const changed of [[],texts.slice(0,2),[texts[0],texts[1],texts[2].replace('2. Herstel','4. Herstel')],[...texts,'Extra'],[texts[0],texts[1],texts[2]+'\nExtra opdracht.']])assert.equal(render({kind:'grammar',texts:changed}),null);
});
void test('Times and exercise examples remain complete, and application instructions stay separate',()=>{
 const text=['Een afspraak','De les is om 18.00 uur. Je komt op tijd.','1. Lees: De les begint om 18.00 uur.\n2. Schrijf de tijd.\nToepassing: Vraag hoe laat de les begint.'];
 const html=renderToStaticMarkup(render({kind:'grammar',texts:text}));assert(html.includes('De les begint om 18.00 uur.'));assert(html.includes('aria-label="Toepassing"'));
});
