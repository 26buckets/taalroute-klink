import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {productionIndex,productionAssetUrl} from '../lib/production-practice.ts';
import {chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
import {readProductionBank} from './read-production-bank.mjs';
const base='http://127.0.0.1:19128',before='http://127.0.0.1:19127',out='outputs/practice-bundles-20261106/browser';
mkdirSync(out,{recursive:true});
const delivery=JSON.parse(readFileSync('data/klink-practice-delivery.json'));
const rows=productionIndex.filter(row=>Object.hasOwn(delivery,row.url));
const representative=[...new Map(rows.map(row=>[productionAssetUrl(row.url),row])).values()];
const route=row=>'/'+chapterHash({chapter:practiceChapters.find(c=>c.activities.includes(row.activity)).id,activity:row.activity,collection:row.id,level:row.level,help:row.help});
const first=row=>readProductionBank(row).exercises[0].exerciseId;
const task=(page,row)=>page.locator(`[data-exercise-id="${first(row)}"],[data-worksheet-exercise="${first(row)}"]`).first();
const checks=[],visual=[],errors=[];
function audioStub(){window.Audio=class extends EventTarget{constructor(src){super();this.src=src;this.dataset={};this.paused=true;}play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},40);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};}
try {
  for(const [engine,kind] of Object.entries({chromium,webkit})){
    const browser=await kind.launch();
    try{
      const context=await browser.newContext({viewport:{width:390,height:844}});await context.addInitScript(audioStub);
      const p=await context.newPage(),requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(new URL(r.url()).pathname));
      await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();
      assert(!requests.some(path=>path.startsWith('/practice-content/')),'Start must not download exercise bundles');
      for(const row of representative){await p.goto(base+route(row));await task(p,row).waitFor();assert(requests.includes(productionAssetUrl(row.url)));}
      checks.push({engine,bundlesOpened:representative.length,lazyLoading:true});await context.close();
      const retry=await browser.newContext();await retry.addInitScript(audioStub);const rp=await retry.newPage(),row=rows.find(r=>r.activity==='copy'),bundle=productionAssetUrl(row.url);
      await retry.route('**'+bundle,r=>r.fulfill({status:503,body:'temporary test outage'}));await rp.goto(base+route(row));await rp.getByRole('button',{name:'Probeer opnieuw',exact:true}).waitFor();
      await retry.unroute('**'+bundle);await rp.getByRole('button',{name:'Probeer opnieuw',exact:true}).click();await task(rp,row).waitFor();checks.push({engine,errorAndRetry:true});await retry.close();
      // The unchanged baseline client requests its old file URLs from the new server.
      const legacy=await browser.newContext();await legacy.addInitScript(audioStub);const restored=new Set();
      await legacy.route('**/practice-content/**',async r=>{const url=new URL(r.request().url());if(Object.hasOwn(delivery,url.pathname)){const response=await r.fetch({url:base+url.pathname+url.search});assert.equal(response.status(),200);restored.add(url.pathname);await r.fulfill({response});}else await r.continue();});
      const lp=await legacy.newPage();for(const old of [row,rows.find(r=>r.activity==='read-series')]){await lp.goto(before+route(old));await task(lp,old).waitFor();}
      assert(restored.has(row.url));assert(restored.has(rows.find(r=>r.activity==='read-series').url));checks.push({engine,oldClientOriginalUrls:[...restored]});await legacy.close();
      for(const width of [1366,390])for(const theme of ['light','dark']){
        for(const scene of ['home','copy','read-series','teacher']){
          const pair=[];
          for(const [side,origin] of [['before',before],['after',base]]){
            const c=await browser.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});if(['copy','read-series'].includes(scene))await c.addInitScript(audioStub);await c.addInitScript(t=>localStorage.setItem('taalroute-klink-appearance-v1',t),theme);
            const page=await c.newPage();page.on('pageerror',e=>errors.push({engine,width,theme,scene,side,error:e.message}));let surface;
            if(scene==='home'){await page.goto(origin+'/#learner/home');surface=page.locator('.cp-home');}
            else if(scene==='teacher'){await page.goto(origin+'/#teacher/plus?lesson=mat');await page.getByRole('button',{name:'Hulpmiddelen',exact:true}).click();await page.getByRole('button',{name:'Klankbord',exact:true}).click();surface=page.locator('.kpd-tool-dialog[open]');}
            else {const row=rows.find(r=>r.activity===scene);await page.goto(origin+route(row));surface=task(page,row);}
            await surface.waitFor();await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(0,0);
            const file=`${out}/${engine}-${width}-${theme}-${scene}-${side}.png`;await surface.screenshot({path:file,animations:'disabled',caret:'hide'});
            pair.push({file,text:await surface.innerText(),geometry:await surface.evaluate(el=>Array.from(el.querySelectorAll('button,input,h2,h3,img')).map(x=>({text:x.textContent,rect:x.getBoundingClientRect().toJSON()})))});await c.close();
          }
          assert.deepEqual(pair[0].geometry,pair[1].geometry);assert.equal(pair[0].text,pair[1].text);
          const a=await sharp(pair[0].file).ensureAlpha().raw().toBuffer(),b=await sharp(pair[1].file).ensureAlpha().raw().toBuffer();assert.equal(a.length,b.length);let changed=0;
          for(let i=0;i<a.length;i+=4)if([0,1,2].some(c=>Math.abs(a[i+c]-b[i+c])>10))changed++;
          visual.push({engine,width,theme,scene,changedPixels:changed});assert.equal(changed,0,JSON.stringify(visual.at(-1)));
        }
      }
    }finally{await browser.close();}
  }
  assert.deepEqual(errors,[]);assert.equal(visual.length,32);console.log('PASS: 226 bundle openings, two retries, four old-client links, 32 unchanged appearance pairs.');
}finally{writeFileSync(out+'/checks.json',JSON.stringify({checks,visual,errors},null,2)+'\n');}
