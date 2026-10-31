import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {productionIndex} from '../lib/production-practice.ts';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18949';
const out=process.env.KLINK_SENTENCE_OUTPUT||'docs/zinnen-a1-a2-20261031';mkdirSync(out,{recursive:true});
const rows=productionIndex.filter(r=>r.id.startsWith('klink-zinnen-zelf-')),checks=[],errors=[];
for(const[name,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const theme of ['light','dark'])for(const width of [1366,390])for(const row of rows){
  const page=await browser.newPage({viewport:{width,height:900},colorScheme:theme,hasTouch:width<650,isMobile:width<650});
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__sentencePlayed=[];
   window.addEventListener('klink-audio-source',e=>e.detail.addEventListener('playing',()=>window.__sentencePlayed.push(e.detail.currentSrc),{once:true}));
  });
  await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  const oldKey='klink.group.v1:groep-1:text-question',oldValue=JSON.stringify({version:1,done:false,exerciseId:'existing-progress-preservation'});
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[oldKey,oldValue]);
  const hash=chapterHash({chapter:'sentences',activity:'sentences',collection:row.id,level:row.level,help:'practice'});
  await page.goto(base+'/'+hash);
  const exercises=JSON.parse(readFileSync('public'+row.url)).exercises;
  let audioPlayed=0;
  for(const[index,e]of exercises.entries()){
   const stage=page.locator('[data-exercise-id="'+e.exerciseId+'"]');await stage.waitFor();
   assert.equal(await stage.locator('.cp-source-text p').innerText(),e.sourceText);
   assert.equal(await stage.locator('h4').innerText(),e.question);
   assert.equal(await stage.locator('.cp-source-proof').count(),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal overflow');
   if(index===0||(name==='chromium'&&theme==='light'&&width===1366)){
    const src=e.sourceBlocks[0].audio.src;
    await stage.locator('.cp-source-text button').click();
    await page.waitForFunction(src=>window.__sentencePlayed.some(url=>new URL(url).pathname===src),src);
    audioPlayed++;
   }
   const next=page.locator('.cp-exercise-feedback [data-practice-next]'),choices=stage.locator('.cp-choice-grid .cp-extended-option > button:first-child');
   assert.equal(await choices.count(),3);
   const correct=e.options.findIndex(o=>e.answer.correctOptionIds.includes(o.id));
   for(const wrong of [0,1,2].filter(n=>n!==correct)){
    await choices.nth(wrong).click();assert(await next.isDisabled());
    assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.feedback));
   }
   await choices.nth(correct).focus();await page.keyboard.press('Enter');
   await page.waitForFunction(()=>document.querySelector('.cp-exercise-feedback.right'));
   assert((await page.locator('.cp-exercise-feedback').innerText()).includes(e.correctFeedback));
   await page.waitForFunction(()=>{const next=document.querySelector('.cp-exercise-feedback [data-practice-next]');return next&&!next.disabled;});
   assert.equal(await stage.getAttribute('data-exercise-id'),e.exerciseId);
   if(index===0&&theme==='light')await page.screenshot({path:`${out}/${name}-${row.level}-${row.id.endsWith('r1')?'r1':'r2'}-${width}.png`,fullPage:true});
   await next.click();
   if(index===3){await page.reload();await page.locator('[data-exercise-id="'+exercises[index+1].exerciseId+'"]').waitFor();}
  }
  await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
  await page.reload();await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),oldKey),oldValue);
  await page.locator('.honest-empty').getByRole('button',{name:'Nog een keer',exact:true}).click();
  await page.locator('[data-exercise-id="'+exercises[0].exerciseId+'"]').waitFor();
  await page.getByRole('button',{name:'Andere opdracht',exact:true}).first().click();
  await page.locator('.cp-chapter-collection').first().waitFor();
  assert(new URL(page.url()).hash.includes('level='+row.level));assert(new URL(page.url()).hash.includes('help=practice'));
  checks.push({engine:name,theme,width,id:row.id,questions:exercises.length,audioPlayed,sourceVisible:true,wrongAnswersBlocked:true,correctFeedback:true,reloadResume:true,completedReload:true,retry:true,oldProgressPreserved:true,backPreservesSelection:true});
  console.log('PASS',name,theme,width,row.id);await page.close();
 }}finally{await browser.close();}
}
assert.deepEqual(errors,[]);assert.equal(checks.length,32);
writeFileSync(out+'/player-check.json',JSON.stringify({base,checks,errors,localOnly:base.startsWith('http://127.0.0.1')},null,2)+'\n');
console.log('PASS 32 complete journeys, 352 questions, both distractors, real audio, resume/retry/back and original progress');
