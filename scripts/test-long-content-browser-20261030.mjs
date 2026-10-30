import assert from 'node:assert/strict';
import {readFileSync as read,writeFileSync as write} from 'node:fs';
import {chromium,webkit} from 'playwright';
import review from '../data/klink-long-content-levels.json' with {type:'json'};
import {chapterCollections} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18949',dir='docs/long-content-review-20261030';
const clips=[...JSON.parse(read(dir+'/audio.json')),...JSON.parse(read('docs/cooking-release-20261030/audio.json'))],checks=[],errors=[];
const row=ref=>review.items.find(r=>r.ref===ref);
const url=(chapter,activity,r,level=r.level.toLowerCase(),help='guided')=>`${base}/#learner/chapters/${chapter}/${activity}/${r.contentId}?level=${level}&help=${help}`;
for(const [engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true});
 try{
  const page=await browser.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.reviewPlayed=[];const play=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'play').value;HTMLMediaElement.prototype.play=function(){window.reviewPlayed.push(this.src);return play.call(this);};});
  await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  for(const c of clips){
   const duration=await page.evaluate(async src=>{const r=await fetch(src);if(!r.ok)throw Error(src);const ctx=new AudioContext();const d=await ctx.decodeAudioData(await r.arrayBuffer());await ctx.close();window.reviewClip=new Audio(src);await window.reviewClip.play();return d.duration;},c.src);
   assert(duration>1);await page.waitForFunction(()=>window.reviewClip.currentTime>.15);await page.evaluate(()=>window.reviewClip.pause());checks.push({engine,id:c.id,nativeAudio:true,duration});
  }
  for(const viewport of [{width:1366,height:768},{width:390,height:844}]){
   await page.setViewportSize(viewport);
   for(const [chapter,activity,help]of [['texts','texts','guided'],['speaking','dialogues','practice']])for(const level of ['a1','a2']){
    await page.goto(`${base}/#learner/chapters/${chapter}/${activity}?level=${level}&help=${help}`);
    const cards=page.locator('[data-collection]');await cards.first().waitFor();
    while(await page.getByRole('button',{name:'Meer opdrachten',exact:true}).count())await page.getByRole('button',{name:'Meer opdrachten',exact:true}).click();
    assert.equal(await cards.count(),chapterCollections(activity).filter(c=>c.level===level).length);
    checks.push({engine,width:viewport.width,activity,level,cards:await cards.count()});
   }
   for(const c of clips.filter(c=>c.id.startsWith('t'))){
    const r=row(c.id.toUpperCase());await page.goto(url('texts','texts',r,r.previousLevel==='guided'?'support':r.previousLevel.toLowerCase()));
    const text=page.locator('.cp-reading-blocks');await text.waitFor();assert.equal(await text.innerText(),c.text);
    await text.getByRole('button').click();await page.waitForFunction(src=>window.reviewPlayed.some(p=>p.endsWith(src)),c.src);
    await page.reload();await page.locator('.cp-reading-blocks').waitFor();assert.equal(await page.locator('.cp-reading-blocks').innerText(),c.text);
    checks.push({engine,width:viewport.width,id:c.id,sourceAndAudio:true,legacyLinkAndReload:true});
   }
   const d=row('D119');await page.goto(url('speaking','dialogues',d,'a2','practice'));await page.locator('.cp-dialogue').waitFor();
   await page.getByRole('button',{name:'Oefen per beurt',exact:true}).click();
   while(await page.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).isEnabled())await page.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).click();
   await page.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();await page.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();
   if(await page.getByRole('button',{name:'Meelezen',exact:true}).count())await page.getByRole('button',{name:'Meelezen',exact:true}).click();
   assert.equal(await page.locator('.cp-dialogue-current p').innerText(),clips.find(c=>c.id==='d119').text);
   await page.getByRole('button',{name:'Luister naar deze beurt',exact:true}).click();await page.waitForFunction(()=>window.reviewPlayed.some(s=>s.endsWith('/tekstherstel-20261030/d119.mp3')));
   checks.push({engine,width:viewport.width,id:'D119',thirdTurnAndAudio:true});
   await page.goto(url('speaking','dialogues',row('D128'),'a2','practice'));await page.locator('.cp-dialogue').waitFor();
   await page.getByRole('button',{name:'Oefen per beurt',exact:true}).click();
   while(await page.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).isEnabled())await page.getByRole('button',{name:'Vorige spreekbeurt',exact:true}).click();
   if(await page.getByRole('button',{name:'Meelezen',exact:true}).count())await page.getByRole('button',{name:'Meelezen',exact:true}).click();
   for(let turn=1;turn<=4;turn++){
    const panel=page.locator('.cp-dialogue-current');assert((await panel.innerText()).includes(turn%2?'Sara':'Ali'));
    await page.getByRole('button',{name:'Luister naar deze beurt',exact:true}).click();
    if(turn%2===0){const clip=clips.find(c=>c.id==='d128-'+turn);assert((await panel.innerText()).includes(clip.text));await page.waitForFunction(src=>window.reviewPlayed.some(p=>p.endsWith(src)),clip.src);}
    checks.push({engine,width:viewport.width,id:'D128',turn,speakerAndNativeAudio:true});
    if(turn<4)await page.getByRole('button',{name:'Volgende spreekbeurt',exact:true}).click();
   }
   for(const ref of ['T153','T179','T192']){await page.goto(url('texts','texts',row(ref),'a2','guided'));await page.locator('.cp-reading-blocks').waitFor();assert.equal(await page.locator('.cp-reading-blocks').innerText(),row(ref).text);checks.push({engine,width:viewport.width,ref,guidedA2:true});}
   for(const ref of ['T171','D116','D077']){
    const r=row(ref),isText=ref[0]==='T';await page.goto(url(isText?'texts':'practical',isText?'text-question':'dialogue-question',r));
    await page.getByText(r.discussion.question,{exact:true}).waitFor();
    if(ref==='D077'){await page.getByRole('button',{name:'Vanmiddag om drie uur.',exact:true}).waitFor();assert.equal(await page.getByText('Vanavond om drie uur.',{exact:true}).count(),0);}
    await page.getByRole('button',{name:r.discussion.answer,exact:true}).click();await page.locator('.cp-source-proof[aria-hidden="false"]').waitFor();
    checks.push({engine,width:viewport.width,ref,questionAndAnswer:true});
   }
   await page.goto(url('texts','texts',row('T054'),'a1'));await page.locator('.cp-reading-blocks').waitFor();checks.push({engine,width:viewport.width,raisedLevelOldLink:true});
   await page.goto(url('practical','functional-message',row('D016'),'a1'));await page.getByRole('textbox',{name:'Jouw bericht',exact:true}).waitFor();checks.push({engine,width:viewport.width,writingKeepsA2:true});
   await page.goto(url('practical','functional-message',row('D056')));const box=page.getByRole('textbox',{name:'Jouw bericht',exact:true});await box.fill('Mijn eigen bericht blijft bewaard.');
   await page.getByRole('button',{name:'Voorbeeld',exact:true}).click();await page.getByText('We kunnen het schip over ongeveer een half uur bekijken. Ik wacht bij de ingang.',{exact:true}).waitFor();
   await page.reload();assert.equal(await page.getByRole('textbox',{name:'Jouw bericht',exact:true}).inputValue(),'Mijn eigen bericht blijft bewaard.');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.screenshot({path:`${dir}/browser-${engine}-${viewport.width}.png`,fullPage:true});checks.push({engine,width:viewport.width,writingModelAndDraftPreserved:true});
  }
 }finally{await browser.close();write(dir+'/browser.json',JSON.stringify({checks,errors},null,2));}
}
assert.deepEqual(errors,[]);console.log(checks.length+' real browser/audio checks passed');
