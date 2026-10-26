import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const engines=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18836';
const out=process.env.KLINK_MOBILE_OUTPUT||'outputs/explanations-mobile-style';mkdirSync(out,{recursive:true});
const results=[];
for(const engine of (process.env.KLINK_TEST_ENGINES||'chromium,webkit,firefox').split(',')){
 const browser=await engines[engine].launch(engine==='firefox'&&process.env.FIREFOX_PATH?{executablePath:process.env.FIREFOX_PATH}:{});
 const context=await browser.newContext({hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 try{
  for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[667,375],[844,390]]){
   await page.setViewportSize({width,height});await page.goto(`${base}/#learner/home`);
   const cards=page.locator('.cp-practice-line-overview li > button');await cards.first().waitFor();
   const theme=await page.locator('.learner-app').evaluate(el=>{const s=getComputedStyle(el);return Object.fromEntries(['--ink','--primary','--radius','--line-strong','--focus'].map(k=>[k,s.getPropertyValue(k)]).concat([['fontFamily',s.fontFamily]]));});
   for(let step=0;step<6;step++){
    await cards.nth(step).tap();const dialog=page.getByRole('dialog');await dialog.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));
    const frame=page.frameLocator('.cp-practice-explanation iframe');await frame.locator('#scene svg').waitFor();
    const d=await dialog.boundingBox();assert(d.x>=0&&d.y>=0&&d.x+d.width<=width+1&&d.y+d.height<=height+1);
    const matched=await frame.locator('html').evaluate((el,t)=>{const s=getComputedStyle(el);return Object.entries(t).every(([k,v])=>(k==='fontFamily'?s.fontFamily:s.getPropertyValue(k))===v);},theme);assert(matched,'iframe inherits actual app colours, radius and font');
    assert.equal(await dialog.evaluate(el=>getComputedStyle(el).borderRadius),'4px');
    const dimensions=await frame.locator('body').evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));assert(dimensions.scrollWidth<=dimensions.width+1&&dimensions.scrollHeight<=dimensions.height+1,JSON.stringify({engine,width,height,step,...dimensions}));
    for(const selector of ['#play','#pause','#replay','summary','.mode']){
     const el=frame.locator(selector);await el.scrollIntoViewIfNeeded();const box=await el.boundingBox();assert(box.height>=48,`${selector} touch height`);
     assert(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+1),`${selector} readable without clipping`);
    }
    assert(['rgb(23, 63, 75)','rgb(13, 45, 54)'].includes(await frame.locator('#play').evaluate(el=>getComputedStyle(el).backgroundColor)));
    await frame.locator('#play').tap();assert(await frame.locator('#scene').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=-1&&r.bottom<=innerHeight}), 'animation stays visible while playing');await frame.locator('summary').tap();await frame.locator('#playback[inert]').waitFor({state:'attached'});
    const words=frame.locator('#description');const summaryBox=await frame.locator('summary').boundingBox();const wordBox=await words.boundingBox();
    assert(wordBox.y>=d.y&&wordBox.y+wordBox.height<=summaryBox.y+1);assert.equal(await words.evaluate(e=>getComputedStyle(e).fontSize),'18px');
    assert(await words.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
    const end=await words.evaluate(e=>{e.scrollTop=e.scrollHeight;return e.scrollTop+e.clientHeight>=e.scrollHeight-1});assert(end,'full explanation can be read');
    assert.deepEqual(await dialog.boundingBox(),d,'words preserve popup dimensions');
    if(step===2&&engine==='chromium')await page.screenshot({path:`${out}/words-${width}x${height}.png`});
    await frame.locator('summary').tap();await frame.locator('#still').check();await frame.locator('#next').tap();
    if(step===2&&engine==='chromium')await page.screenshot({path:`${out}/controls-${width}x${height}.png`});
    await dialog.getByRole('button',{name:'Uitleg sluiten'}).tap();await dialog.waitFor({state:'detached'});
   }
   results.push(`${engine} ${width}x${height}: six touch popups, matching app style, readable words, reachable controls and no page overflow`);
  }
  // Large explanation text must stay readable without hiding its close control.
  await page.setViewportSize({width:320,height:568});await page.locator('.cp-practice-line-overview li > button').nth(3).tap();const frame=page.frameLocator('.cp-practice-explanation iframe');await frame.locator('#scene svg').waitFor();
  await page.getByRole('dialog').evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));await frame.locator('#description').evaluate(el=>el.style.fontSize='36px');await frame.locator('summary').tap();const words=frame.locator('#description');
  assert(await words.evaluate(el=>{el.scrollTop=el.scrollHeight;return el.scrollWidth<=el.clientWidth+1&&el.scrollTop+el.clientHeight>=el.scrollHeight-1}));
  assert(await frame.locator('summary').isVisible());assert(await page.getByRole('button',{name:'Uitleg sluiten'}).isVisible());
  await words.evaluate(el=>el.scrollTop=0);if(engine==='chromium')await page.screenshot({path:`${out}/words-200-percent.png`});
  await page.getByRole('button',{name:'Uitleg sluiten'}).tap();assert.deepEqual(errors,[]);results.push(`${engine}: 200% explanation text remains complete and scrollable`);
 }finally{await browser.close();}
}
writeFileSync(`${out}/checks.json`,JSON.stringify({passed:true,results,physicalDeviceTested:false},null,2)+'\n');console.log(results.join('\n'));
