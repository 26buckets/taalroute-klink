import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18948';
const out=process.env.KLINK_READING_OUTPUT||'docs/leesrondes-a1-a2-20261031';
mkdirSync(out,{recursive:true});
const rows=productionIndex.filter(r=>r.id.startsWith('klink-teksten-zelf-'));
const checks=[],errors=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{
  for(const theme of ['light','dark'])for(const width of [1366,390,320])for(const row of rows){
   const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme,hasTouch:width<650,isMobile:width<650});
   page.on('pageerror',e=>errors.push(e.message));
   const audio=[];page.on('request',r=>{if(/\.(mp3|wav|ogg|m4a)(?:\?|$)/.test(r.url()))audio.push(r.url());});
   await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
   const oldKey='klink.group.v1:groep-1:text-question',oldValue=JSON.stringify({version:1,done:false,exerciseId:'existing-progress-preservation'});
   await page.evaluate(([key,value])=>localStorage.setItem(key,value),[oldKey,oldValue]);
   const hash=chapterHash({chapter:'texts',activity:'text-question',collection:row.id,level:row.level,help:'practice'});
   await page.goto(base+'/'+hash);
   const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
   for(const[index,e]of exercises.entries()){
    const stage=page.locator('[data-exercise-id="'+e.exerciseId+'"]');await stage.waitFor();
    assert.equal(await page.locator('.cp-source-text p').first().innerText(),e.sourceText);
    assert.equal(await stage.locator('h4').innerText(),e.question);
    assert.equal(await page.locator('.cp-source-text button').count(),0);
    assert.equal(await page.locator('.cp-source-proof').count(),0,'Internal answer evidence must not overlap the learner choices');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
    const next=page.locator('.cp-exercise-feedback [data-practice-next]');
    const choices=page.locator('.cp-choice-grid .cp-extended-option > button:first-child');
    const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));
    const wrong=(correct+1)%3;
    await choices.nth(wrong).click();
    assert(await next.isDisabled(),'A wrong answer cannot finish or advance');
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.feedback));
    await choices.nth(correct).focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>document.querySelector('.cp-exercise-feedback.right'));
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.correctFeedback));
    assert(await next.isEnabled());
    assert.equal(await stage.getAttribute('data-exercise-id'),e.exerciseId,'Manual continuation retains the source');
    if(index===0&&theme==='light'&&(width===1366||width===390))await page.screenshot({path:`${out}/${name}-${row.level}-${width}.png`,fullPage:true});
    await next.click();
    if(index===3||index===7){await page.reload();await page.locator('[data-exercise-id="'+exercises[index+1].exerciseId+'"]').waitFor();}
   }
   await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   await page.reload();await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),oldKey),oldValue,'Existing progress retained');
   assert.deepEqual(audio,[],'No missing or unrelated audio requests');
   await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();
   await page.locator('[data-exercise-id="'+exercises[0].exerciseId+'"]').waitFor();
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),oldKey),oldValue);
   console.log('PASS journey',name,theme,width,row.level);
   checks.push({engine:name,theme,width,level:row.level,questions:12,wrongAnswersBlocked:true,correctFeedback:true,sourceVisible:true,reloadResume:true,completedReload:true,retry:true,oldProgressPreserved:true,audioRequests:audio.length});
   await page.close();
  }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);
writeFileSync(out+'/player-check.json',JSON.stringify({base,checks,errors,localOnly:base.startsWith('http://127.0.0.1')},null,2)+'\n');
console.log('PASS',checks.length,'complete reading journeys,',checks.length*12,'answers and retries, desktop/mobile, light/dark, Chromium/WebKit');
