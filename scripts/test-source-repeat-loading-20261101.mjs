import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {sourceRepeatRounds,sourceRepeatBanks} from '../lib/source-repeat.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',out=process.env.KLINK_TEST_OUTPUT||'docs/repeat-rounds-20261101/local';mkdirSync(out,{recursive:true});
const round=sourceRepeatRounds[0],bank=sourceRepeatBanks(round)[0],valid=JSON.parse(readFileSync('public'+bank.url));
const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const fault of['unavailable','invalid-count','missing-source']){
  const p=await b.newPage();p.on('pageerror',e=>errors.push({engine,fault,message:e.message}));
  await p.addInitScript(()=>localStorage.setItem('klink.learning-review.v1','{"old:recall:word":{"due":1,"last":1,"streak":2}}'));
  let fail=true,requests=0;const bad=structuredClone(valid);if(fault==='invalid-count')bad.exercises.pop();else if(fault==='missing-source')bad.exercises.find(e=>e.exerciseId===round.positions[0].sourceId).exerciseId='missing-original';
  await p.route('**'+bank.url,route=>{requests++;return route.fulfill({status:fail&&fault==='unavailable'?503:200,contentType:'application/json',body:JSON.stringify(fail?bad:valid)});});
  await p.goto(base+'/'+chapterHash({chapter:'repeat',activity:'learning-review',collection:round.id,level:round.level,help:'practice'}));
  await p.getByRole('alert').waitFor();assert.equal(await p.locator('[data-exercise-id]').count(),0);
  fail=false;await p.getByRole('button',{name:'Probeer opnieuw',exact:true}).click();await p.locator(`[data-exercise-id="${round.positions[0].id}"]`).waitFor();
  assert.equal(await p.evaluate(()=>localStorage.getItem('klink.learning-review.v1')),'{"old:recall:word":{"due":1,"last":1,"streak":2}}');
  checks.push({engine,fault,rejected:true,retryRecovered:true,oldReviewPreserved:true,requests});await p.close();
 }}finally{await b.close();}
}assert.equal(checks.length,6);assert.deepEqual(errors,[]);
}catch(e){errors.push({failure:e.stack});throw e;}finally{writeFileSync(out+'/loading-checks.json',JSON.stringify({base,checks,errors},null,2)+'\n');}
console.log('PASS 6 source-bank failures recover without changing original reviews.');
