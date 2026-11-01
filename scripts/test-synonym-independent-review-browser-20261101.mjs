import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {synonymBank,synonymCollections,synonymExercises} from '../lib/synonyms.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const {chromium,webkit}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:19015',folder='docs/synonym-independent-review-20261101';
const online=base.startsWith('https'),out=process.env.KLINK_TEST_OUT||folder+(online?'/online':'/local');mkdirSync(out,{recursive:true});
const checks=[],layouts=[],modes=[],decoded=[],preserved=[],errors=[];
const route=(c,mode)=>base+'/'+chapterHash({chapter:'words',activity:mode,collection:c.id,level:c.level,help:'practice'});
const choices=p=>p.locator('.cp-choice-grid .cp-extended-option > button');
async function prepare(p,c,mode,reverse,id,seed=1){
 await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();
 await p.evaluate(({id,mode,reverse,target,seed})=>{localStorage.clear();localStorage.setItem('klink.synonym-settings.v1:'+id,JSON.stringify({seed,reverse}));if(target)localStorage.setItem('klink.group.v1:chapter:'+mode+':'+id+(reverse?':reverse':'')+':'+mode,JSON.stringify({version:1,done:false,exerciseId:target}));},{id:c.id,mode,reverse,target:id,seed});
 await p.goto(route(c,mode));await p.locator('[data-exercise-id]').waitFor();
}
async function verify(p,e,mode,wrong=true){
 await p.locator(`[data-exercise-id="${e.exerciseId}"]`).waitFor();assert.equal(await p.locator('.cp-task-card img,.cp-task-card video').count(),0);
 if(mode==='cards'){
  if(e.synonymContext)assert.equal(await p.locator('.cp-synonym-context').innerText(),e.synonymContext);
  assert.equal(await p.locator('.cp-card-front[aria-hidden="false"] strong').innerText(),e.cards[0].front.text);
  assert(await p.locator('.cp-exercise-feedback > button').isDisabled());await p.getByRole('button',{name:'Toon het synoniem',exact:true}).click();
  await p.waitForFunction(t=>document.querySelector('.cp-card-back[aria-hidden="false"] strong')?.innerText===t,e.cards[0].back.text);
 }else{
  if(mode==='hear-match'){
   assert.equal(await p.locator('.cp-synonym-word').count(),0);assert.equal(await p.locator('.cp-synonym-context').innerText(),e.synonymContext??'');
   await p.getByRole('button',{name:'Luister naar het woord',exact:true}).click();await p.waitForFunction(()=>!document.querySelector('.cp-choice-grid button')?.disabled);
  }else assert.equal(await p.locator('.cp-synonym-word').innerText(),e.synonymContext??e.prompt.text);
  assert.deepEqual(await choices(p).allTextContents(),e.options.map(o=>o.label));
  const right=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));if(wrong){await choices(p).nth((right+1)%4).click();await p.locator('.cp-exercise-feedback.wrong').waitFor();}
  await choices(p).nth(right).click();await p.locator('.cp-exercise-feedback.right').waitFor();assert((await p.locator('.cp-exercise-feedback').innerText()).includes(e.correctFeedback));
 }
}
async function fit(p,label){
 const m=await p.evaluate(()=>{const main=document.querySelector('.learner-main'),stage=document.querySelector('.cp-exercise-stage'),footer=document.querySelector('.cp-exercise-feedback').getBoundingClientRect(),nav=document.querySelector('.learner-nav'),limit=nav&&getComputedStyle(nav).position==='fixed'?nav.getBoundingClientRect().top:innerHeight;return{mainOverflow:main.scrollHeight-main.clientHeight,stageOverflow:stage.scrollHeight-stage.clientHeight,horizontal:document.documentElement.scrollWidth-innerWidth,footerBottom:footer.bottom,limit,cards:[...document.querySelectorAll('.cp-choice-grid .cp-extended-option > button')].map(x=>({width:x.clientWidth,height:x.clientHeight,overflow:x.scrollWidth-x.clientWidth,bottom:x.getBoundingClientRect().bottom}))};});
 assert(m.mainOverflow<=2&&m.stageOverflow<=2&&m.horizontal<=1&&m.footerBottom<=m.limit+2,label+JSON.stringify(m));assert(m.cards.every(c=>c.width>=44&&c.height>=44&&c.overflow<=1),label);return m;
}
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true,...(engine===chromium?{args:['--autoplay-policy=no-user-gesture-required']}:{} )});
 try{
  const jobs=synonymCollections.flatMap(c=>[false,true].map(reverse=>({c,reverse})));let at=0;
  await Promise.all(Array.from({length:3},async()=>{const p=await browser.newPage({viewport:{width:1366,height:768},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));try{while(at<jobs.length){const{c,reverse}=jobs[at++];await prepare(p,c,'synonyms',reverse);for(const e of synonymExercises(c.pack,'synonyms',1,reverse)){await verify(p,e,'synonyms');checks.push({engine:engine.name(),id:e.synonymPairId,reverse,fourCards:true,wrongAndRight:true,context:true,noPhotos:true});await p.locator('.cp-exercise-feedback > button').click();}}}finally{await p.close();}}));
  for(const level of ['a1','a2','b1']){
   const entry=synonymBank.entries.filter(e=>e.active&&e.minimumLevel===level&&e.context).sort((a,b)=>Math.max(b.context.length,b.reverseContext.length)-Math.max(a.context.length,a.reverseContext.length))[0];
   const c=synonymCollections.find(c=>c.exercises.some(e=>e.synonymPairId===entry.id));
   for(const reverse of [false,true])for(const mode of ['cards','hear-match']){
    const e=synonymExercises(c.pack,mode,1,reverse).find(e=>e.synonymPairId===entry.id),p=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));await prepare(p,c,mode,reverse,e.exerciseId);await verify(p,e,mode);await fit(p,`${engine.name()}:${level}:${mode}:${reverse}`);
    modes.push({engine:engine.name(),level,id:entry.id,mode,reverse,completed:true});await p.close();
   }
   for(const [width,height]of [[1366,768],[390,844],[320,740]])for(const theme of ['light','dark']){
    const p=await browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
    for(const reverse of [false,true]){const e=synonymExercises(c.pack,'synonyms',1,reverse).find(e=>e.synonymPairId===entry.id);await prepare(p,c,'synonyms',reverse,e.exerciseId);const before=await fit(p,`${engine.name()}:${level}:${width}:${theme}:${reverse}`);await verify(p,e,'synonyms');const after=await fit(p,`${engine.name()}:${level}:${width}:${theme}:${reverse}:feedback`);layouts.push({engine:engine.name(),level,id:entry.id,width,height,theme,reverse,before,after});if(!reverse&&engine===chromium&&width!==320)await p.screenshot({path:`${out}/${level}-${width}-${theme}.png`,animations:'disabled'});}
    await p.close();
   }
  }
  const p=await browser.newPage();await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();
  const inventory=JSON.parse(readFileSync(folder+'/audio-inventory.json'));
  const audio=await p.evaluate(async clips=>{const ctx=new AudioContext(),out=[];for(const c of clips){const r=await fetch(c.src);assertOk(r.ok,c.src);const bytes=await r.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');assertOk(hash===c.sha256,c.src);const b=await ctx.decodeAudioData(bytes);assertOk(b.duration>.15,c.src);out.push({src:c.src,sha256:hash,duration:b.duration});}await ctx.close();return out;function assertOk(x,label){if(!x)throw Error(label);}},inventory);decoded.push({engine:engine.name(),clips:audio});
  const c=synonymCollections.find(c=>c.level==='a1'&&c.exercises.length>3),mixed=synonymExercises(c.pack,'synonyms',2,true);await prepare(p,c,'synonyms',true,undefined,2);await verify(p,mixed[0],'synonyms');await p.locator('.cp-exercise-feedback > button').click();await p.locator(`[data-exercise-id="${mixed[1].exerciseId}"]`).waitFor();await p.reload();await p.locator(`[data-exercise-id="${mixed[1].exerciseId}"]`).waitFor();assert.equal(await p.getByRole('button',{name:'Wissel woord en synoniem',exact:true}).getAttribute('aria-pressed'),'true');assert.equal(await p.locator('.cp-synonym-controls').count(),1);modes.push({engine:engine.name(),mixAndResume:true,reverse:true,id:mixed[1].synonymPairId});await p.close();
  if(!online)for(const [width,height]of [[1366,768],[390,844]])for(const theme of ['light','dark']){
   const pages=await Promise.all([browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'}),browser.newPage({viewport:{width,height},colorScheme:theme,reducedMotion:'reduce'})]);
   const path='/#learner/chapters/words?level=a1&help=practice';for(const[i,p]of pages.entries()){await p.goto((i?base:'https://klink.taalroute.nl')+path);await p.locator('[data-chapter-activity="synonyms"]').waitFor();await p.evaluate(()=>document.fonts.ready);await p.mouse.move(0,0);}
   const images=await Promise.all(pages.map(p=>p.screenshot({animations:'disabled'}))),sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(sha(images[0]),sha(images[1]));preserved.push({engine:engine.name(),width,theme,pixelIdentical:true,sha256:sha(images[1])});for(const p of pages)await p.close();
  }
 }finally{await browser.close();}
}
assert.equal(checks.length,800);assert.equal(layouts.length,72);assert.equal(modes.length,26);assert.equal(decoded.length,2);assert.deepEqual(errors,[]);if(!online)assert.equal(preserved.length,8);
writeFileSync(out+'/browser-checks.json',JSON.stringify({checks,layouts,modes,decoded,preserved,errors},null,2)+'\n');console.log(JSON.stringify({allQuestionsBothDirections:checks.length,layouts:layouts.length,modeAndResume:modes.length,decoded:decoded.map(x=>x.clips.length),preserved:preserved.length,errors:0}));
