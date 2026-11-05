import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const hints=JSON.parse(readFileSync('data/klink-handwriting-help-20261103.json')),source=JSON.parse(readFileSync('docs/klink10-handwriting-help-ac-20261103/selected-source.json'));
void test('Only exact ten source IDs/models receive original listening hints',()=>{assert.equal(hints.length,10);assert.equal(new Set(hints.map(x=>x.sourceId)).size,10);for(const x of hints){const s=source.find(s=>s.sourceId===x.sourceId);assert.equal(x.model,s.model);assert.equal(x.listeningHint,s.listenHint);assert.equal(s.canonical.exerciseId,x.sourceId);}});
void test('Existing WordHint callers and other surfaces remain exact',()=>{const file='components/product/package-exercise-browser.tsx';const before=execFileSync('git',['show','HEAD:'+file],{encoding:'utf8',maxBuffer:2e6}),after=readFileSync(file,'utf8');const clean=s=>s.replace("import handwritingHints from '@/data/klink-handwriting-help-20261103.json';\n",'').replace(/function HandwritingSurface\([\s\S]*?(?=\nfunction TraceSurface\()/,'');assert.equal(clean(before),clean(after));});
void test('Canonical banks, index, storage, public assets and styles remain untouched',()=>{assert.equal(execFileSync('git',['diff','--name-only','HEAD','--','public','data/klink-production-index.json','lib/writing-ink.ts','components/product/writing-board.tsx','app','*.css'],{encoding:'utf8'}),'');});
void test('Listening-hint sound letters are literal units, not ordinary word-audio labels',()=>{const units=hints.map(x=>x.listeningHintUnits.map(start=>x.listeningHint.slice(start).match(/^[a-z]+/)[0]));assert.deepEqual(units,[['a'],['s','k'],[],[],[],['ee'],['oo'],['uu'],['z'],['oo']]);});
