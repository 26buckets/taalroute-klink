import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:4173';
const out=process.env.KLINK_LOADER_OUTPUT||'docs/opening-loader-repair-20261101/local';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{
  for(const[width,height]of [[390,844]])for(const colorScheme of['light'])for(const reducedMotion of['no-preference','reduce'])for(const target of['learner']){
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
   const rect=await img.boundingBox();assert.equal(rect.width,158);assert(rect.x>=0&&rect.y>=0&&rect.x+rect.width<=width&&rect.y+rect.height<=height);
   const name=`${engine}-${width}-${colorScheme}-${reducedMotion}-${target.replace('/','-')}`;
   await page.screenshot({path:out+'/'+name+'.png'});
   let staticStable=null,oneShot=null;
   if(reducedMotion==='reduce'){
    const a=await img.screenshot();await page.waitForTimeout(120);assert(a.equals(await img.screenshot()));staticStable=true;
    await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('.klink-opening-loader img')?.currentSrc.endsWith('klink-loader.svg'));
    await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.klink-opening-loader img')?.currentSrc.endsWith('klink-static.svg'));
   }else{
    const position=async()=>{const {data,info}=await sharp(await img.screenshot()).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x=0,y=0,n=0;for(let j=0;j<data.length;j+=4)if(data[j+1]>data[j]+30&&data[j+1]>data[j+2]+15){x+=(j/4)%info.width;y+=Math.floor(j/4/info.width);n++}assert(n>40,'Original green dot is visible');return{x:x/n,y:y/n}};
    const a=await position();await page.waitForTimeout(180);const b=await position();assert(Math.hypot(a.x-b.x,a.y-b.y)>1,'Dot must visibly move during loading, not only show a still frame');
    await page.waitForTimeout(2000);const c=await img.screenshot();await page.waitForTimeout(150);assert(c.equals(await img.screenshot()));oneShot=true;
   }
   release();await loader.waitFor({state:'detached'});await page.locator('button').first().waitFor();
   assert.equal(await page.evaluate(()=>localStorage.getItem('loader-check')),'existing progress');assert.equal(await page.evaluate(()=>sessionStorage.getItem('loader-check')),'existing lesson');
   assert.equal(await page.evaluate(()=>location.hash),'#'+target);
   checks.push({engine,width,height,colorScheme,reducedMotion,target,src,staticStable,oneShot,visibleDuringLoad:true,actualMotion:reducedMotion==='reduce'?null:oneShot,compactWidth:rect.width,removedWhenReady:true,noControls:true,noFakeProgress:true,storagePreserved:true,routePreserved:true});
   await context.close();
  }
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await page.goto(base,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.klink-opening-loader').count(),1);await context.close();
 }finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalDevicesTested:false},null,2)+'\n');}
}
assert.equal(checks.length,4);assert.deepEqual(errors,[]);console.log('PASS 4 actual-motion/reduced-motion and one-shot checks, plus initial server loader');
