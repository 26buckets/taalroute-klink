import {chromium,webkit} from 'playwright';import fs from 'node:fs';import assert from 'node:assert/strict';
import {functionalStorageKey,functionalBlocks} from '../lib/alfa-c-functioneel.ts';
import {teacherTasks,teacherStorageKey,startSession,appendEvent} from '../lib/alfa-c-docent.ts';
const base=process.env.KLINK_URL??'http://127.0.0.1:18938',checks=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.Audio=class extends EventTarget{play(){this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),10);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});
 await page.goto(base+'/#learner/alfa-c/lijst');await page.locator('[data-functional-step]').waitFor();
 const step=functionalBlocks.find(b=>b.id==='lijst').steps[7];
 await page.evaluate(({key})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{lijst:7},records:{}})),{key:functionalStorageKey});await page.reload();
 const idle=()=>page.waitForFunction(()=>!document.querySelector('.functional-player .pilot-tools button')?.disabled);
 for(const size of [{width:1366,height:768},{width:390,height:844},{width:320,height:568}]){
 await page.setViewportSize(size);if(size.width<1100)await page.getByRole('button',{name:'Opdracht',exact:true}).click();
 const box=page.getByRole('textbox',{name:'Jouw antwoord',exact:true});await box.fill('Mijn eigen boodschappenlijst');
 await page.reload();if(size.width<1100)await page.getByRole('button',{name:'Opdracht',exact:true}).click();assert.equal(await box.inputValue(),'Mijn eigen boodschappenlijst');
 await page.getByRole('button',{name:'Bewaar antwoord',exact:true}).click();await idle();
 await box.fill('Mijn verbeterde boodschappenlijst');await page.getByRole('button',{name:'Bewaar antwoord',exact:true}).click();await idle();
 const row=await page.evaluate(({key,id})=>JSON.parse(localStorage.getItem(key)).records[id],{key:functionalStorageKey,id:step.id});assert.equal(row.firstResponse.text,'Mijn eigen boodschappenlijst');assert.equal(row.response.text,'Mijn verbeterde boodschappenlijst');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 checks.push({engine,size,firstPreserved:true,draftReload:true});}
 await page.evaluate(key=>{const p=JSON.parse(localStorage.getItem(key));p.positions.lijst=11;localStorage.setItem(key,JSON.stringify(p));},functionalStorageKey);await page.reload();if(await page.getByRole('button',{name:'Tekst',exact:true}).isVisible())await page.getByRole('button',{name:'Tekst',exact:true}).click();assert((await page.locator('.ac-source-panel').innerText()).includes('Mijn verbeterde boodschappenlijst'));
 const now=new Date().toISOString(),d=teacherTasks.find(t=>t.kind==='dictation'),c=teacherTasks.find(t=>t.kind==='check');
 const prep=t=>({learner:'ONLINE-TEST',meeting:'fixture',lesson:'fixture',preparedMeeting:'prior',preparedAt:now,timezone:'Europe/Amsterdam',evidence:'fixture',checks:t.preparation.map(()=>true),exposure:'fixture',interveningActivity:'fixture',paperPresent:false});
 let store=startSession({version:1,sessions:[]},d,prep(d),now),id=store.sessions[0].id;
 for(const src of d.stages[0].audio)store=appendEvent(store,id,{type:'audio',stage:0,at:now,src});store=appendEvent(store,id,{type:'first',stage:0,at:now,text:'De pen lich naast het boek.',responseMedium:'digital'});store=startSession(store,c,prep(c),now);
 await page.evaluate(({key,store})=>localStorage.setItem(key,JSON.stringify(store)),{key:teacherStorageKey,store});
 await page.goto(base+'/#learner/alfa-c/docent-'+c.group);await page.reload();await page.getByLabel('Cursistcode',{exact:true}).fill('ONLINE-TEST');await page.getByLabel('Echte bijeenkomst / lescode').fill('fixture');await page.getByLabel('Boekdoel en lesplan').fill('fixture');await page.getByRole('button',{name:c.title,exact:true}).click();await page.getByRole('button',{name:'Open cursistscherm'}).click();
 assert((await page.locator('.ac-docent-digital').innerText()).includes('De pen lich naast het boek.'));
 await page.getByRole('textbox',{name:'Jouw antwoord',exact:true}).fill('De pen ligt naast het boek.');await page.getByRole('button',{name:'Bewaar antwoord',exact:true}).click();
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),teacherStorageKey);assert.equal(saved.sessions[0].events.find(e=>e.type==='first').text,'De pen lich naast het boek.');assert.equal(saved.sessions[1].events.find(e=>e.type==='first').text,'De pen ligt naast het boek.');assert.equal(saved.sessions[1].events.find(e=>e.type==='first').paperRef,undefined);checks.push({engine,teacherDigitalCorrection:true,originalPreserved:true});
 }finally{await browser.close();}}
assert.deepEqual(errors,[]);fs.writeFileSync('docs/production-20261029/online-browser-check.json',JSON.stringify({checks,errors},null,2));console.log('PASS online drafts, own notes, first attempts, digital correction and 3 screen sizes in both engines');
