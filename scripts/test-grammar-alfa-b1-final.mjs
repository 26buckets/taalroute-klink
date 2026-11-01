import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const out=process.env.KLINK_TEST_OUTPUT;assert(out);mkdirSync(out,{recursive:true});const base='http://127.0.0.1:18984',results=[];
const collections=chapterCollections('grammar-path').filter(c=>c.exercises[0].localGrammar);
for(const[name,engine]of Object.entries({chromium,webkit})){
 const b=await engine.launch();try{
 for(const level of ['alfa-a','alfa-b','alfa-c','b1']){
 const c=collections.find(c=>c.level===level),e=c.exercises[0],p=await b.newPage();p.setDefaultTimeout(15000);
 await p.addInitScript(e=>localStorage.setItem('klink.taalroute.preferences.v1',JSON.stringify({literacy:'all',language:'all',pictures:'always',[e.contentAxis]:e.contentLevel})),e);
 await p.goto(base+'/#learner/package/'+c.pack.id);await p.locator('.cp-tabs').getByRole('button',{name:'Gebruiken',exact:true}).click();await p.locator('.cp-step-scope select').selectOption(e.lessonId);await p.locator('[data-activity="grammar-path"]').click();await p.locator('[data-exercise-id]').waitFor();const id=await p.locator('[data-exercise-id]').getAttribute('data-exercise-id');assert(c.exercises.some(e=>e.exerciseId===id));results.push({engine:name,level,lessonEntry:id});
 await p.close();
 }
 const c=collections.find(c=>c.level==='b1'),p=await b.newPage();await p.goto(base+'/'+chapterHash({chapter:'grammar',activity:'grammar-path',collection:c.id,level:'b1',help:'practice'}));await p.waitForFunction(()=>document.querySelector('[data-exercise-id]')&&!document.querySelector('.cp-opening-loader'));
 for(const e of c.exercises){const t=e.contentTask;assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-exercise-id'),e.exerciseId);const choice=p.locator('.cp-choice-grid').getByRole('button',{name:t.options.find(o=>t.correctOptionIds.includes(o.id)).text,exact:true});await choice.focus();await choice.press('Space');await p.locator('[data-practice-check]').click();await p.waitForFunction(()=>document.querySelector('[data-practice-ready="true"]'));await p.locator('[data-practice-next]').click();}
 await p.getByRole('heading',{name:'Goed geoefend'}).waitFor();results.push({engine:name,finalB1SixSteps:true,keyboardChoice:true});await p.close();
 const a=collections.find(c=>c.level==='alfa-b'),q=await b.newPage();await q.addInitScript(()=>{window.Audio=class extends EventTarget{play(){return Promise.reject(Error('local audio test failure'));}pause(){}};});await q.goto(base+'/'+chapterHash({chapter:'grammar',activity:'grammar-path',collection:a.id,level:a.level,help:'practice'}));await q.getByText('Het geluid kon niet starten.',{exact:true}).waitFor();assert.equal(await q.locator('.cp-choice-grid button:enabled').count(),0);assert.equal(await q.locator('[data-practice-next]').isEnabled(),false);results.push({engine:name,missingRequiredAudioBlocksAnswer:true});await q.close();
 }finally{await b.close();writeFileSync(out+'/browser.json',JSON.stringify(results,null,2));}
}
console.log(`${results.length} final checks passed`);
