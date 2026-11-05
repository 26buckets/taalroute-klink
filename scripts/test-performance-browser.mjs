import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:19120';
const out=process.env.KLINK_PERF_REGRESSION_OUTPUT || 'docs/performance-20261102/regression';mkdirSync(out,{recursive:true});const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1280,390]){
  for(const target of ['learner','teacher/plus']){
   const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));let release;const held=new Promise(r=>release=r);let requested=false;
   await p.route(target==='learner'?'**/*route-settings*.js':'**/*teacher-classroom*.js',async route=>{requested=true;await held;await route.continue()});
   const requestSeen=p.waitForRequest(r=>new RegExp(target==='learner'?'route-settings.*\\.js':'teacher-classroom.*\\.js').test(r.url()));
   await p.goto(base+'/#'+target,{waitUntil:'domcontentloaded'});
   await requestSeen;
   await p.locator('.klink-opening-loader').waitFor();await p.waitForTimeout(300);
   assert(requested);assert.equal(await p.locator('.landing-start,.learner-app,.kpd-lesson-choice').count(),0);
   release();await p.locator(target==='learner'?'.learner-app':'.kpd-lesson-choice').first().waitFor();
   assert.equal(await p.locator('.klink-opening-loader').count(),0);checks.push({engine,width,check:'waits for selected code without exposing another workspace',target});await c.close();
  }
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/opening-loader-*/**',r=>r.abort());await p.goto(base);await p.locator('.landing-start').waitFor();
  checks.push({engine,width,check:'failed decoration never blocks opening'});
  await p.goto(base+'/#teacher/plus');await p.getByRole('button',{name:'Les openen: mat',exact:true}).click();await p.locator('.kpd-big-word').waitFor();
  await p.locator('.kpd-rounds button').nth(2).click();await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await p.locator('.kpd-phases button').nth(6).click();
  await p.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).fill('Mijn bewaarde proefzin.');
  await p.goto(base+'/#learner');await p.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).waitFor();
  assert.equal(await p.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).inputValue(),'Mijn bewaarde proefzin.');
  assert.equal(await p.locator('.learner-app,.landing-start').count(),0);assert.equal(await p.evaluate(()=>location.hash),'#teacher/plus');
  await p.reload();await p.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).waitFor();assert.equal(await p.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).inputValue(),'Mijn bewaarde proefzin.');
  checks.push({engine,width,check:'active projection survives wrong hash and reload; written answer retained'});
  await p.screenshot({path:`${out}/${engine}-${width}-retained-lesson.png`});await c.close();
 }}finally{await b.close();writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2));}
}
assert.deepEqual(errors,[]);console.log('PASS',checks.length,'loading, failure, projection and answer preservation checks');
