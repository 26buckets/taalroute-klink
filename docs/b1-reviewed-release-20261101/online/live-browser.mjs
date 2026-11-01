import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const repo=new URL('../../../',import.meta.url).pathname;
const rows=JSON.parse(readFileSync(repo+'data/klink-production-index.json')).filter(r=>r.id.startsWith('klink-flitslezen-b1-'));
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18961';
const out=process.env.KLINK_B1_OUTPUT||repo+'docs/b1-reviewed-release-20261101/online/browser/';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
await Promise.all([
 {engine:'chromium',width:1366,theme:'light',full:true},
 {engine:'webkit',width:390,theme:'dark',full:true},
 {engine:'chromium',width:320,theme:'light',full:true},
 {engine:'webkit',width:1366,theme:'dark',full:true},
].map(async config=>{
 const browser=await({chromium,webkit}[config.engine]).launch();
 let active='';
 try{
  const page=await browser.newPage({viewport:{width:config.width,height:900},colorScheme:config.theme,hasTouch:config.width<650,isMobile:config.width<650});
  page.setDefaultTimeout(20000);
  page.on('pageerror',e=>errors.push({config,active,error:e.message}));
  await page.addInitScript(()=>{window.__b1Media=[];const original=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){window.__b1Media.push(this);return original.call(this)}});
  const sentinel='b1-audit-unrelated-value';
  await page.addInitScript(value=>localStorage.setItem('b1-audit-sentinel',value),sentinel);
  for(const row of rows){
   active=row.id;
   const exercises=JSON.parse(readFileSync(repo+'public'+row.url)).exercises;
   await page.goto(base+'/#learner/chapters/texts/text-question/'+row.id+'?level=b1&help=practice');
   const selected=config.full?exercises:exercises.slice(0,1);
   for(const [index,e]of selected.entries()){
    const stage=page.locator('[data-exercise-id="'+e.exerciseId+'"]');await stage.waitFor({timeout:60000});
    assert.equal(await stage.locator('h4').innerText(),e.question);
    assert.deepEqual(await stage.locator('.cp-source-text p').allTextContents(),e.sourceBlocks.map(b=>b.text));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+e.exerciseId);
    const choices=stage.locator('.cp-choice-grid .cp-extended-option > button:first-child');
    assert.equal(await choices.count(),3);
    if(config.engine==='chromium'&&config.width===1366&&e.exerciseId.endsWith('Q1')){
     await stage.getByRole('button',{name:'Luister naar de tekst',exact:true}).click();
     const url=e.sourceBlocks[0].audio.src;
     await page.waitForFunction(url=>window.__b1Media.some(a=>a.src.endsWith(url)&&!a.paused&&a.currentTime>.05),url);
     // The CDN response is not seekable; verify a real ended event after accelerated playback.
     await page.evaluate(url=>{const a=window.__b1Media.findLast(a=>a.src.endsWith(url));window.__b1Ended=false;a.addEventListener('ended',()=>window.__b1Ended=true,{once:true});a.playbackRate=16},url);
     await page.waitForFunction(()=>window.__b1Ended);
     assert.equal(await stage.getAttribute('data-exercise-id'),e.exerciseId);
    }
    const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));
    const next=page.locator('.cp-exercise-feedback [data-practice-next]');
    for(const wrong of [0,1,2].filter(n=>n!==correct)){
     await choices.nth(wrong).click();
     assert(await next.isDisabled());
     assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.optionFeedback[e.options[wrong].id]),e.exerciseId+' wrong feedback');
    }
    await choices.nth(correct).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('.cp-exercise-feedback.right'));
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.optionFeedback[e.options[correct].id]));
    assert(await next.isEnabled());
    if(index===0 && ['klink-flitslezen-b1-r01','klink-flitslezen-b1-r04','klink-flitslezen-b1-r20'].includes(row.id))await page.screenshot({path:out+`${config.engine}-${config.width}-${row.id}.png`,fullPage:true});
    await next.click();
    if(config.full&&index===3){await page.reload();await page.locator('[data-exercise-id="'+exercises[4].exerciseId+'"]').waitFor();}
   }
   if(config.full){
    await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
    await page.reload();await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
    await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();
    await page.locator('[data-exercise-id="'+exercises[0].exerciseId+'"]').waitFor();
   }
   assert.equal(await page.evaluate(()=>localStorage.getItem('b1-audit-sentinel')),sentinel);
   checks.push({...config,id:row.id,questions:selected.length,feedbackChoices:selected.length*3,reloadAndRetry:config.full,nativeAudioFiles:config.engine==='chromium'&&config.width===1366?6:0,naturalEndPlaybackRate:16});
   writeFileSync(out+'checks.json',JSON.stringify({checks,errors},null,2));
   if(checks.length%10===0)console.log('checked '+checks.length+' rounds');
  }
 }catch(e){errors.push({config,active,error:String(e)});writeFileSync(out+'checks.json',JSON.stringify({checks,errors},null,2));throw e;}
 finally{await browser.close();}
}));
assert.deepEqual(errors,[]);
console.log(JSON.stringify({roundCases:checks.length,questions:checks.reduce((n,c)=>n+c.questions,0),feedbackChoices:checks.reduce((n,c)=>n+c.feedbackChoices,0),errors:errors.length}));
