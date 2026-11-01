import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:4177';
const out=process.env.KLINK_LOADER_OUTPUT||'docs/opening-loader-label-20261101/local';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try {
  for(const [width,height] of [[1280,800],[320,568]])for(const colorScheme of ['light','dark'])for(const reducedMotion of ['no-preference','reduce']){
   const target=colorScheme==='light'?'learner':'teacher/plus';
   const context=await browser.newContext({viewport:{width,height},colorScheme,reducedMotion});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await context.addInitScript(()=>{localStorage.setItem('loader-check','existing progress');sessionStorage.setItem('loader-check','existing lesson');window.loaderTiming={};new MutationObserver(()=>{const img=document.querySelector('.klink-opening-loader img');if(img&&!window.loaderTiming.shown){window.loaderTiming.shown=performance.now();img.decode().then(()=>window.loaderTiming.decoded=performance.now(),()=>window.loaderTiming.decoded=performance.now());}if(!img&&window.loaderTiming.shown&&!window.loaderTiming.removed)window.loaderTiming.removed=performance.now();}).observe(document,{childList:true,subtree:true});});
   let release,arrived;const held=new Promise(r=>release=r),requested=new Promise(r=>arrived=r);
   const chunk=target==='learner'?'practice-workspace':'teacher-classroom';
   await page.route('**/*',async route=>{
    if(new RegExp('/'+chunk+'[.-].*\\.(?:tsx|js)(?:\\?|$)|/'+chunk+'\\.tsx').test(route.request().url())){const response=await route.fetch();arrived();await held;await route.fulfill({response});}
    else await route.continue();
   });
   await page.goto(base+'/#'+target,{waitUntil:'domcontentloaded'});
   await Promise.race([requested,new Promise((_,reject)=>setTimeout(()=>reject(Error('module not requested')),30000))]);
   const loader=page.locator('.klink-opening-loader'),img=loader.locator('img'),label=loader.locator('.klink-opening-label');
   await label.waitFor({state:'visible'});await img.evaluate(i=>i.decode());
   assert.equal(await label.innerText(),'Klink wordt geopend…');
   assert.equal(await loader.getAttribute('aria-live'),'polite');assert.equal(await loader.getAttribute('aria-atomic'),'true');
   const imageRect=await img.boundingBox(),labelRect=await label.boundingBox(),loaderRect=await loader.boundingBox();
   assert.equal(imageRect.width,158);assert(Math.abs(imageRect.x+imageRect.width/2-width/2)<1);assert(Math.abs(imageRect.y+imageRect.height/2-(loaderRect.y+loaderRect.height/2))<1,'Original image centre retained');
   assert(Math.abs(labelRect.x+labelRect.width/2-width/2)<1);assert(labelRect.y>=imageRect.y+imageRect.height+8);assert(labelRect.y+labelRect.height<height);
   const style=await label.evaluate(e=>({fontSize:getComputedStyle(e).fontSize,weight:getComputedStyle(e).fontWeight,color:getComputedStyle(e).color,clip:getComputedStyle(e).getPropertyValue('clip'),opacity:getComputedStyle(e).opacity}));
   assert.equal(style.fontSize,'14px');assert.equal(style.weight,'400');assert.equal(style.clip,'auto');assert.equal(style.opacity,'1');
   const src=await img.evaluate(i=>i.currentSrc);assert(src.endsWith(reducedMotion==='reduce'?'klink-static.svg':'klink-loader.svg'));
   assert.equal(await loader.getByRole('button').count(),0);assert.equal(await loader.getByRole('progressbar').count(),0);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`${out}/${engine}-${width}-${colorScheme}-${reducedMotion}.png`});
   release();await loader.waitFor({state:'detached'});await page.locator('button').first().waitFor();
   const timing=await page.evaluate(()=>window.loaderTiming);assert(timing.removed-timing.decoded>=1900,JSON.stringify(timing));
   assert.equal(await page.evaluate(()=>localStorage.getItem('loader-check')),'existing progress');assert.equal(await page.evaluate(()=>sessionStorage.getItem('loader-check')),'existing lesson');assert.equal(await page.evaluate(()=>location.hash),'#'+target);
   checks.push({engine,width,height,colorScheme,reducedMotion,target,visibleLabel:true,exactText:true,imageCentreUnchanged:true,compactWidth:imageRect.width,labelBelow:true,noOverflow:true,accessible:true,originalAsset:true,minimumTwoSeconds:true,removedWhenReady:true,storagePreserved:true,routePreserved:true,style,timing});
   await context.close();
  }
 }finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalDevicesTested:false},null,2)+'\n');}
}
assert.equal(checks.length,16);assert.deepEqual(errors,[]);console.log('PASS 16 label, size, placement, accessibility, minimum duration, route and storage checks');
