import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {classroomLessons} from '../lib/teacher-classroom.ts';
const base=process.env.KLINK_URL||'http://127.0.0.1:18981',out=process.env.KLINK_DOCENT_OUTPUT||'outputs/docent-lessen-release-20261031/lessons';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{for(const width of [1366,390,320]){
  const page=await browser.newPage({viewport:{width,height:width===1366?900:844}});await page.emulateMedia({reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.audioPlayed=[];const play=Reflect.get(HTMLMediaElement.prototype,'play');HTMLMediaElement.prototype.play=function(){this.addEventListener('ended',()=>window.audioPlayed.push(this.currentSrc),{once:true});return play.call(this);};});
  await page.goto(base+'/#teacher/plus');await page.getByRole('button',{name:'Les openen: mat',exact:true}).waitFor();
  assert.equal(await page.locator('.kpd-lesson-choice').count(),classroomLessons.length);assert.equal(await page.locator('.kpd-home-header a').count(),0);
  await page.locator('.kpd-lesson-choice img').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
  await page.screenshot({path:`${out}/${engine}-${width}-lessons.png`});
  for(const lesson of classroomLessons){
   await page.getByRole('button',{name:`Les openen: ${lesson.id}`,exact:true}).click();
   assert(await page.locator('.kpd-big-word').isVisible());assert.equal(await page.locator('.kpd-big-word').innerText(),lesson.id);
   for(const [round,route] of ['a','b','c'].entries()){
    await page.locator('.kpd-rounds button').nth(round).click();
    for(let phase=0;phase<8;phase++){
     await page.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await page.locator('.kpd-phases button').nth(phase).click();
     assert((await page.locator('.kpd-position').innerText()).includes(`${phase+1} van 8`));
     if(phase===0){
      // Compare page coordinates: clicking a control below the fold can scroll it into view.
      const buttons=page.locator('.kpd-visibility-controls button'),before=await buttons.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height}}));
      assert.equal(await buttons.count(),2);assert.equal(await page.getByRole('button',{name:'Foto groter',exact:true}).count(),0);
      for(const i of [0,1,0,1]){await buttons.nth(i).click();const after=await buttons.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height}}));for(let j=0;j<2;j++)for(const k of ['x','y','width','height'])assert(Math.abs(after[j][k]-before[j][k])<=1,`moving control ${lesson.id} ${route} ${width} ${k}`);}
     }
     const reveal=page.getByRole('button',{name:phase===6&&route==='c'?'Voorbeeldzin tonen':route==='b'?'Zin tonen':'Tekst tonen',exact:true});if(await reveal.count())await reveal.click();
     if(phase===3){
      if(route==='a'){
       const hide=page.getByRole('button',{name:'Oplossing verbergen',exact:true});if(await hide.count())await hide.click();
       for(const unit of lesson.units)await page.locator('.kpd-tiles button:not(:disabled)').filter({hasText:new RegExp('^'+unit+'$')}).first().click();
      }else for(const word of lesson.routes[route].cards)await page.locator('.kpd-word-cards').getByRole('button',{name:word,exact:true}).all().then(async buttons=>{for(const button of buttons)if(await button.isEnabled()){await button.click();break;}});
      await page.getByRole('button',{name:'Kijk na',exact:true}).click();assert((await page.locator(route==='a'?'.kpd-stage output':'.kpd-route-feedback').innerText()).includes('Ja,'));
     }
     if(phase===6&&route==='c')await page.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).fill(`Mijn zin over ${lesson.id}.`);
     assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${lesson.id} ${route}/${phase} overflow at ${engine} ${width}`);
     if(width===1366){const box=await page.locator('.kpd-footer').boundingBox();assert(box.y+box.height<=902,`${lesson.id} ${route}/${phase} footer`);}
    }
   }
   // Every lesson uses its own existing word recording, with native playback.
   if(width===1366){
    await page.locator('.kpd-rounds button').first().click();await page.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await page.locator('.kpd-phases button').nth(1).click();
    const listen=page.locator('.kpd-stage').getByRole('button',{name:'Luister',exact:true});await page.waitForFunction(()=>[...document.querySelectorAll('.kpd-stage button')].some(b=>b.textContent.trim()==='Luister'&&!b.disabled));await listen.click();
    await page.waitForFunction(src=>window.audioPlayed.some(url=>url.endsWith(src)),lesson.word.audio);
   }
   await page.locator('.kpd-rounds button').nth(2).click();await page.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await page.locator('.kpd-phases button').nth(6).click();
   assert.equal(await page.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).inputValue(),`Mijn zin over ${lesson.id}.`);
   await page.reload();await page.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).waitFor();assert.equal(await page.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).inputValue(),`Mijn zin over ${lesson.id}.`);
   assert(!/Alfa [ABC]|Voorkennis|Lesbezoekkader/.test(await page.locator('.kpd-live').innerText()));
   await page.getByRole('button',{name:'Lesoverzicht',exact:true}).click();checks.push({engine,width,lesson:lesson.id,phases:24,responseReload:true,audio:width===1366});
  }
  // Reopening an earlier lesson restores its own answer, never the last lesson's.
  await page.getByRole('button',{name:'Les openen: tas',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Schrijf hier je eigen zin.'}).inputValue(),'Mijn zin over tas.');
  await page.close();
 }}finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({checks,errors},null,2));console.log('PASS',checks.length,'lesson journeys /',checks.length*24,'phase views');
