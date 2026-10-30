import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { functionalAudio, functionalBlocks, functionalOptions, functionalStorageKey, readFunctionalProgress } from '../lib/alfa-c-functioneel.ts';
const amendments = JSON.parse(readFileSync('docs/imported-alfa-c-review-20261031/source-amendments.json')).changes;
const source = JSON.parse(readFileSync('docs/klink-alfa-c-functioneel-20261028/reviewed-package.json'));
test('all instructions, examples, source texts, tips, retries and isolated dictation items have exact audio bindings',()=>{
 for(const block of functionalBlocks){
  for(const text of [block.start,block.end])assert(functionalAudio('guide',text));
  for(const s of block.steps){
   for(const text of [s.instruction,s.helpVisible,s.retryVisible,s.exampleInstruction,s.successFeedback,s.automaticAcknowledgement].filter(Boolean))assert(functionalAudio('guide',text),s.id+': '+text);
   for(const text of [...s.exampleTargetTexts,...s.dictationTexts])assert(functionalAudio('target',text),s.id+': '+text);
   for(const view of s.presentation.filter(v=>!['previousResponse','audioOnly'].includes(v.kind)))assert(functionalAudio('target',view.text),s.id+': source '+view.text);
  }
 }
});
test('all 72 revised tasks available with 27 actual digital response places', () => {
  const tasks = functionalBlocks.flatMap(b => b.steps);
  assert.equal(tasks.length,72); assert.equal(new Set(tasks.map(s=>s.id)).size,72);
  assert.equal(tasks.filter(s=>s.closed).length,0);
  assert.equal(tasks.filter(s=>s.responseSetup).length,27);
  for(const [n,b] of functionalBlocks.entries()) {
    assert.equal(b.steps.length,12); assert.equal(b.id,source.blocks[n].id);
    for(const [i,s] of b.steps.entries()) {
      const o=source.blocks[n].steps[i];
      assert.equal(s.id,o.id); assert.equal(s.screen,o.instruction.targetText); assert.equal(typeof s.instruction,'string');
      assert.equal(s.helpVisible,o.helpVisible); assert.equal(typeof s.retryVisible,'string'); const change=amendments.find(c=>c.path[0]==='data/klink-alfa-c-functioneel.json'&&c.path[2]===n&&c.path[4]===i&&c.path[5]==='exampleVisible');
      if(change){assert.equal(change.before,o.exampleVisible);assert.equal(s.exampleVisible,change.after);}else assert.equal(s.exampleVisible,o.exampleVisible);
      assert.equal(s.exampleInstruction,o.exampleSpoken); assert.deepEqual(s.responseSetup,o.responseSetup ? {...o.responseSetup, medium:'digital'} : null);
      if(s.kind==='choice') {assert.equal(s.closed,false); assert.equal(s.options.filter(x=>x.id===s.correctOptionId).length,1); assert.deepEqual(new Set(functionalOptions(s)),new Set(s.options));}
      if(s.kind==='dictation')assert.equal(s.dictationTexts.length,o.exerciseAudio.texts.length);
      if(s.presentation.some(v=>v.kind==='requiredHandwrittenSource'))assert(s.handwriting&&s.exampleHandwriting);
    }
  }
  const sheets=readFileSync('public/alfa-c/antwoordbladen.html','utf8');
  assert.equal((sheets.match(/class="sheet"/g)||[]).length,9);
  for(const b of functionalBlocks)assert(sheets.includes(`id="${b.id}"`));
  for(const error of ['woensdag 09.00 zaal 2','Voornaam: Elmi','Achternaam: Safa','De map ligt in de bak.','Ik zet de fles op tafel.'])assert(sheets.includes(error));
  assert(!/concept|voice.?id|generator|AI|broncommit/i.test(sheets));
});
test('progress rejects corrupt or invented success and never changes the older storage contract', () => {
  assert.notEqual(functionalStorageKey,'klink.preview.alfa-c.v1');
  for(const v of [null,'','{','null','{}','{"version":2}'])assert.deepEqual(readFunctionalProgress(v),{version:1,positions:{},records:{}});
  const choice=functionalBlocks[0].steps[1],open=functionalBlocks[0].steps[0];
  const raw={version:1,positions:{lijst:12,les:99,unknown:1},records:{
    [choice.id]:{assessment:'answer',correct:true,tries:2,helpUsed:true},
    [open.id]:{assessment:'participation',correct:true,tries:0,helpUsed:false},
  }};
  assert.deepEqual(readFunctionalProgress(JSON.stringify(raw)),{version:1,positions:{lijst:12},records:{[choice.id]:raw.records[choice.id]}});
  delete raw.records[open.id].correct;
  assert.deepEqual(readFunctionalProgress(JSON.stringify(raw)).records[open.id],raw.records[open.id]);
});

test('reviewed examples narrate the first source line as well as the answer',()=>{
 const steps=functionalBlocks.flatMap(b=>b.steps);
 for(const id of ['lijst-02','lijst-06']){const s=steps.find(s=>s.id==='klink-alfa-c-aanvulling-'+id);assert(s.exampleTargetTexts[0].includes('1 brood'));assert(s.exampleVisible.includes(s.exampleTargetTexts[0]));}
 const s=steps.find(s=>s.id==='klink-alfa-c-aanvulling-werk-03');assert.deepEqual(s.exampleTargetTexts.slice(0,2),['1 Pak een doek.','2 Maak de tafel schoon.']);
});
