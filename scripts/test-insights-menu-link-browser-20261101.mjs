import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996';
const out=process.env.KLINK_INSIGHTS_OUTPUT||'docs/insights-menu-link-20261101/local';
mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 try{for(const width of [320,390,768,1280])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:width<500?568:800},hasTouch:width<500,colorScheme:theme});
  page.on('pageerror',e=>errors.push({engine,width,theme,error:e.message}));
  try{
   await page.addInitScript(theme=>{localStorage.setItem('klink.insights.retention','kept');localStorage.setItem('taalroute-klink-appearance-v1',theme);},theme);
   await page.goto(base+'/#learner/home',{waitUntil:'domcontentloaded'});
   const trigger=page.locator('.hdr001-menu-trigger');await trigger.waitFor({state:'visible'});
   await page.locator('[data-share-app-trigger]').waitFor({state:'attached'});
   const before=await page.evaluate(()=>({url:location.href,storage:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))}));
   if(width<500)await trigger.tap();else await trigger.click();
   const panel=page.locator('.hdr001-panel'),link=panel.getByRole('link',{name:'Inzichten',exact:true});
   assert.equal(await link.count(),1);assert(await link.isVisible());
   assert.equal(await link.getAttribute('href'),'https://inzicht.taalroute.nl/');
   assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
   for(const name of ['Docentenhandleiding','Klink+docent'])assert(await panel.getByRole('link',{name,exact:true}).isVisible());
   assert(await panel.getByRole('button',{name:'Delen',exact:true}).isVisible());
   for(const name of ['Licht','Donker','Volg apparaat'])assert(await panel.getByRole('button',{name,exact:true}).isVisible());
   const geometry=await link.evaluate(a=>{const r=a.getBoundingClientRect(),p=a.parentElement.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height,panelLeft:p.left,panelRight:p.right,panelBottom:p.bottom,width:innerWidth,heightAvailable:innerHeight};});
   assert(geometry.height>=44&&geometry.left>=0&&geometry.right<=width&&geometry.bottom<=geometry.heightAvailable);
   assert(geometry.panelLeft>=0&&geometry.panelRight<=width&&geometry.panelBottom<=geometry.heightAvailable);
   if(engine==='chromium'&&theme==='light')await page.screenshot({path:out+'/menu-'+width+'.png'});
   const keyboard=width===320||width===1280;
   if(keyboard&&engine==='chromium'){
    for(let n=0;n<12&&!await link.evaluate(a=>a===document.activeElement);n++)await page.keyboard.press('Tab');
    assert(await link.evaluate(a=>a===document.activeElement),'Inzichten must be reachable with Tab');
   }
   const pending=page.waitForEvent('popup');
   if(keyboard&&engine==='webkit')await link.press('Enter');else if(keyboard)await page.keyboard.press('Enter');else if(width<500)await link.tap();else await link.click();
   const popup=await pending;await popup.waitForLoadState('domcontentloaded');
   await popup.getByRole('heading',{name:'Klink Inzicht',exact:true}).waitFor();
   assert.equal(new URL(popup.url()).hostname,'inzicht.taalroute.nl');
   assert(await popup.getByRole('button',{name:'Inloggen',exact:true}).isVisible());
   const after=await page.evaluate(()=>({url:location.href,storage:JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])))}));assert.deepEqual(after,before);
   assert.equal(await page.locator('.hdr001-menu').getAttribute('open'),null);
   await popup.close();
   await trigger.click();await page.keyboard.press('Escape');
   assert.equal(await page.locator('.hdr001-menu').getAttribute('open'),null);assert(await trigger.evaluate(e=>e===document.activeElement));
   checks.push({engine,width,theme,keyboard,keyboardMethod:keyboard?(engine==='chromium'?'native Tab then Enter':'locator focus then native Enter'):'pointer',oneLink:true,realDestination:true,existingMenuRetained:true,visibleWithoutScroll:true,sourcePageAndStoragePreserved:true,escapeRestoresFocus:true,geometry});
  }catch(e){errors.push({engine,width,theme,error:e.stack});}finally{await page.close();}
 }}finally{await browser.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors},null,2)+'\n');
assert.deepEqual(errors,[]);assert.equal(checks.length,16);console.log('16 Inzichten menu, destination, touch, keyboard and retention checks passed');
