import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_TITLE_OUTPUT||'outputs/single-practice-title-20261031/browser';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const[engineName,engine]of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{for(const width of [1366,390,320])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:900},hasTouch:width<600,isMobile:width<600,colorScheme:theme});
  page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/#learner/home');
  const details=page.locator('.cp-direct-explanation'),summary=details.locator('summary');
  await summary.waitFor();
  const storage=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
  if(width<600)await summary.tap();else{await summary.focus();await page.keyboard.press('Enter');}
  await page.waitForFunction(()=>document.querySelector('.cp-direct-explanation').open);
  assert.equal(await details.getByText('Zo oefen je',{exact:true}).count(),1);
  assert.equal(await details.locator('h2').count(),0);
  assert.deepEqual(await details.locator('.cp-line-number').allTextContents(),['1','2','3','4','5','6']);
  assert.equal(await details.locator('ol button').count(),6);
  for(const label of ['Kijken','Herkennen','Namaken','Zelf maken','Gebruiken','Herhalen']){
   const button=details.getByRole('button',{name:label+': bekijk de uitleg',exact:true});
   await button.click();
   const dialog=page.getByRole('dialog');await dialog.waitFor();
   assert.equal(await dialog.getByRole('heading',{name:label,exact:true}).count(),1);
   const frame=page.frameLocator('.cp-practice-explanation iframe');await frame.locator('body').waitFor();
   await page.getByRole('button',{name:'Uitleg sluiten',exact:true}).click();await dialog.waitFor({state:'hidden'});
  }
  await page.screenshot({path:out+'/'+engineName+'-'+width+'-'+theme+'.png',fullPage:true});
  if(width<600)await summary.tap();else{await summary.focus();await page.keyboard.press('Space');}
  await page.waitForFunction(()=>!document.querySelector('.cp-direct-explanation').open);
  assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))),storage);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.goto(base+'/#learner/packages');
  await page.locator('.cp-package-grid > button').first().click();
  await page.locator('.cp-tabs').getByRole('button',{name:'Oefenen met deze woorden',exact:true}).click();
  await page.locator('[data-group-practice] .cp-practice-line').waitFor();
  assert.equal(await page.locator('[data-group-practice] .cp-practice-line').getByRole('heading',{name:'Zo oefen je',exact:true}).count(),1);
  checks.push({engine:engineName,width,theme,singleTitle:true,sixExplanations:true,collapseKeysOrTouch:true,standaloneHeadingPreserved:true,storagePreserved:true});
  await page.close();
 }}finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2)+'\n');
assert.deepEqual(errors,[]);console.log(checks.length+' screen checks and 72 explanation interactions passed');
