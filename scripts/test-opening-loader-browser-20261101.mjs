import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:4173';
const out=process.env.KLINK_LOADER_OUTPUT||'docs/opening-loader-20261101/local';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{
  for(const[width,height]of [[1280,800],[390,844]])for(const colorScheme of['light','dark'])for(const reducedMotion of['no-preference','reduce'])for(const target of['learner','teacher/plus']){
   const context=await browser.newContext({viewport:{width,height},colorScheme,reducedMotion});
   const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
   await context.addInitScript(()=>{localStorage.setItem('loader-check','existing progress');sessionStorage.setItem('loader-check','existing lesson');});
   let release,arrived;const held=new Promise(r=>release=r),requested=new Promise(r=>arrived=r);
   const chunk=target==='learner'?'practice-workspace':'teacher-classroom';
   await page.route('**/*',async route=>{
    if(new RegExp('/'+chunk+'[.-].*\\.(?:tsx|js)(?:\\?|$)|/'+chunk+'\\.tsx').test(route.request().url())){const response=await route.fetch();arrived();await held;await route.fulfill({response});}
    else await route.continue();
   });
   await page.goto(base+'/#'+target,{waitUntil:'domcontentloaded'});
   await Promise.race([requested,new Promise((_,reject)=>setTimeout(()=>reject(Error('lazy module not requested: '+chunk)),30000))]);
   const loader=page.locator('.klink-opening-loader');await loader.waitFor();
   const img=loader.locator('img');await img.evaluate(i=>i.decode());
   const src=await img.evaluate(i=>i.currentSrc);assert(src.endsWith(reducedMotion==='reduce'?'klink-static.svg':'klink-loader.svg'));
   assert.equal(await loader.getByRole('button').count(),0);assert.equal(await loader.getByRole('progressbar').count(),0);
   assert.equal(await loader.getAttribute('aria-live'),'polite');assert.equal(await loader.innerText(),'Klink wordt geopend…');
   const rect=await img.boundingBox();assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height);
   const name=`${engine}-${width}-${colorScheme}-${reducedMotion}-${target.replace('/','-')}`;
   await page.screenshot({path:out+'/'+name+'.png'});
   let staticStable=null,oneShot=null;
   if(reducedMotion==='reduce'){
    const a=await img.screenshot();await page.waitForTimeout(120);assert(a.equals(await img.screenshot()));staticStable=true;
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('.klink-opening-loader img')?.currentSrc.endsWith('klink-loader.svg'));
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.klink-opening-loader img')?.currentSrc.endsWith('klink-static.svg'));
   }else if(width===1280&&colorScheme==='light'&&target==='learner'){
    await page.waitForTimeout(4900);const a=await img.screenshot();await page.waitForTimeout(250);assert(a.equals(await img.screenshot()));oneShot=true;
   }
   release();await loader.waitFor({state:'detached'});await page.locator('button').first().waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('loader-check')),'existing progress');assert.equal(await page.evaluate(()=>sessionStorage.getItem('loader-check')),'existing lesson');
   assert.equal(await page.evaluate(()=>location.hash),'#'+target);
   checks.push({engine,width,height,colorScheme,reducedMotion,target,src,staticStable,oneShot,visibleDuringLoad:true,removedWhenReady:true,noControls:true,noFakeProgress:true,storagePreserved:true,routePreserved:true});
   await context.close();
  }
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(base,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.klink-opening-loader').count(),1);await context.close();
 }finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalDevicesTested:false},null,2)+'\n');}
}
assert.equal(checks.length,32);assert.deepEqual(errors,[]);console.log('PASS 32 slow-load / two engines / two sizes / themes / reduced-motion checks, plus initial server loader');
