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
const item=JSON.parse(readFileSync('data/klink-imported-practice.json')).items.find(x=>x.id==='kg-b1-g62-001');
const texts=item.teacherWorkflow.phases[0].learnerText,id='content:'+item.id;
const words=s=>s.replaceAll('&#x27;',"'").replaceAll('&amp;','&').match(/[\p{L}\p{N}]+/gu).join(' ');
void test('The example preserves every source word in order and separates two numbered tasks and their application',()=>{
 const html=renderToStaticMarkup(render({id,texts}));
 const plain=html.replace(/<[^>]+>/g,' ').replace('Je situatie','');
 assert.equal(words(plain),words(texts.join(' ')));
 assert.equal((html.match(/<section /g)||[]).length,4);
 assert.equal((html.match(/<li>/g)||[]).length,6);
 assert(html.includes('<h4>1. Schrijf drie korte alinea’s</h4>'));assert(html.includes('<h4>2. Herstel</h4>'));
 assert(!html.includes('<button'));
});
void test('Other lessons and unsupported source revisions use the existing rendering without losing text',()=>{
 assert.equal(render({id:'other',texts}),null);
 for(const changed of [[],texts.slice(0,2),[texts[0],texts[1],texts[2].replace('1. Schrijf','1. Ander')],[texts[0],texts[1],texts[2]+'\nExtra opdracht.']])assert.equal(render({id,texts:changed}),null);
});
