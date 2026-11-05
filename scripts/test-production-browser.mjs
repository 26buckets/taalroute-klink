import {readProductionBank} from './read-production-bank.mjs';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {productionIndex} from '../lib/production-practice.ts';
import {practiceChapters,chapterHash} from '../lib/practice-chapters.ts';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18937';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1366,height:950}}),errors=[],checks=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget {constructor(src){super();this.src=src;}play(){window.__played.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),30);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
const url=row=>base+'/'+chapterHash({chapter:practiceChapters.find(c=>c.activities.includes(row.activity)).id,activity:row.activity,collection:row.id,level:row.level,help:row.help});
const data=row=>readProductionBank(row).exercises;
const out='outputs/production-20261029';mkdirSync(out,{recursive:true});
try{
 await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();assert(!requests.some(u=>u.includes('/practice-content/')));checks.push('Home does not fetch new exercise banks');
 const selected=[...new Map(productionIndex.map(r=>[r.activity+':'+r.level,r])).values()];
 for(const row of selected){
  await page.goto(url(row));
  const ex=data(row)[0];
  if(row.activity.startsWith('worksheet'))await page.locator('.cp-word-worksheet').waitFor();
  else {await page.locator(`[data-exercise-id="${ex.exerciseId}"]`).waitFor();assert.equal(await page.locator('[data-exercise-id]').count(),1);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const text=await page.locator('main').innerText();assert(!/Deze oefening kon niet|Geen oefeningen/.test(text));
  checks.push({activity:row.activity,level:row.level,id:ex.exerciseId});
  if(row.level==='alfa-a'||row.activity==='meet'){
   await page.screenshot({path:out+'/'+row.activity+'-'+row.level+'.png'});
   writeFileSync(out+'/'+row.activity+'-'+row.level+'.txt',text);
  }
 }
 console.log('PASS',selected.length,'activity and level entrances');
 // Every immutable collection opens its own first record, with no stale-cache crossovers.
 let n=0;
 for(const row of productionIndex){
  await page.evaluate(hash=>{location.hash=hash;},url(row).split('#')[1]);
  const ex=data(row)[0];
  if(row.activity.startsWith('worksheet')){
   await page.locator('.cp-word-worksheet').waitFor();
   await page.locator(`[data-worksheet-exercise="${ex.exerciseId}"]`).waitFor();
  }else await page.locator(`[data-exercise-id="${ex.exerciseId}"]`).waitFor();
  n++;if(n%200===0)console.log('Opened',n);
 }
 checks.push({allCollections:n});
 // Failed fetch is visible and retry recovers; subsequent navigation uses its own data.
 const retryRow=productionIndex.find(r=>r.activity==='copy');
 await page.goto(base+'/#learner/home');
 await page.route('**'+retryRow.url,route=>route.fulfill({status:503,body:'temporary test outage'}));
 await page.goto(url(retryRow));await page.getByRole('button',{name:'Probeer opnieuw',exact:true}).waitFor();
 await page.unroute('**'+retryRow.url);await page.getByRole('button',{name:'Probeer opnieuw',exact:true}).click();
 await page.locator(`[data-exercise-id="${data(retryRow)[0].exerciseId}"]`).waitFor();checks.push('Fetch failure and retry recover');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  for(const row of selected.filter((r,i,a)=>a.findIndex(x=>x.activity===r.activity)===i)){
   await page.goto(url(row));await page.locator('[data-exercise-id],.cp-word-worksheet').waitFor();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${row.activity} ${width}`);
  }
 }
 checks.push('Nine activities fit 390px and 320px');
 assert.deepEqual(errors,[]);
 writeFileSync('docs/production-20261029/browser-check.json',JSON.stringify({checks,errors,localOnly:!base.startsWith('https')},null,2));
 console.log('PASS browser',checks.length);
}finally{await browser.close();}
