import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {worksheets} from '../../lib/teacher-worksheets.ts';
import {getClassroomLesson} from '../../lib/teacher-classroom.ts';
const base=process.env.KLINK_URL||'http://127.0.0.1:18994',out=process.env.KLINK_DOCENT_OUTPUT||'/Users/nicoknoester/.cache/klink-worksheet-cleanup-proof-20261031/browser',smoke=process.env.KLINK_SMOKE==='1';
mkdirSync(out,{recursive:true});const checks=[],errors=[],comparisons=[];
const layout=p=>p.locator('.kpd-worksheet-heading,.kpd-worksheet-rounds,.kpd-worksheet-actions,.kpd-worksheet-previews').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y+scrollY,width:r.width,height:r.height};}));
for(const [engine,type]of Object.entries(smoke?{chromium}:{chromium,webkit})){
 const browser=await type.launch();try{for(const width of smoke?[320]:[1366,390,320])for(const theme of smoke?['light']:['light','dark']){
  const p=await browser.newPage({viewport:{width,height:900}});p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce',colorScheme:theme});
  let before;
  if(base.startsWith('http://127.0.0.1')&&!smoke){await p.goto('https://klink.taalroute.nl/#teacher/materials?lesson=mat&round=a');await p.locator('.kpd-worksheet-previews').waitFor();await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.querySelectorAll('.kpd-worksheet-previews img')].every(i=>i.complete&&i.naturalWidth>0));before=await layout(p);await p.locator('.kpd-worksheet-extras').screenshot({path:`${out}/${engine}-${width}-${theme}-before.png`});}
  for(const id of smoke?['mat']:['mat','bed','sok','maand']){
   const lesson=worksheets.find(l=>l.id===id);await p.goto(base+`/#teacher/materials?lesson=${id}&round=a`);await p.locator('.kpd-worksheet-previews').waitFor();await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await p.evaluate(()=>{window.printCalls=0;window.print=()=>window.printCalls++;});
   for(const round of ['a','b','c']){
    const sheet=lesson.rounds[round];await p.getByRole('link',{name:`${sheet.title} · ${sheet.level}`,exact:true}).click();await p.waitForFunction(pdf=>document.querySelector('.kpd-worksheet-actions a[download]')?.getAttribute('href')===pdf,sheet.pdf);await p.waitForFunction(()=>[...document.querySelectorAll('.kpd-worksheet-previews img')].every(i=>i.complete&&i.naturalWidth>0));
    assert.equal(await p.getByText('Extra materiaal',{exact:true}).count(),0);assert.equal(await p.locator('.kpd-extra-materials,.kpd-observation').count(),0);
    const summary=p.locator('.kpd-worksheet-answers summary');assert.equal(await summary.innerText(),'Antwoorden voor de docent');assert.equal(await summary.evaluate(e=>getComputedStyle(e.parentElement).paddingLeft),'20px');
    if(id==='mat'&&round==='a'){await p.evaluate(()=>document.fonts.ready);if(before){const after=await layout(p);for(let i=0;i<before.length;i++)for(const k of Object.keys(before[i]))assert(Math.abs(before[i][k]-after[i][k])<=1,`${engine}/${width}/${theme} changed ${i}/${k}: ${before[i][k]} -> ${after[i][k]}`);comparisons.push({engine,width,theme,upperLayoutUnchanged:true});}await p.locator('.kpd-worksheet-extras').screenshot({path:`${out}/${engine}-${width}-${theme}-after.png`});}
    await summary.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('.kpd-worksheet-answers').getAttribute('open'),'');assert.equal(await p.locator('.kpd-answers-print li').count(),10);
    const text=(await p.locator('.kpd-answers-print').innerText()).replace(/\s+/g,' ');for(const a of sheet.answers)assert(text.includes(a.answer.replace(/\s+/g,' ')),`${id}/${round}/${a.number}`);
    await p.getByRole('button',{name:'Print antwoorden',exact:true}).click();assert.equal(await p.evaluate(()=>window.printCalls),['a','b','c'].indexOf(round)+1);
    assert.equal(await p.getByRole('link',{name:'Downloaden',exact:true}).getAttribute('href'),sheet.pdf);assert.equal(await p.locator('.kpd-worksheet-answers a[download]').count(),lesson.planPdf?2:1);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${engine}/${width}/${theme}/${id}/${round} overflow`);await summary.focus();await p.keyboard.press('Space');assert.equal(await p.locator('.kpd-worksheet-answers').getAttribute('open'),null);
    checks.push({engine,width,theme,lesson:id,round,answers:true,keyboard:true,printAction:true,downloads:true,noExtras:true});
   }
   await p.getByRole('link',{name:`${lesson.title} · Digibordles`,exact:true}).click();await p.locator('[data-classroom="active"]').waitFor();await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await p.locator('.kpd-phases button').nth(3).click();const unit=getClassroomLesson(id).units[0];await p.locator('.kpd-tiles button:not(:disabled)').filter({hasText:new RegExp('^'+unit+'$')}).first().click();const state=await p.evaluate(()=>sessionStorage.getItem('klink.docent.les.v1'));await p.getByRole('button',{name:'Werkblad',exact:true}).click();await p.locator('.kpd-worksheet-previews').waitFor();await p.getByRole('link',{name:'Terug naar de les',exact:true}).click();await p.locator('.kpd-stage').waitFor();assert.equal(await p.evaluate(()=>sessionStorage.getItem('klink.docent.les.v1')),state);assert.equal(await p.locator('[data-tile-slot="0"]').innerText(),unit);await p.getByRole('button',{name:'Lesoverzicht',exact:true}).click();
   console.log('PASS',engine,width,theme,id);
  }
  await p.goto(base+'/#teacher/materials');await p.locator('.kpd-worksheet-grid').waitFor();assert.equal(await p.locator('.kpd-worksheet-lesson').count(),58);await p.close();
 }}finally{await browser.close();}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({base,checks,comparisons,errors,lessonReturns:checks.length/3,allFiftyEightPresent:true},null,2)+'\n');console.log('PASS',checks.length,'worksheet views, keyboard, answers, print action, downloads and lesson returns');
