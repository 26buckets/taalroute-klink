import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import extra from '../../data/klink-docent-extra-lessons-10-15.json' with {type:'json'};
import {getClassroomLesson} from '../../lib/teacher-classroom.ts';
const base=process.env.KLINK_URL??'https://klink.taalroute.nl',smoke=process.env.KLINK_SMOKE==='1',checks=[],errors=[];
for(const[name,engine]of Object.entries(smoke?{chromium}:{chromium,webkit})){
 const b=await engine.launch();try{for(const width of smoke?[390]:[1366,390]){
  const p=await b.newPage({viewport:{width,height:900}});p.setDefaultTimeout(20000);p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{window.audioPlayed=[];const play=Reflect.get(HTMLMediaElement.prototype,'play');HTMLMediaElement.prototype.play=function(){this.addEventListener('ended',()=>window.audioPlayed.push(this.currentSrc),{once:true});return play.call(this);};});await p.emulateMedia({reducedMotion:'reduce'});
  await p.goto(base+'/#teacher/plus');await p.getByRole('button',{name:'Les openen: mat',exact:true}).waitFor();assert.equal(await p.locator('.kpd-lesson-choice').count(),58);
  for(const source of smoke?extra.filter(l=>l.id==='maand'):extra){
   const l=getClassroomLesson(source.id);await p.getByRole('button',{name:'Les openen: '+l.id,exact:true}).click();
   for(const [index,r]of ['a','b','c'].entries()){
    await p.locator('.kpd-rounds button').nth(index).click();await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await p.locator('.kpd-phases button').nth(3).click();
    const hide=p.getByRole('button',{name:'Oplossing verbergen',exact:true});if(await hide.count())await hide.click();
    if(r==='a'){for(const u of l.units)await p.locator('.kpd-tiles button:not(:disabled)').filter({hasText:new RegExp('^'+u+'$')}).first().click();}
    else for(const word of l.routes[r].cards){const buttons=await p.locator('.kpd-word-cards').getByRole('button',{name:word,exact:true}).all();for(const button of buttons)if(await button.isEnabled()){await button.click();break;}}
    await p.getByRole('button',{name:'Kijk na',exact:true}).click();assert.match(await p.locator(r==='a'?'.kpd-stage output':'.kpd-route-feedback').innerText(),/Ja,/);
    await p.getByRole('button',{name:'Werkblad',exact:true}).click();await p.locator('.kpd-worksheet-previews').waitFor();const s=source.worksheet.rounds[r];assert.equal(await p.getByRole('link',{name:'Downloaden',exact:true}).getAttribute('href'),s.pdf);
    await p.getByText('Antwoorden voor de docent',{exact:true}).click();assert.equal(await p.locator('.kpd-answers-print li').count(),10);assert.equal(await p.locator(`a[href="${s.answerPdf}"]`).count(),1);assert.equal(await p.locator(`a[href="${source.worksheet.planPdf}"]`).count(),1);
    await p.getByRole('link',{name:'Terug naar de les',exact:true}).click();await p.locator('.kpd-rounds [aria-current]').waitFor();assert((await p.locator('.kpd-position').innerText()).includes('4 van 8'));
   }
   if(width===1366){await p.locator('.kpd-rounds button').first().click();await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await p.locator('.kpd-phases button').nth(1).click();const listen=p.locator('.kpd-stage').getByRole('button',{name:'Luister',exact:true});await p.waitForFunction(()=>[...document.querySelectorAll('.kpd-stage button')].some(b=>b.textContent.trim()==='Luister'&&!b.disabled));await listen.click();await p.waitForFunction(src=>window.audioPlayed.some(url=>url.endsWith(src)),l.word.audio);}
   await p.getByRole('button',{name:'Lesoverzicht',exact:true}).click();checks.push({engine:name,width,lesson:l.id,allThreeRounds:true,lettersAndCardsCorrect:true,worksheetsAnswersPlan:true,matchingRoundReturn:true,nativeWordPlayback:width===1366});console.log("LIVE",name,width,l.id);
  }
  await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.close();
 }
 const p=await b.newPage({viewport:{width:320,height:844}});await p.goto(base+'/#teacher/plus');await p.getByRole('button',{name:'Les openen: maand',exact:true}).click();await p.evaluate(()=>document.fonts.ready.then(()=>true));assert.equal(await p.locator('.kpd-big-word').evaluate(e=>getComputedStyle(e).fontSize),'80px');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.close();
 }finally{await b.close();}
}
assert.deepEqual(errors,[]);const out={base,checks,errors,allPreviousLessonsPresent:true,narrowMonthFits:true,learnerHome:true};if(!smoke)writeFileSync('docs/lespakketten-10-15-20261031/live-browser-checks.json',JSON.stringify(out,null,2)+'\n');console.log('PASS',checks.length,'served lesson journeys, all three rounds, worksheets, answers, plans and returns; 320px month and learner home');
