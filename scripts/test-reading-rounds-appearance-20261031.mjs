import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const collection=chapterCollections('text-question').find(c=>c.exercises.length);
const route=chapterHash({chapter:'texts',activity:'text-question',collection:collection.id,level:collection.level,help:'guided'});
const checks=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const theme of ['light','dark'])for(const width of [1366,390]){
  const samples=[];
  for(const base of ['https://klink.taalroute.nl',process.env.KLINK_TEST_URL||'http://127.0.0.1:18950']){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme});
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.goto(base+'/?reading-appearance=20261031'+route);
   await page.locator('[data-exercise-id]').waitFor();await page.evaluate(()=>document.fonts.ready.then(()=>true));
   samples.push(await page.evaluate(()=>{
    const selectors=['.cp-task-card','.cp-source-text','.cp-extended-task h4','.cp-exercise-feedback','.cp-extended-option > button:first-child'];
    return selectors.map(selector=>[selector,...Array.from(document.querySelectorAll(selector)).map(e=>{
     const r=e.getBoundingClientRect(),s=getComputedStyle(e);
     return{box:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*10)/10),font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:s.color,background:s.backgroundColor,radius:s.borderRadius};
    })]);
   }));
   await page.close();
  }
  assert.deepEqual(samples[1],samples[0],name+' '+theme+' '+width+': existing player appearance equals live');
  checks.push({engine:name,theme,width,existingPlayerEqualsLive:true});
 }}finally{await browser.close();}
}
writeFileSync('docs/leesrondes-audio-20261031/appearance-check.json',JSON.stringify({equal:true,checks,sourceMarkupUnchanged:true,stylesUnchanged:true},null,2)+'\n');
console.log('PASS',checks.length,'live/local existing-player comparisons on desktop/mobile in light/dark');
