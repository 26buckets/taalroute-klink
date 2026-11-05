import { dailyAudio } from '../lib/alfa-c-audio.ts';
import { chromium, webkit } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { dailyBlocks, dailyStorageKey} from '../lib/alfa-c-dagelijks.ts';
import { functionalBlocks, functionalStorageKey } from '../lib/alfa-c-functioneel.ts';
import { pilotBlocks, pilotStorageKey } from '../lib/alfa-c-practice.ts';
const base=process.env.KLINK_URL??'http://127.0.0.1:18882', out=process.env.KLINK_READALONG_OUTPUT??'/tmp/klink-herstel-readalong';
fs.mkdirSync(out,{recursive:true});
const timings=new Map(JSON.parse(fs.readFileSync('data/klink-alfa-c-readalong.json')).clips.map(c=>[c.src,c]));
const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{
  const page=await browser.newPage({viewport:{width:1366,height:768}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.Audio=class extends EventTarget{currentTime=0;play(){window.testAudio=this;return Promise.resolve();}pause(){}};});
  await page.goto(base+'/#learner/alfa-c');
  for(const {kind,blocks,key} of [{kind:'daily',blocks:dailyBlocks,key:dailyStorageKey},{kind:'functional',blocks:functionalBlocks,key:functionalStorageKey},{kind:'pilot',blocks:pilotBlocks,key:pilotStorageKey}])for(const block of blocks)for(const [index,step] of block.steps.entries()){
   await page.evaluate(({key,id,index})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[id]:index},records:{}})),{key,id:block.id,index});
   await page.goto(base+'/#learner/alfa-c/'+block.id);await page.reload();
   const root=page.locator(`[data-${kind}-step="${step.id}"]`);await root.waitFor();
   await root.locator('.ac-support-tools button').first().click();
   await root.locator('.ac-explanation').waitFor();
   const src=await page.evaluate(()=>window.testAudio.src),clip=timings.get(src);assert(clip,src);
   assert.equal(await root.locator('.ac-explanation p').getAttribute('aria-label'),clip.text);
   for(const index of [0,Math.min(2,clip.words.length-1)]){
    const word=clip.words[index];await page.evaluate(t=>{window.testAudio.currentTime=t;},(word.start+word.end)/2);
    await page.waitForFunction(i=>document.querySelector('.ac-explanation .is-spoken')?.getAttribute('data-word')===String(i),index);
    assert.equal((await root.locator('.is-spoken').innerText()).trim(),word.text.trim());
   }
   const overflow=await root.evaluate(e=>{const footer=e.querySelector('.pilot-footer').getBoundingClientRect();const panel=e.querySelector('.ac-explanation').getBoundingClientRect();const main=document.querySelector('.learner-main');return panel.bottom>footer.top+1||footer.bottom>innerHeight+1||main.scrollHeight>main.clientHeight+2;});
   assert.equal(overflow,false,step.id+' explanation fits');
   if(index===0)await page.screenshot({path:`${out}/${engine}-${block.id}.png`});
   await root.getByRole('button',{name:'Naar de opdracht',exact:true}).click();assert.equal(await root.locator('.ac-explanation').count(),0);
   if(kind==='daily'){
    await root.getByRole('button',{name:'Tekst horen',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.testAudio.src),dailyAudio(step.audio.O));
    await page.evaluate(()=>window.testAudio.dispatchEvent(new Event('ended')));
   }
   checks.push({engine,id:step.id,exactExplanation:true,wordUnderline:true,cancellation:true,desktopFits:true,completeSource:kind==='daily'});
  }
 }finally{await browser.close();}
}
fs.writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2));assert.deepEqual(errors,[]);
console.log('PASS '+checks.length+' complete-text and word-synchronous explanation cases.');
