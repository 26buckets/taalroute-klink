import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from './browser-tools/node_modules/playwright/index.mjs';
import {chapterHash} from './candidate-repo/lib/practice-chapters.ts';
import {readProductionBank} from './candidate-repo/scripts/read-production-bank.mjs';

const base=process.env.KLINK_TEST_BASE||'http://187.0.0.1:19042',out=process.env.KLINK_TEST_OUTPUT||'/tmp/klink-spelling-b1-browser';
const newRows=JSON.parse(readFileSync('/Users/nicoknoester/Documents/Codex/2026-11-05/klink-50-dictees-publicatie/work/candidate/banks.json'));
const checks=[];
await Promise.all(Object.entries({chromium,webkit}).map(async ([engine,type])=>{
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try {
  const p=await browser.newPage({viewport:{width:390,height:844}});
  await p.addInitScript(()=>{window.nativeEnds=[];window.addEventListener('klink-audio-source',({detail:a})=>{if(a instanceof HTMLAudioElement)a.addEventListener('ended',()=>window.nativeEnds.push(a.dataset.klinkSource),{once:true});});});
  for(const {row} of newRows){
   const e=readProductionBank(row).exercises[0],word=e.fields[0].acceptedAnswers[0],wrong=word.toUpperCase();
   await p.goto(base+'/'+chapterHash({chapter:'writing',activity:row.activity,collection:row.id,level:row.level,help:row.help}));
   await p.getByRole('button',{name:'Op één blad',exact:true}).click();
   const task=p.locator('[data-sheet-exercise="'+e.exerciseId+'"]'),input=task.getByRole('textbox',{name:'Jouw antwoord'}),check=task.getByRole('button',{name:'Controleer'});
   await input.waitFor();assert(await input.isDisabled());assert(await check.isDisabled());assert(!(await task.innerText()).includes(word));
   await task.getByRole('button',{name:'Luister naar het woord',exact:true}).click();
   await p.waitForFunction(src=>window.nativeEnds.includes(src),e.prompt.audio.src);
   await input.fill(wrong);await check.click();
   await task.getByText('Het woord is: '+word+'.',{exact:false}).waitFor();
   const accepted=' '+word+' ';await input.fill(accepted);await check.click();
   await p.locator('[data-sheet-exercise="'+e.exerciseId+'"][data-practice-ready="true"]').waitFor();
   const saved=await p.evaluate(id=>JSON.parse(localStorage.getItem('klink.writing-answer.v1:'+id)),e.writingSourceId);
   assert.deepEqual([saved.first,saved.last,saved.draft],[wrong,accepted,accepted]);
   const attempts=await p.evaluate(id=>JSON.parse(localStorage.getItem('klink.taalroute.attempts.v1')).filter(x=>x.exerciseId===id),e.exerciseId);
   assert.deepEqual(attempts.map(x=>[x.correct,x.helpUsed,x.reviewEligible]),[[false,false,false],[true,true,false]]);
   await p.getByRole('button',{name:'Eén voor één',exact:true}).click();
   await p.waitForFunction(([id,v])=>document.querySelector('[data-exercise-id="'+id+'"] input')?.value===v,[e.exerciseId,accepted]);
   checks.push({engine,id:e.exerciseId,firstAndLatestPreserved:true,nativePlayback:true,correctedAfterAttempt:true});
  }
 }finally{await browser.close();}
}));
assert.equal(checks.length,18);
mkdirSync(out,{recursive:true});
writeFileSync(out+'/sheet.json',JSON.stringify({base,checks},null,2)+'\n');
console.log('18 dictation sheet flows, including switch to one-by-one, verified.');
