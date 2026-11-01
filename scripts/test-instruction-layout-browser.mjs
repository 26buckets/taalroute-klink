import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18984';
const reference=process.env.KLINK_REFERENCE_URL||'http://127.0.0.1:18985';
const out=process.env.KLINK_TEST_OUTPUT;assert(out,'Provide a separate output folder');mkdirSync(out,{recursive:true});
const hash='#learner/chapters/grammar/content-grammatica/content%3Agrammatica%3Aklink-local-grammar-g62-20261018%3Ab1%3Agrammar?level=b1&help=guided';
const results=[],comparisons=[];
async function configure(page,theme){await page.addInitScript(theme=>{localStorage.setItem('taalroute-klink-appearance-v1',theme);localStorage.setItem('instruction-review-sentinel','behouden');},theme);}
async function showStep(page){await page.locator('.cp-instruction-example h4').filter({hasText:'1. Schrijf'}).evaluate(node=>{const stage=node.closest('.cp-exercise-stage'),tools=stage.querySelector('.cp-exercise-tools');stage.scrollTop+=node.getBoundingClientRect().top-tools.getBoundingClientRect().bottom-16;});}
for(const [engineName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const width of [1366,390,320])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:950},colorScheme:theme,hasTouch:width<600}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await configure(page,theme);await page.goto(base+'/'+hash);await page.getByRole('button',{name:'Begin samen',exact:true}).click();await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
  assert.equal(await page.locator('.cp-instruction-example section').count(),4);assert.equal(await page.locator('.cp-instruction-example li').count(),6);
  const toolbar=page.locator('.cp-exercise-stage > .cp-exercise-tools'),stage=page.locator('.cp-exercise-stage');
  const position=await toolbar.boundingBox();
  for(const fraction of [0,.5,1]){
   await stage.evaluate((e,f)=>{e.scrollTop=(e.scrollHeight-e.clientHeight)*f;},fraction);
   const painted=await toolbar.evaluate(e=>({color:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow,position:getComputedStyle(e).position,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y},covered:document.elementFromPoint(e.getBoundingClientRect().x+4,e.getBoundingClientRect().y+4)===e}));
   assert(!['transparent','rgba(0, 0, 0, 0)'].includes(painted.color));assert.equal(painted.position,'sticky');assert(Math.abs(painted.rect.x-position.x)<1);assert(Math.abs(painted.rect.y-position.y)<2);assert(painted.covered);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  const input=page.getByRole('textbox',{name:'Je antwoord',exact:true});await input.fill('Mijn eigen antwoord blijft bewaard.');await input.press('Tab');
  await page.reload();await page.getByRole('button',{name:'De cursist kijkt niet mee',exact:true}).click();await page.getByRole('button',{name:'Begin deze stap',exact:true}).click();assert.equal(await input.inputValue(),'Mijn eigen antwoord blijft bewaard.');assert.equal(await page.evaluate(()=>localStorage.getItem('instruction-review-sentinel')),'behouden');
  await showStep(page);await page.screenshot({path:`${out}/voorbeeld-${engineName}-${width}-${theme}.png`,animations:'disabled'});
  assert.deepEqual(errors,[]);results.push({engine:engineName,width,theme,numberedTasks:true,sourceWordsPreserved:true,opaqueToolbarAtThreeScrollPositions:true,answerAfterReload:true,horizontalOverflow:false,pageErrors:errors});await page.close();
 }
 if(engineName==='chromium')for(const width of [1366,390])for(const theme of ['light','dark']){
  const shots=[];
  for(const url of [reference,base]){
   const page=await browser.newPage({viewport:{width,height:950},colorScheme:theme});await configure(page,theme);await page.goto(url+'/#learner/home');await page.locator('.cp-home').waitFor();await page.evaluate(()=>document.fonts.ready);shots.push(await page.screenshot({animations:'disabled'}));await page.close();
  }
  const [a,b]=await Promise.all(shots.map(x=>sharp(x).raw().toBuffer()));assert(a.equals(b),`Home changed ${width} ${theme}`);comparisons.push({screen:'Start',width,theme,pixelIdentical:true});
 }
 }finally{await browser.close();writeFileSync(out+'/browser.json',JSON.stringify({results,comparisons},null,2));}
}
console.log(JSON.stringify({scenarios:results.length,unchangedScreens:comparisons.length}));
