import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
const {chromium}=await import('/Users/nicoknoester/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const dialogues=JSON.parse(readFileSync('data/klink-dialogue-repair.json')).dialogues;
const base=process.env.KLINK_TEST_URL||'http://localhost:18929';
const out=process.env.KLINK_TRANSCRIPT_OUTPUT||'outputs/dialogue-transcript';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__played=[];window.Audio=class extends EventTarget{constructor(src){super();this.src=src;}play(){window.__played.push(this.src);return Promise.resolve();}pause(){}};});
try{
 for(const width of [320,630,1366]){
  await page.setViewportSize({width,height:900});
  for(const dialogue of dialogues){
   await page.goto(`${base}/#learner/chapters/practical/dialogues/${dialogue.id}?level=${dialogue.sourceLevel.toLowerCase()}`);
   await page.waitForFunction(id=>document.querySelector('.cp-exercise-browser')?.dataset.exerciseId.includes(id),dialogue.id);
   const transcript=page.locator('.cp-dialogue-transcript');await transcript.locator('summary').click();
   const rows=transcript.locator(':scope > button');assert.equal(await rows.count(),4);
   const layout=await rows.evaluateAll(buttons=>buttons.map(button=>{
    const text=button.querySelector('span'),speaker=button.querySelector('strong'),icon=button.querySelector('svg');
    const b=button.getBoundingClientRect(),t=text.getBoundingClientRect(),s=speaker.getBoundingClientRect(),i=icon.getBoundingClientRect();
    return {left:t.left,aligned:Math.abs(s.left-t.left)<1,inBounds:t.right<=b.right-12&&i.left>=b.left+12,iconLeft:i.left<b.left+20,iconWidth:i.width,font:parseFloat(getComputedStyle(text).fontSize),weight:getComputedStyle(text).fontWeight,height:b.height,overflow:button.scrollWidth>button.clientWidth+1};
   }));
   for(const row of layout){assert(row.aligned&&row.inBounds&&row.iconLeft&&!row.overflow,JSON.stringify({width,id:dialogue.id,row}));assert(row.font>=22&&row.height>=48&&row.iconWidth===44);assert.equal(row.weight,'400');assert(Math.abs(row.left-layout[0].left)<1);}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(dialogue.id==='klink-dialogue-d0a263adf67c1b3c'){
    for(let i=0;i<4;i++){await rows.nth(i).focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>window.__played.at(-1)),dialogue.turns[i].src);}
    await transcript.screenshot({path:`${out}/transcript-${width}.png`});
   }
   checks.push({id:dialogue.id,width,turns:layout.length});
  }
 }
 assert.deepEqual(errors,[]);writeFileSync(`${out}/results.json`,JSON.stringify({passed:true,dialogues:dialogues.length,checks:checks.length,turns:checks.length*4,widths:[320,630,1366],keyboardAllFourTurns:true,errors},null,2)+'\n');console.log(`PASS ${checks.length} transcript layouts, ${checks.length*4} turns, keyboard audio and no overflow`);
}finally{await browser.close();}
