import assert from 'node:assert/strict';
import {readFileSync as read,writeFileSync as write} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {chromium,webkit} from 'playwright';
import {collectionProgressId} from '../lib/round-progress.ts';
const folder='docs/b1-reviewed-release-20261101/';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18950';
const output=process.env.KLINK_PROGRESS_OUTPUT||folder+'progress-checks.json';
const baseline={sourceBase:'35182be471e139a7615181206ce1288c45886c86',originalRows:JSON.parse(read(folder+'b1-baseline-index.json')).filter(r=>r.id.startsWith('klink-flitslezen-b1-'))};
const oldAliases=JSON.parse(execFileSync('git',['show',baseline.sourceBase+':data/klink-progress-image-aliases-20261030.json']));
const rows=JSON.parse(read(folder+'b1-release-manifest.json')).rows.map(r=>r.after),checks=[],errors=[];
await Promise.all(Object.entries({chromium,webkit}).map(async([name,engine])=>{
 const browser=await engine.launch();
 try{const cases=baseline.originalRows.flatMap(row=>[false,true].map(completed=>({row,completed})));let nextCase=0;await Promise.all(Array.from({length:4},async()=>{while(nextCase<cases.length){const {row,completed}=cases[nextCase++];
  const page=await browser.newPage({viewport:{width:name==='chromium'?1366:390,height:900},colorScheme:name==='chromium'?'light':'dark'});
  page.on('pageerror',e=>errors.push(e.message));
  const before=JSON.parse(read('public'+row.url)).exercises,current=rows.find(r=>r.id===row.id);
  const exercises=JSON.parse(read('public'+current.url)).exercises;
  const progressId=`collection:${row.activity}:${row.id}:${oldAliases[row.url]??row.url}`;
  assert.equal(collectionProgressId(row.activity,row.id,current.url),progressId);
  const progressKey='klink.round-progress.v1:'+progressId;
  const sessionKey=`klink.group.v1:chapter:${row.activity}:${row.id}:${row.activity}`;
  const session={version:1,done:completed,exerciseId:before[completed?before.length-1:4].exerciseId};
  const progress={version:1,total:before.length,done:(completed?before:before.slice(0,4)).map(e=>e.exerciseId)};
  const sentinelKey='klink.taalroute.saved-words.v1',sentinel='["retain-this-original-value"]';
  await page.addInitScript(({progressKey,progress,sessionKey,session,sentinelKey,sentinel})=>{
   if(!localStorage.getItem('complete-progress-test-seeded')){
    localStorage.setItem(progressKey,JSON.stringify(progress));localStorage.setItem(sessionKey,JSON.stringify(session));
    localStorage.setItem(sentinelKey,sentinel);localStorage.setItem('complete-progress-test-seeded','yes');
   }
  },{progressKey,progress,sessionKey,session,sentinelKey,sentinel});
  const chapter=row.activity==='sentences'?'sentences':'texts';
  await page.goto(base+'/#learner/chapters/'+chapter+'/'+row.activity+'/'+encodeURIComponent(row.id)+'?level='+row.level+'&help=practice');
  let index=4;
  if(completed){await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();index=0;}
  const exercise=exercises[index],stage=page.locator('[data-exercise-id="'+exercise.exerciseId+'"]');await stage.waitFor();
  const choices=stage.locator('.cp-choice-grid .cp-extended-option > button:first-child');
  await choices.nth(exercise.options.findIndex(o=>exercise.answer.correctOptionIds.includes(o.id))).click();
  await page.locator('.cp-exercise-feedback [data-practice-next]').click();
  await page.locator('[data-exercise-id="'+exercises[index+1].exerciseId+'"]').waitFor();
  await page.reload();await page.locator('[data-exercise-id="'+exercises[index+1].exerciseId+'"]').waitFor();
  const state=await page.evaluate(({progressKey,prefix,sentinelKey})=>({progress:JSON.parse(localStorage.getItem(progressKey)),keys:Object.keys(localStorage).filter(k=>k.startsWith(prefix)),sentinel:localStorage.getItem(sentinelKey)}),
   {progressKey,prefix:`klink.round-progress.v1:collection:${row.activity}:${row.id}:`,sentinelKey});
  assert.deepEqual(state.keys,[progressKey]);assert.equal(state.sentinel,sentinel);assert.equal(state.progress.total,before.length);
  assert.deepEqual(state.progress.done,completed?progress.done:[...progress.done,exercise.exerciseId]);
  checks.push({engine:name,id:row.id,completedBefore:completed,restoredPosition:true,oldCompletionPreserved:true,reloadResume:true,canonicalProgressKey:true,unrelatedStoragePreserved:true});
  write(output,JSON.stringify({base,checks,errors},null,2)+'\n');if(checks.length%10===0)console.log('progress '+checks.length);await page.close();
 }}));}finally{await browser.close();}
}));
assert.equal(checks.length,80);assert.equal(new Set(checks.map(c=>c.engine+':'+c.id+':'+c.completedBefore)).size,80);assert.deepEqual(errors,[]);write(output,JSON.stringify({base,checks,errors},null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,errors:errors.length}));
