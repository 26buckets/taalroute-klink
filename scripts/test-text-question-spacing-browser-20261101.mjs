import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996',folder='outputs/text-question-spacing-20261101',out=process.env.KLINK_SPACING_OUTPUT||folder+'/local';mkdirSync(out,{recursive:true});
const baselineFile=folder+'/baselines.json',baselines=existsSync(baselineFile)?JSON.parse(readFileSync(baselineFile)):{};
const rows=productionIndex.filter(r=>r.id.startsWith('klink-teksten-zelf-')),checks=[],native=[],errors=[];
const oldKey='klink.group.v1:groep-1:text-question',oldValue=JSON.stringify({version:1,done:false,exerciseId:'existing-progress-preservation'});
const route=row=>chapterHash({chapter:'texts',activity:'text-question',collection:row.id,level:row.level,help:'practice'});
async function open(browser,url,row,viewport,theme){
 const p=await browser.newPage({viewport,hasTouch:true,isMobile:viewport.width<600,colorScheme:theme});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(({key,value})=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);window.__spacingEnded=[];window.addEventListener('klink-audio-source',e=>{window.__spacingAudio=e.detail;const a=e.detail;if(a.__spacingObserved)return;a.__spacingObserved=true;a.addEventListener('ended',()=>window.__spacingEnded.push(new URL(a.src).pathname));});},{key:oldKey,value:oldValue});
 await p.goto(url+'/'+route(row));await p.locator('.cp-extended-task h4').waitFor();return p;
}
async function metrics(p){return p.locator('.cp-extended-task').evaluate(e=>{
 const q=e.querySelector('h4'),choices=e.querySelector('.cp-choice-grid'),s=e.querySelector('.cp-source-text'),r=q.getBoundingClientRect(),c=choices.getBoundingClientRect(),stage=e.closest('.cp-exercise-stage').getBoundingClientRect(),font=e=>{const s=getComputedStyle(e);return[s.fontSize,s.fontWeight,s.lineHeight];};
 return{gap:c.top-r.bottom,source:s.innerText,question:q.innerText,sourceFont:font(s.querySelector('p')),questionFont:font(q),buttonFonts:[...choices.querySelectorAll('.cp-extended-option > button:first-child')].map(font),buttonSizes:[...choices.querySelectorAll('.cp-extended-option > button:first-child')].map(e=>{const r=e.getBoundingClientRect();return[r.width,r.height];}),sourceWidth:s.getBoundingClientRect().width,choicesWidth:c.width,answerBottom:c.bottom,stageBottom:stage.bottom,choicesFit:c.bottom<=stage.bottom+1,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });}
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({ignoreDefaultArgs:['--mute-audio']});
 try{for(const[width,height,theme]of[[1686,885,'light'],[1366,768,'light'],[1024,768,'light'],[390,844,'light'],[375,667,'light'],[320,568,'light'],[740,390,'light'],[390,844,'dark']])for(const row of rows){
  const key=[engine,width,height,theme,row.id].join('-'),viewport={width,height};
  if(!baselines[key]){const old=await open(browser,'https://klink.taalroute.nl',row,viewport,theme);baselines[key]=await metrics(old);writeFileSync(baselineFile,JSON.stringify(baselines,null,2)+'\n');if(engine==='chromium'&&width===1686&&row.level==='a1')await old.screenshot({path:folder+'/before-desktop.png'});await old.close();}
  const before=baselines[key],p=await open(browser,base,row,viewport,theme),exercises=JSON.parse(readFileSync('public'+row.url)).exercises,steps=theme==='light'&&[1366,390].includes(width)?12:1;
  for(let i=0;i<steps;i++){
   const exercise=exercises[i];await p.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();await p.locator('.cp-exercise-stage').evaluate(e=>e.scrollTop=0);
   const m=await metrics(p);assert(m.gap>=0&&m.gap<=20,JSON.stringify({key,i,...m}));assert(!m.overflow);assert.deepEqual(m.sourceFont,before.sourceFont);assert.deepEqual(m.questionFont,before.questionFont);assert(m.buttonFonts.every(f=>JSON.stringify(f)===JSON.stringify(before.buttonFonts[0])));assert(m.buttonSizes.every(s=>s[0]>=48&&s[1]>=48));assert.equal(m.sourceWidth,before.sourceWidth);assert.equal(m.choicesWidth,before.choicesWidth);
   assert.equal(await p.locator('.cp-source-text p').first().innerText(),exercise.sourceText);assert.equal(m.question,exercise.question);
   if(engine==='chromium'&&i===0&&row.level==='a1'&&theme==='light'&&[1686,390,320].includes(width))await p.screenshot({path:out+'/'+width+'-compact.png'});
   if(width===390&&theme==='light'&&row.level==='a1'&&i===0){
    await p.locator('.cp-listen-slot button').tap();await p.waitForFunction(()=>window.__spacingAudio.currentTime>0&&!window.__spacingAudio.paused);
    const toggle=p.locator('[data-view-toggle="text"]');await toggle.tap();assert.equal(await toggle.getAttribute('aria-pressed'),'false');assert(await p.evaluate(()=>!window.__spacingAudio.paused));await toggle.focus();await p.keyboard.press('Space');assert.equal(await toggle.getAttribute('aria-pressed'),'true');
    await p.waitForFunction(src=>window.__spacingEnded.includes(src),exercise.sourceBlocks[0].audio.src,{timeout:45000});assert(await p.evaluate(()=>!window.__spacingAudio.error&&!window.__spacingAudio.muted));
    native.push({engine,originalAudio:true,completePlayback:true,textToggleDuringPlayback:true,spaceToggle:true,oldProgressPreserved:await p.evaluate(k=>localStorage.getItem(k),oldKey)===oldValue});
   }
   const id=exercise.answer.correctOptionIds[0],index=exercise.options.findIndex(o=>o.id===id);await p.locator('.cp-choice-grid .cp-extended-option > button:first-child').nth(index).tap();assert(await p.locator('[data-practice-next]').isEnabled());
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),oldKey),oldValue);
   checks.push({engine,width,height,theme,row:row.id,exerciseId:exercise.exerciseId,beforeGap:before.gap,...m,oldProgressPreserved:true});
   if(steps===12){await p.locator('.cp-exercise-record-head h3').click();await p.keyboard.press(i%2?'ArrowRight':'Enter');if(i===11)await p.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();}
  }
  await p.close();
 }console.log(engine,'60 compact text-question cases PASS');}finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,native,errors},null,2)+'\n');}
}
assert.equal(checks.length,120);assert.equal(native.length,2);assert.deepEqual(errors,[]);console.log('PASS 120 reading question layouts, answer/keyboard/progress checks and two original full audio trials');
