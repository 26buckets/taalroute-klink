const { chromium,webkit }=require('./klink-current/node_modules/playwright');
const { mkdirSync,writeFileSync,readFileSync }=require('node:fs');
const assert=require('node:assert/strict');
const sharp=require('./klink-current/node_modules/sharp');
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:4173',phase=process.argv[2]||'before';
const dir=`work/loader-screen-checks/${phase}`;mkdirSync(dir,{recursive:true});
(async()=>{const checks=[],errors=[];
for(const[engine,type]of Object.entries({chromium,webkit})){const browser=await type.launch();try{for(const[width,height]of [[1280,800],[390,844]])for(const colorScheme of['light','dark']){
 const context=await browser.newContext({viewport:{width,height},colorScheme,reducedMotion:'reduce'});const page=await context.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>errors.push(e.message));
 for(const[name,hash,selector]of[['entry','','.entry-screen'],['learner','#learner','button'],['teacher','#teacher/plus','button']]){
  await page.goto(base+'/'+hash,{waitUntil:'domcontentloaded'});await page.waitForTimeout(1400);await page.locator('button').first().waitFor();await page.getByText('Klink wordt geopend…',{exact:true}).waitFor({state:'hidden'});await page.evaluate(()=>Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,2000))]));await page.waitForTimeout(250);
  const file=`${engine}-${width}-${colorScheme}-${name}.png`;await page.screenshot({path:dir+'/'+file});
  const item={engine,width,height,colorScheme,name,hash,scrollWidth:await page.evaluate(()=>document.documentElement.scrollWidth)};
  if(phase!=='before'){const prior=await sharp(readFileSync('work/loader-screen-checks/before/'+file)).raw().toBuffer(),current=await sharp(readFileSync(dir+'/'+file)).raw().toBuffer();item.pixelIdentical=prior.equals(current);item.changedChannels=prior.reduce((n,v,i)=>n+(v!==current[i]),0);item.changedFraction=item.changedChannels/prior.length;assert(item.changedFraction<0.001,file+' differs beyond edge antialiasing: '+item.changedFraction);}
  checks.push(item);
 }
 await context.close();
}}finally{await browser.close();writeFileSync(dir+'/checks.json',JSON.stringify({base,checks,errors},null,2));}}
assert.equal(checks.length,24);assert.deepEqual(errors,[]);console.log('PASS '+phase+' 24 desktop/mobile/light/dark views');})().catch(e=>{console.error(e);process.exit(1)});
