import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {synonymCollections,synonymExercises} from '../lib/synonyms.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18991';
const folder='docs/synonym-context-20261101',out=folder+(base.startsWith('https')?'/online':'/local');mkdirSync(out,{recursive:true});
const collection=synonymCollections.find(c=>c.id==='synonyms-b1-context-20261101');
const route=(mode,id=collection.id)=>'/'+chapterHash({chapter:'words',activity:mode,collection:id,level:'b1',help:'practice'});
const checks=[],audio=[],layouts=[],preserved=[],errors=[];
async function prepare(page,mode,reverse,id=collection.id){
 await page.goto(base+'/#learner/chapters?level=b1&help=practice');await page.locator('.cp-home').waitFor();
 await page.evaluate(({id,reverse})=>{localStorage.clear();localStorage.setItem('klink.synonym-settings.v1:'+id,JSON.stringify({seed:1,reverse}));},{id,reverse});
 await page.goto(base+route(mode,id));await page.locator('[data-exercise-id]').waitFor();
}
async function fit(page,label){
 const m=await page.evaluate(()=>{
  const main=document.querySelector('.learner-main'),stage=document.querySelector('.cp-exercise-stage'),footer=document.querySelector('.cp-exercise-feedback').getBoundingClientRect(),nav=document.querySelector('.learner-nav'),limit=nav&&getComputedStyle(nav).position==='fixed'?nav.getBoundingClientRect().top:innerHeight;
  const options=[...document.querySelectorAll('.cp-choice-grid .cp-extended-option > button')].map(x=>({bottom:x.getBoundingClientRect().bottom,top:x.getBoundingClientRect().top,overflow:x.scrollWidth-x.clientWidth}));
  const controls=document.querySelector('.cp-synonym-controls').getBoundingClientRect(),heading=document.querySelector('.cp-context-header').getBoundingClientRect();
  return{mainOverflow:main.scrollHeight-main.clientHeight,stageOverflow:stage.scrollHeight-stage.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,footerBottom:footer.bottom,limit,stageTop:stage.getBoundingClientRect().top,stageBottom:stage.getBoundingClientRect().bottom,controlsTop:controls.top,headingTop:heading.top,options};
 });
 assert(m.mainOverflow<=2&&m.stageOverflow<=2&&m.horizontal<=1&&m.footerBottom<=m.limit+2,label+': '+JSON.stringify(m));
 assert(Math.abs(m.controlsTop-m.headingTop)<24,'Controls beside title: '+label);
 assert(m.options.every(x=>x.bottom<=m.stageBottom+1&&x.top>=m.stageTop&&x.overflow<=1),'Every answer fully visible: '+label);
 assert.equal(await page.locator('.cp-task-card img,.cp-task-card video').count(),0);
 return m;
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--autoplay-policy=no-user-gesture-required']}:{} )});
 try{
  for(const width of [320,1366,390])for(const theme of ['light','dark']){
   const height=width===320?740:width===390?844:768,page=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   for(const reverse of [false,true])for(const mode of ['synonyms','cards',...(width===1366&&theme==='light'?['hear-match']:[])]){
    await prepare(page,mode,reverse);
    for(const e of synonymExercises(collection.pack,mode,1,reverse)){
     await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();
     const label=[engine.name(),width,theme,mode,reverse,e.synonymPairId].join(':');await fit(page,label);
     if(mode==='cards'){
      assert.equal(await page.locator('.cp-synonym-context').innerText(),e.synonymContext);
      await page.getByRole('button',{name:'Toon het synoniem',exact:true}).click();
      await page.waitForFunction(text=>document.querySelector('.cp-card-back[aria-hidden="false"] strong')?.innerText===text,e.cards[0].back.text);
     }else{
      if(mode==='hear-match'){
       assert.equal(await page.locator('.cp-synonym-word').count(),0);assert.equal(await page.locator('.cp-synonym-context').innerText(),e.synonymContext);
       await page.getByRole('button',{name:'Luister naar het woord',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cp-choice-grid button')?.disabled);
       const result=await page.evaluate(async src=>{const r=await fetch(src);if(!r.ok)throw Error(src);const ctx=new AudioContext(),buffer=await ctx.decodeAudioData(await r.arrayBuffer());await ctx.close();const a=new Audio(src);await a.play();await Promise.race([new Promise((ok,bad)=>{a.addEventListener('ended',ok,{once:true});a.addEventListener('error',bad,{once:true});}),new Promise((_,bad)=>setTimeout(()=>bad(Error('Audio did not end')),15000))]);return{src,duration:buffer.duration,ended:a.ended};},e.prompt.audio.src);
       assert(result.ended&&result.duration>.2);audio.push({engine:engine.name(),reverse,id:e.synonymPairId,...result});
      }else{assert.equal(await page.locator('.cp-synonym-context-card').innerText(),e.synonymContext);assert.equal(await page.locator('.cp-synonym-context-card strong').innerText(),e.prompt.text);}
      const choices=page.locator('.cp-choice-grid .cp-extended-option > button');assert.equal(await choices.count(),4);assert.deepEqual(await choices.allTextContents(),e.options.map(o=>o.label));
      const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));await choices.nth((correct+1)%4).click();await page.locator('.cp-exercise-feedback.wrong').waitFor();await choices.nth(correct).click();await page.locator('.cp-exercise-feedback.right').waitFor();
     }
     await fit(page,label+':answered');checks.push({engine:engine.name(),width,theme,mode,reverse,id:e.synonymPairId});
     await page.locator('.cp-exercise-feedback > button').click();
    }
   }
   await prepare(page,'synonyms',false);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${out}/${engine.name()}-${width}-${theme}.png`,animations:'disabled'});
   const path='/#learner/chapters/words?level=a1&help=practice',before=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'}),after=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});
   for(const[p,url]of [[before,'https://klink.taalroute.nl'+path],[after,base+path]]){await p.goto(url);await p.locator('[data-chapter-activity="synonyms"]').waitFor();await p.evaluate(()=>document.fonts.ready);await p.mouse.move(0,0);}
   const a=await before.screenshot({animations:'disabled'}),b=await after.screenshot({animations:'disabled'}),sha=x=>createHash('sha256').update(x).digest('hex');assert.equal(sha(a),sha(b),'Other chapter layout preserved');
   preserved.push({engine:engine.name(),width,theme,sha256:sha(b)});writeFileSync(`${out}/preserved-${engine.name()}-${width}-${theme}.png`,b);await before.close();await after.close();await page.close();
  }
  for(const [width,height]of [[1686,886],[1280,720],[1024,768]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   for(const [id,reverse]of [['synonyms-b1-herstel-spreken-en-oefenen-20261101',false],[collection.id,false],[collection.id,true]]){
    await prepare(page,'synonyms',reverse,id);const m=await fit(page,`${engine.name()}:${width}:layout:${id}:${reverse}`);layouts.push({engine:engine.name(),width,height,id,reverse,...m});
    if(id===collection.id&&reverse)await page.screenshot({path:`${out}/${engine.name()}-${width}-reverse.png`,animations:'disabled'});
   }await page.close();
  }
 }finally{await browser.close();}
}
assert.equal(checks.length,416);assert.equal(audio.length,32);assert.equal(preserved.length,12);assert.deepEqual(errors,[]);
writeFileSync(out+'/browser-checks.json',JSON.stringify({checks,audio,layouts,preserved,errors},null,2)+'\n');console.log(JSON.stringify({contextQuestions:8,modeChecks:checks.length,nativePlaybacks:audio.length,layouts:layouts.length,preservedScreens:preserved.length,errors:0}));
