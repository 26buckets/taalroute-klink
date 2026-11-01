import assert from 'node:assert/strict';
import {readFileSync as read,writeFileSync as write,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18950';
const out=process.env.KLINK_COMPLETE_OUTPUT||'docs/klink-complete-release-20261101/browser';
mkdirSync(out,{recursive:true});
const manifest=JSON.parse(read('docs/klink-complete-release-20261101/import-manifest.json'));
const rows=manifest.rows,checks=[],errors=[];
let configurations=[
 {engine:'chromium',width:1366,theme:'light',full:true},
 {engine:'webkit',width:390,theme:'dark',full:true},
 {engine:'chromium',width:320,theme:'dark',full:false},
 {engine:'webkit',width:1366,theme:'light',full:false},
 {engine:'chromium',width:390,theme:'light',full:false},
 {engine:'webkit',width:320,theme:'dark',full:false},
];
if(process.env.KLINK_COMPLETE_SMOKE)configurations.splice(1);
else configurations=configurations.flatMap(c=>c.full?[0,1,2,3].map(partition=>({...c,partition})):c);
async function playModel(page,source,button,full){
 const before=await page.evaluate(()=>window.__completeAudio.played.length);
 await button.click();
 await page.waitForFunction(({source,before})=>window.__completeAudio.played.length>before&&window.__completeAudio.played.slice(before).some(s=>new URL(s).pathname===source),{source,before});
 const endBefore=await page.evaluate(()=>window.__completeAudio.ended.length);
 if(!full){
  await page.waitForFunction(source=>window.__completeAudio.elements.some(a=>new URL(a.currentSrc||location.href).pathname===source&&Number.isFinite(a.duration)),source);
  await page.evaluate(source=>{const a=window.__completeAudio.elements.findLast(a=>new URL(a.currentSrc||location.href).pathname===source);a.currentTime=Math.max(0,a.duration-0.15);},source);
 }
 await page.waitForFunction(({source,endBefore})=>window.__completeAudio.ended.length>endBefore&&window.__completeAudio.ended.slice(endBefore).some(s=>new URL(s).pathname===source),{source,endBefore},{timeout:full?90000:20000});
 assert(await page.evaluate(()=>new Set(window.__completeAudio.elements.filter(a=>!a.paused&&!a.ended)).size<=1));
}
await Promise.all(configurations.map(async config=>{
 const browser=await({chromium,webkit}[config.engine]).launch();
 let activeRow='';
 try{
  const page=await browser.newPage({viewport:{width:config.width,height:900},colorScheme:config.theme,hasTouch:config.width<650,isMobile:config.width<650});
  page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push({config,message:e.message}));
  await page.addInitScript(()=>{
   window.__completeAudio={played:[],ended:[],elements:[]};
   window.addEventListener('klink-audio-source',event=>{
    const a=event.detail;window.__completeAudio.elements.push(a);
    a.addEventListener('playing',()=>window.__completeAudio.played.push(a.currentSrc));
    a.addEventListener('ended',()=>window.__completeAudio.ended.push(a.currentSrc));
   });
  });
  const sentinelKey='klink.group.v1:groep-1:text-question',sentinel=JSON.stringify({version:1,done:false,exerciseId:'unrelated-progress-must-stay'});
  await page.addInitScript(([key,value])=>{if(!localStorage.getItem(key))localStorage.setItem(key,value);},[sentinelKey,sentinel]);
  const fullyPlayedLevels=new Set();
  const heardSources=new Set();
  for(const [round,row]of rows.entries()){
   if(config.full&&config.partition!==undefined&&round%4!==config.partition)continue;
   activeRow=row.id;
   const exercises=JSON.parse(read('public'+row.url)).exercises;
   const chapter=row.activity==='sentences'?'sentences':row.activity==='sentence-speak'?'speaking':'texts';
   const hash='#learner/chapters/'+chapter+'/'+row.activity+'/'+encodeURIComponent(row.id)+'?level='+row.level+'&help=practice';
   await page.goto(base+'/'+hash);
   let played=0,questionCount=0;
   const selected=config.full?exercises:exercises.slice(0,1);
   for(const [index,e]of selected.entries()){
    const stage=page.locator('[data-exercise-id="'+e.exerciseId+'"]');await stage.waitFor({timeout:60000});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow '+e.exerciseId);
    const next=page.locator('.cp-exercise-feedback [data-practice-next]');
    if(e.mode==='text-question'){
     assert.equal(await stage.locator('h4').innerText(),e.question);
     assert.deepEqual(await stage.locator('.cp-source-text p').allTextContents(),e.sourceBlocks.map(b=>b.text));
     for(const [blockIndex,block]of e.sourceBlocks.entries())if(!heardSources.has(block.audio.src)){
      const type=row.activity+':'+row.level;
      await playModel(page,block.audio.src,page.getByRole('button',{name:'Luister naar de tekst',exact:true}).nth(blockIndex),!fullyPlayedLevels.has(type));
      fullyPlayedLevels.add(type);heardSources.add(block.audio.src);played++;
     }
     const choices=stage.locator('.cp-choice-grid .cp-extended-option > button:first-child');assert.equal(await choices.count(),3);
     const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));
     for(const wrong of [0,1,2].filter(n=>n!==correct)){
      await choices.nth(wrong).click();assert(await next.isDisabled());
      assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.optionFeedback[e.options[wrong].id]),e.exerciseId+' wrong feedback');
      assert.equal(await stage.getAttribute('data-exercise-id'),e.exerciseId);
     }
     await choices.nth(correct).focus();await page.keyboard.press('Enter');
     await page.waitForFunction(()=>document.querySelector('.cp-exercise-feedback.right'));
     assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.optionFeedback[e.options[correct].id]));
     questionCount++;
    }else{
     assert.equal(e.mode,'sentence-speak');
     const type='speech:'+row.level;
     await playModel(page,e.prompt.audio.src,page.getByRole('button',{name:'Luister naar '+e.displayWord,exact:true}).first(),!fullyPlayedLevels.has(type));
     fullyPlayedLevels.add(type);
     played++;
     await stage.getByRole('button',{name:'Klaar',exact:true}).click();
    }
    await next.waitFor({state:'visible'});assert(!(await next.isDisabled()),e.exerciseId+' next enabled');
    if(index===0&&['klink-teksten-zelf-a1-r02-v1','klink-teksten-zelf-a2-r34-v1','klink-flitslezen-b1-r20','klink-zeg-de-zin-b1-r10'].includes(row.id)){
     await page.screenshot({path:`${out}/${config.engine}-${config.width}-${config.theme}-${row.id}.png`,fullPage:true});
    }
    await next.click();
    if(config.full&&index===3&&index+1<exercises.length){await page.reload();await page.locator('[data-exercise-id="'+exercises[index+1].exerciseId+'"]').waitFor();}
   }
   if(config.full){
    await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
    await page.reload();await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
    await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();
    await page.locator('[data-exercise-id="'+exercises[0].exerciseId+'"]').waitFor();
   }
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),sentinelKey),sentinel);
   checks.push({...config,id:row.id,questions:questionCount,nativeModelPlaybacks:played,wrongAnswersBlocked:true,choiceFeedback:true,progressPreserved:true,reloadAndRetry:config.full,acceleratedSeekUsed:played>0});
   write(out+'/checks.json',JSON.stringify({base,audioMethod:'Native start/end checks; most recordings seek near the end for state testing. The first source per activity/level plays fully. Full recordings are independently transcribed without source prompts.',checks,errors},null,2)+'\n');
   if(round%10===0)console.log(config.engine+' '+config.width+' '+config.theme+' '+(round+1)+'/'+rows.length);
   if(process.env.KLINK_COMPLETE_SMOKE&&round===2)break;
  }
 }catch(error){errors.push({config,id:activeRow,message:String(error)});write(out+'/failure.json',JSON.stringify({checks,errors},null,2));throw error;}finally{await browser.close();}
}));
assert.deepEqual(errors,[]);
console.log(JSON.stringify({roundChecks:checks.length,questions:checks.reduce((n,x)=>n+x.questions,0),nativeModelPlaybacks:checks.reduce((n,x)=>n+x.nativeModelPlaybacks,0),errors:errors.length}));
