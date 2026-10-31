import {chromium,webkit} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs';
import {functionalBlocks,functionalAudio,functionalStorageKey} from '../../lib/alfa-c-functioneel.ts';
const base='http://127.0.0.1:18931',out='docs/imported-alfa-c-review-20261031',checks=[];
const ids=['klink-alfa-c-aanvulling-lijst-02','klink-alfa-c-aanvulling-lijst-06','klink-alfa-c-aanvulling-werk-03'];
const tasks=ids.map(id=>{const block=functionalBlocks.find(b=>b.steps.some(s=>s.id===id));return{block,step:block.steps.find(s=>s.id===id)};});
const paths=[...new Set(tasks.flatMap(t=>t.step.exampleTargetTexts.map(x=>functionalAudio('target',x))))];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>console.log('failed request',r.url(),r.failure()?.errorText));
 await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
 const decoded=await page.evaluate(async paths=>{const ctx=new AudioContext();const result=[];for(const src of paths){const res=await fetch(src);if(!res.ok)throw Error(src);const b=await ctx.decodeAudioData(await res.arrayBuffer());if(b.duration<=0)throw Error(src);result.push({src,duration:b.duration});}await ctx.close();return result;},paths);
 await page.addInitScript(()=>{window.playedAudio=[];window.Audio=class extends EventTarget{play(){window.playedAudio.push(this.src);this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
 for(const width of [1366,390])for(const {block,step}of tasks){
 await page.setViewportSize({width,height:900});await page.evaluate(({key,id,n})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[id]:n},records:{}})),{key:functionalStorageKey,id:block.id,n:step.number-1});
 await page.goto(base+'/?review='+step.id+'-'+width+'#learner/chapters/alfa-c-paper/sequence/'+block.id+'?level=alfa-c&help=practice');const player=page.locator('[data-functional-step="'+step.id+'"]');await player.waitFor();
 await player.getByRole('button',{name:'Voorbeeld',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.functional-player .pilot-tools button')?.disabled);
 await player.locator('.ac-document-line').first().waitFor();const rendered=(await player.locator('.ac-document-line').allTextContents()).join('');assert.equal(rendered.replace(/\s/g,''),step.exampleVisible.replace(/\s/g,''),step.id+' '+width);
 await page.evaluate(()=>window.playedAudio=[]);await player.getByRole('button',{name:'Voorbeeld horen',exact:true}).click();await page.waitForFunction(n=>window.playedAudio.length===n,step.exampleTargetTexts.length);await page.waitForFunction(()=>!document.querySelector('.functional-player .pilot-tools button')?.disabled);
 assert.deepEqual(await page.evaluate(()=>window.playedAudio),step.exampleTargetTexts.map(t=>functionalAudio('target',t)));assert(await page.getByRole('button',{name:'Verder',exact:true}).isDisabled());
 checks.push({engine:engine.name(),width,task:step.id,allExampleLinesSpoken:true,noAutomaticCompletion:true});
 }
 fs.writeFileSync(out+'/example-browser-progress.json',JSON.stringify({engine:engine.name(),checks,errors},null,2));assert.deepEqual(errors,[]);checks.push({engine:engine.name(),actualFilesDecoded:decoded});
 }finally{await browser.close();}
}
fs.writeFileSync(out+'/example-browser.json',JSON.stringify(checks,null,2));console.log('PASS 12 actual example flows; 7 files decoded in Chromium and WebKit');
