import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:4177';
const out=process.env.KLINK_LOADER_OUTPUT||'docs/opening-loader-duration-20261101/local';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})) {
 const browser=await type.launch();
 try {
  const cases=[];
  for(const width of [1280,390])for(const reducedMotion of ['no-preference','reduce'])for(const target of ['','learner','teacher/plus'])cases.push({width,reducedMotion,target,mode:'normal'});
  for(const target of ['learner','teacher/plus'])cases.push({width:390,reducedMotion:'no-preference',target,mode:'slow-module'});
  cases.push({width:390,reducedMotion:'no-preference',target:'learner',mode:'slow-image'},{width:390,reducedMotion:'no-preference',target:'learner',mode:'failed-image'});
  for(const c of cases) {
   const context=await browser.newContext({viewport:{width:c.width,height:844},reducedMotion:c.reducedMotion});
   const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
   await context.addInitScript(()=>{
    localStorage.setItem('opening-duration-check','saved progress');sessionStorage.setItem('opening-duration-check','saved lesson');
    const state={imageLoaded:0,firstVisible:0,firstRemoved:0};Object.assign(window,{openingDuration:state});let shown=false;
    document.addEventListener('load',e=>{if(e.target instanceof HTMLImageElement&&e.target.closest('.klink-opening-loader')&&!state.imageLoaded)state.imageLoaded=performance.now()},true);
    new MutationObserver(()=>{const present=!!document.querySelector('.klink-opening-loader');if(present&&!shown&&!state.firstVisible)state.firstVisible=performance.now();if(!present&&shown&&!state.firstRemoved)state.firstRemoved=performance.now();shown=present}).observe(document,{childList:true,subtree:true});
   });
   const started=Date.now();let moduleRequested=0;
   const chunk=c.target.startsWith('teacher/plus')?'teacher-classroom':'practice-workspace';
   await page.route('**/*',async route=>{
    const url=route.request().url();
    if(new RegExp('/'+chunk+'(?:[.-].*\\.(?:tsx|js)|\\.tsx)(?:\\?|$)').test(url)) {
     moduleRequested=Date.now()-started;
     if(c.mode==='slow-module')await new Promise(r=>setTimeout(r,3100));
    }
    if(url.includes('/opening-loader-quick-20261101/klink-loader.svg')) {
     if(c.mode==='slow-image')await new Promise(r=>setTimeout(r,1500));
     if(c.mode==='failed-image')return route.abort();
    }
    return route.continue();
   });
   await page.goto(base+'/'+(c.target?'#'+c.target:''),{waitUntil:'domcontentloaded'});
   const loader=page.locator('.klink-opening-loader');await loader.waitFor();
   assert.equal(await loader.locator('img').evaluate(i=>i.getBoundingClientRect().width),158);
   await page.waitForTimeout(500);assert(await loader.isVisible());assert.equal(await page.getByRole('button').count(),0);
   await loader.waitFor({state:'detached'});await page.getByRole('button').first().waitFor();
   const timing=await page.evaluate(()=>window.openingDuration);
   assert(timing.firstRemoved-timing.firstVisible>=1900,'Opening must last two seconds');
   if(c.mode!=='failed-image'){assert(timing.imageLoaded>0);assert(timing.firstRemoved-timing.imageLoaded>=1950,'Two seconds after the actual image load');}
   if(c.mode==='slow-module')assert(timing.firstRemoved>=moduleRequested+3000,'Wait for slow app code too');
   if(c.target)assert(moduleRequested>0&&moduleRequested<2000,'Load app code during opening, not afterwards');
   assert.equal(await page.evaluate(()=>localStorage.getItem('opening-duration-check')),'saved progress');assert.equal(await page.evaluate(()=>sessionStorage.getItem('opening-duration-check')),'saved lesson');
   assert.equal(await page.evaluate(()=>location.hash),c.target?'#'+c.target:'');
   if(!c.target){await page.evaluate(()=>{location.hash='learner'});await page.locator('.klink-opening-loader').waitFor({state:'detached'});await page.evaluate(()=>{location.hash=''});await page.waitForTimeout(100);await page.evaluate(()=>{location.hash='learner'});await page.waitForTimeout(100);assert.equal(await page.locator('.klink-opening-loader').count(),0,'Cached navigation has no repeated opening delay');}
   checks.push({...c,engine,timing,moduleRequested,minimumDuration:true,parallelLoading:!c.target||moduleRequested<2000,routeAndStoragePreserved:true,opens:true});await context.close();
  }
 } finally {await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalDevicesTested:false},null,2)+'\n');}
}
assert.equal(checks.length,32);assert.deepEqual(errors,[]);console.log('PASS 32 minimum-duration, parallel-load, slow/failed-image, routes and storage checks');
