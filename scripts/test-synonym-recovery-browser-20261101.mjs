import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {synonymCollections,synonymExercises} from '../lib/synonyms.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18991';
const folder='docs/synonym-recovery-20261101',output=folder+(base.startsWith('https')?'/online':'/local');mkdirSync(output,{recursive:true});
const rows=JSON.parse(readFileSync(folder+'/word-review.json')).recovered,ids=new Set(rows.map(x=>x.newId));
const packs=synonymCollections.filter(c=>c.exercises.some(e=>ids.has(e.exerciseId)));
const checks=[],audio=[],appearance=[],errors=[];
const route=(c,mode='synonyms')=>'/'+chapterHash({chapter:'words',activity:mode,collection:c.id,level:'b1',help:'practice'});
const choices=p=>p.locator('.cp-choice-grid .cp-extended-option > button');
async function prepare(page,c,mode,reverse){
 await page.goto(base+'/#learner/chapters?level=b1&help=practice');await page.locator('.cp-home').waitFor();
 await page.evaluate(({id,reverse})=>{localStorage.clear();localStorage.setItem('klink.synonym-settings.v1:'+id,JSON.stringify({seed:1,reverse}));},{id:c.id,reverse});
 await page.goto(base+route(c,mode));await page.locator('[data-exercise-id]').waitFor();
}
async function finish(page,e,mode,engine,viewport,theme,reverse){
 await page.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();assert.equal(await page.locator('.cp-task-card img,.cp-task-card video').count(),0);
 if(mode==='cards'){
  await page.getByRole('button',{name:'Toon het synoniem',exact:true}).click();
  await page.waitForFunction(expected=>document.querySelector('.cp-card-back[aria-hidden="false"] strong')?.innerText===expected,e.cards[0].back.text);
 }else{
  if(mode==='hear-match'){
   assert.equal(await page.locator('.cp-synonym-word').count(),0);
   await page.getByRole('button',{name:'Luister naar het woord',exact:true}).click();
   await page.waitForFunction(()=>{const x=document.querySelector('.cp-choice-grid .cp-extended-option > button');return x&&!x.disabled;});
   const actual=await page.evaluate(async src=>{
    const r=await fetch(src);if(!r.ok)throw Error(src);const bytes=await r.arrayBuffer(),ctx=new AudioContext(),buffer=await ctx.decodeAudioData(bytes);await ctx.close();
    const a=new Audio(src);await a.play();await new Promise((ok,bad)=>{a.addEventListener('ended',ok,{once:true});a.addEventListener('error',()=>bad(Error(src)),{once:true});});return {duration:buffer.duration,ended:a.ended,source:a.currentSrc};
   },e.prompt.audio.src);assert(actual.ended);assert(actual.duration>.2);audio.push({engine,reverse,id:e.synonymPairId,...actual});
  }else assert.equal(await page.locator('.cp-synonym-word').innerText(),e.prompt.text);
  assert.equal(await choices(page).count(),4);const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));
  await choices(page).nth((correct+1)%4).click();await page.locator('.cp-exercise-feedback.wrong').waitFor();
  await choices(page).nth(correct).click();await page.locator('.cp-exercise-feedback.right').waitFor();
 }
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert(await page.locator('.cp-synonym-controls button').evaluateAll(a=>a.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;})));
 checks.push({engine,viewport,theme,id:e.synonymPairId,mode,reverse});await page.locator('.cp-exercise-feedback > button').click();
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--autoplay-policy=no-user-gesture-required']}:{} )});
 try{
  for(const viewport of [1366,390])for(const theme of ['light','dark']){
   const page=await browser.newPage({viewport:{width:viewport,height:950},colorScheme:theme,reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
   for(const c of packs)for(const reverse of [false,true])for(const mode of ['synonyms','cards',...(viewport===1366&&theme==='light'?['hear-match']:[])]){
    await prepare(page,c,mode,reverse);
    for(const e of synonymExercises(c.pack,mode,1,reverse))await finish(page,e,mode,engine.name(),viewport,theme,reverse);
   }
   const old=synonymCollections.find(c=>c.id==='synonyms-a1-gevoel-en-gedrag-1');
   const path='/'+chapterHash({chapter:'words',activity:'synonyms',collection:old.id,level:'a1',help:'practice'});
   const before=await browser.newPage({viewport:{width:viewport,height:950},colorScheme:theme,reducedMotion:'reduce'});
   await before.goto('https://klink.taalroute.nl'+path);await before.locator('.cp-synonym-word').waitFor();await before.evaluate(()=>document.fonts.ready);
   const after=await browser.newPage({viewport:{width:viewport,height:950},colorScheme:theme,reducedMotion:'reduce'});
   await after.goto(base+path);await after.locator('.cp-synonym-word').waitFor();await after.evaluate(()=>document.fonts.ready);
   await after.mouse.move(0,0);await before.mouse.move(0,0);for(const p of [after,before])await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});
   const oldImage=await before.screenshot({animations:'disabled'}),newImage=await after.screenshot({animations:'disabled'});
   writeFileSync(`${output}/${engine.name()}-${viewport}-${theme}-before.png`,oldImage);writeFileSync(`${output}/${engine.name()}-${viewport}-${theme}-after.png`,newImage);
   const hash=b=>createHash('sha256').update(b).digest('hex');assert.equal(hash(newImage),hash(oldImage),'Original A1 question appearance');
   appearance.push({engine:engine.name(),viewport,theme,unchanged:true,sha256:hash(newImage)});
   await after.screenshot({path:`${output}/${engine.name()}-${viewport}-${theme}-preserved.png`,animations:'disabled'});await before.close();await after.close();await page.close();
  }
 }finally{await browser.close();}
}
assert.equal(new Set(checks.map(x=>x.id)).size,7);assert.equal(audio.length,28);assert.equal(appearance.length,8);assert.deepEqual(errors,[]);
writeFileSync(output+'/browser-checks.json',JSON.stringify({checks,audio,appearance,errors},null,2)+'\n');
console.log(JSON.stringify({questions:7,modeCases:checks.length,nativePlaybacks:audio.length,exactAppearanceComparisons:appearance.length,errors:0}));
