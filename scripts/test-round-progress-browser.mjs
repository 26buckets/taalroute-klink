import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {exerciseSetHelp} from '../lib/content-levels.ts';
import {chapterCollections,chapterHash,practiceChapters} from '../lib/practice-chapters.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const base=process.env.KLINK_URL??'http://127.0.0.1:18937',checks=[],errors=[];
const out=process.env.KLINK_PROGRESS_OUTPUT??'outputs/round-progress';fs.mkdirSync(out,{recursive:true});
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 const page=await browser.newPage({viewport:{width:1366,height:900}});page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.Audio=class extends EventTarget{play(){this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),10);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
 const activity='copy', c=chapterCollections(activity).find(c=>c.id==='route-verbinden.alfa-a');
 const location={chapter:practiceChapters.find(c=>c.activities.includes(activity)).id,activity,collection:c.id,level:c.level,help:exerciseSetHelp(c.exercises)};
 const open=async(loc=location)=>{await page.goto(base+'/'+chapterHash(loc));};
 const key=roundProgressPrefix+collectionProgressId(activity,c.id);
 const count=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)??'{"done":[]}').done.length,key);
 await open();await page.locator('[data-exercise-id]').waitFor();assert.equal(await count(),0,'Opening does not count');
 const box=page.getByRole('textbox').first();await box.fill('fout');await page.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await count(),0,'Wrong answers do not finish a task');
 for(const [i,ex] of c.exercises.entries()){
   await page.locator(`[data-exercise-id="${ex.exerciseId}"]`).waitFor();await box.fill(ex.exampleWord);await page.getByRole('button',{name:'Controleer',exact:true}).click();await page.waitForFunction(({key,n})=>JSON.parse(localStorage.getItem(key)??'{"done":[]}').done.length===n,{key,n:i+1});
   if(i===0){await page.getByRole('button',{name:'Andere opdracht',exact:true}).click();const card=page.locator(`[data-collection="${c.id}"]`);await card.waitFor();assert((await card.innerText()).includes('1 van 2 gedaan'));assert(!(await card.getAttribute('class')).includes('is-complete'));await card.click();await box.fill(ex.exampleWord);await page.getByRole('button',{name:'Controleer',exact:true}).click();assert.equal(await count(),1,'Same task is counted once');}
   await page.locator('.cp-exercise-feedback').getByRole('button').last().click();
 }
 await page.getByRole('heading',{name:'Goed geoefend',exact:true}).waitFor();await page.locator('.learner-main').getByRole('button',{name:'Nog een keer',exact:true}).click();await page.locator('[data-exercise-id]').waitFor();await page.getByRole('button',{name:'Andere opdracht',exact:true}).click();await page.reload();
 const card=page.locator(`[data-collection="${c.id}"]`);await card.waitFor();assert((await card.innerText()).includes('Afgerond · 2 van 2'));assert((await card.getAttribute('class')).includes('is-complete'));
 for(const width of [1366,768,390,320]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await card.focus();assert(await card.evaluate(el=>el===document.activeElement));await card.screenshot({path:`${out}/${engine}-${width}-card.png`});}
 checks.push({engine,copy:true,partial:true,wrongExcluded:true,deduplicated:true,repeatAndReload:true,widths:[1366,768,390,320]});
 // Fresh lazy-loaded production collection stays lazy on its overview and counts actual answers.
 await page.setViewportSize({width:1366,height:900});const prod=chapterCollections('copy').find(c=>c.contentUrl&&c.level==='alfa-a');const ex=JSON.parse(fs.readFileSync('public'+prod.contentUrl)).exercises[0];
 await open({...location,collection:prod.id,level:prod.level,help:prod.help});await page.locator(`[data-exercise-id="${ex.exerciseId}"]`).waitFor();await box.fill(ex.exampleWord);await page.getByRole('button',{name:'Controleer',exact:true}).click();
 const pkey=roundProgressPrefix+collectionProgressId('copy',prod.id,prod.contentUrl);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)??'{"done":[]}').done.length===1,pkey);checks.push({engine,lazyProduction:true});
 // The same onAttempt path also covers simultaneous sheet answers, independent of the Klaar navigation.
 const sheet=chapterCollections('same-word').find(c=>c.id==='groep-10.alfa-a');await open({chapter:practiceChapters.find(c=>c.activities.includes('same-word')).id,activity:'same-word',collection:sheet.id,level:'alfa-a',help:exerciseSetHelp(sheet.exercises)});await page.getByRole('button',{name:'Op één blad',exact:true}).click();const row=page.locator('[data-sheet-exercise]').first();const sx=sheet.exercises[0];await row.getByRole('button',{name:sx.exampleWord,exact:true}).click();
 const skey=roundProgressPrefix+collectionProgressId('same-word',sheet.id);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)??'{"done":[]}').done.length===1,skey);await page.getByRole('button',{name:'Klaar',exact:true}).click();assert.equal(await page.locator(`[data-collection="${sheet.id}"]`).locator('.cp-round-status').innerText(),`1 van ${sheet.exercises.length} gedaan`);checks.push({engine,sheet:true});
 const worksheet=chapterCollections('worksheet').find(c=>c.id==='route-delen.alfa-a');const wx=worksheet.exercises[0];await open({chapter:practiceChapters.find(c=>c.activities.includes('worksheet')).id,activity:'worksheet',collection:worksheet.id,level:worksheet.level,help:exerciseSetHelp(worksheet.exercises)});const wr=page.locator('[data-worksheet-exercise]').first();await wr.waitFor();for(const id of wx.answer.targetTileIds){await wr.locator('.cp-tile-bank').getByRole('button',{name:wx.tiles.find(t=>t.id===id).token,exact:true}).click();}const wkey=roundProgressPrefix+collectionProgressId('worksheet',worksheet.id);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)??'{"done":[]}').done.length===1,wkey);checks.push({engine,worksheet:true});
 // Blocked writes must keep the exercise working and disclose the missing persistence.
 const denied=await browser.newPage();await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('Quota exceeded');};window.Audio=class extends EventTarget{play(){setTimeout(()=>this.dispatchEvent(new Event('ended')),10);return Promise.resolve();}pause(){}};});await denied.goto(base+'/'+chapterHash(location));await denied.getByRole('textbox').first().fill(c.exercises[0].exampleWord);await denied.getByRole('button',{name:'Controleer',exact:true}).click();await denied.getByRole('alert').filter({hasText:'Je voortgang kan niet'}).waitFor();checks.push({engine,storageFailureVisible:true});await denied.close();
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(`${out}/report.json`,JSON.stringify({checks,errors},null,2));console.log('PASS round progress browser',checks.length);
