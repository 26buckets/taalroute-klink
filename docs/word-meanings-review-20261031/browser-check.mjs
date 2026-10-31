import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {productionIndex} from '../../lib/production-practice.ts';
import {chapterHash,practiceChapters} from '../../lib/practice-chapters.ts';
import {groupSessionKey} from '../../lib/group-practice.ts';
const p='docs/word-meanings-review-20261031/',base='http://127.0.0.1:18933';
const output='/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-woordbetekenissen-20261031/';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
 for(const [word,level] of [['u','a2'],['haar','a1'],['koffie','a1'],['uitloggen','a1'],['groot','a1'],['concentreren','b1'],['toilet','a1'],['al','a1'],['gaan','a1']]){
  console.log('Check',word,level);let row,e;
  for(const c of productionIndex.filter(c=>c.activity==='copy'&&c.level===level)){
   const found=JSON.parse(readFileSync('public'+c.url)).exercises.find(e=>e.exampleWord===word);
   if(found){row=c;e=found;break;}
  }
  assert(e);await page.goto('about:blank');await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();await page.evaluate(()=>localStorage.clear());const key=groupSessionKey('chapter:copy:'+row.id,'copy');
  await page.evaluate(({key,id})=>localStorage.setItem(key,JSON.stringify({version:1,exerciseId:id,done:false})),{key,id:e.exerciseId});
  const hash=chapterHash({chapter:practiceChapters.find(c=>c.activities.includes('copy')).id,activity:'copy',collection:row.id,level,help:row.help});
  await page.goto(base+'/'+hash);await page.reload();await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
  await page.locator('.cp-word-hint').getByRole('button',{name:'Help',exact:true}).click();assert.equal(await page.locator('.cp-word-hint p').innerText(),e.meaning);
  const input=page.locator('.cp-text-entry input');await input.fill('zzzfout');await input.press('Enter');assert((await page.locator('.cp-exercise-feedback').innerText()).includes('Probeer opnieuw'));await input.fill(word);await input.press('Enter');await page.locator('.cp-exercise-feedback.right').waitFor();
  checks.push({word,level,meaningVisible:true,wrongRejected:true,rightAccepted:true});
 }
 console.log('Check report');await page.goto('file://'+output+'Klink-woordbetekenissen-en-niveaus.html');
 assert.equal(await page.locator('#fixes tbody tr').count(),111);assert.equal(await page.locator('.decision').count(),4);
 await page.locator('#query').fill('uitloggen');assert.equal(await page.locator('#allwords tr').count(),2);
 assert((await page.locator('#allwords').innerText()).includes('Je account blijft bestaan.'));
 await page.locator('#query').fill('');await page.locator('#status').selectOption('Keuze gevraagd');assert((await page.locator('#count').innerText()).includes('resultaten'));
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:output+'overzicht-desktop.png'});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:output+'overzicht-mobiel.png'});
 const clips=await page.locator('audio').evaluateAll(es=>es.map(e=>e.src));assert.equal(clips.length,6);
 for(const src of clips){const audio=await page.evaluate(async src=>{const a=document.createElement('audio');a.src=src;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Audio metadata timeout: '+src)),5000);a.onloadedmetadata=()=>{clearTimeout(timer);resolve()};a.onerror=()=>{clearTimeout(timer);reject(Error('Audio file error: '+src))};a.load()});return a.duration;},src);assert(audio>0)}
 assert.deepEqual(errors,[]);writeFileSync(p+'targeted-browser-check.json',JSON.stringify({checks,reportSearch:true,reportMobile:true,reportAudioMetadata:clips.length,errors},null,2));
}catch(error){await page.screenshot({path:output+'browser-failure.png'});writeFileSync(p+'browser-failure.txt',await page.locator('body').innerText());throw error;}finally{await browser.close()}
