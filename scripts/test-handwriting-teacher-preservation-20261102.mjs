import assert from'node:assert/strict';
import{mkdirSync,writeFileSync}from'node:fs';
import{chromium,webkit}from'playwright';
const folder='docs/handwriting-20261102/',candidate=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031',baseline='https://klink.taalroute.nl',out=process.env.KLINK_TEST_OUTPUT||folder+'local';mkdirSync(out+'/teacher-preservation',{recursive:true});
const before=await(await fetch(baseline+'/release.json')).json();assert.equal(before.sourceCommit,'c67c6f73518626c212adacf7e3a672856c697f84');const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
 try{for(const width of[1280,390,320])for(const theme of['light','dark']){
  const captures={};
  for(const[label,base]of Object.entries({baseline,candidate})){
   const page=await browser.newPage({viewport:{width,height:844}});page.on('pageerror',error=>errors.push({engine,width,theme,label,message:error.message}));
   await page.goto(base);await page.evaluate(theme=>window.TaalrouteAppearance.set(theme),theme);await page.goto(base+'/#teacher/plus');await page.getByRole('button',{name:'Les openen: mat',exact:true}).click();await page.locator('[data-classroom="active"]').waitFor();await page.getByRole('button',{name:'Hulpmiddelen',exact:true}).click();await page.getByRole('button',{name:'Schrijfbord',exact:true}).click();
   const dialog=page.locator('dialog.kpd-tool-dialog'),svg=dialog.locator('svg.kpd-writing');await svg.waitFor();await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);assert.equal(await svg.getAttribute('class'),'kpd-writing');
   await page.evaluate(()=>document.activeElement?.blur());const blank=await dialog.screenshot({animations:'disabled',path:`${out}/teacher-preservation/${engine}-${width}-${theme}-${label}-blank.png`}),box=await svg.boundingBox();
   await page.mouse.move(box.x+box.width*.2,box.y+box.height*.25);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.7);await page.waitForFunction(()=>document.querySelector('dialog .kpd-writing polyline')?.getAttribute('points').split(' ').length>=2);await page.mouse.up();const points=await svg.locator('polyline').getAttribute('points');assert(points);
   await dialog.getByRole('textbox',{name:'Of typ op het bord',exact:true}).fill('Mijn eigen tekst');await dialog.getByRole('heading',{name:'Schrijfbord',exact:true}).click();await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement?.blur());const drawn=await dialog.screenshot({animations:'disabled',path:`${out}/teacher-preservation/${engine}-${width}-${theme}-${label}-drawn.png`});
   captures[label]={blank,drawn,points,box};await dialog.getByRole('button',{name:'Laatste lijn weg',exact:true}).click();assert.equal(await svg.locator('polyline').count(),0);assert.equal(await dialog.getByRole('textbox').inputValue(),'Mijn eigen tekst');await dialog.getByRole('button',{name:'Wis bord',exact:true}).click();assert.equal(await dialog.getByRole('textbox').inputValue(),'');await page.close();
  }
  assert.deepEqual(captures.candidate.box,captures.baseline.box);assert.equal(captures.candidate.points,captures.baseline.points);
  for(const state of['blank','drawn']){assert(captures.candidate[state].equals(captures.baseline[state]),`${engine}/${width}/${theme}/${state}: original teacher board must remain pixel-identical`);checks.push({engine,width,theme,state,pixelIdentical:true,nativeDrawingAndTypingPreserved:true,undoAndClearPreserved:true});}
 }}finally{await browser.close();}
}}finally{writeFileSync(out+'/teacher-preservation.json',JSON.stringify({baselineSourceCommit:before.sourceCommit,candidate,checks,errors,physicalPointingDeviceTested:false},null,2)+'\n');}
assert.equal((await(await fetch(baseline+'/release.json')).json()).sourceCommit,before.sourceCommit);assert.equal(checks.length,24);assert.deepEqual(errors,[]);console.log('Passed24 pixel-identical existing teacher writing boards with native drawing,typing,undo and clear in Chromium/WebKit at1280/390/320,light/dark.');
