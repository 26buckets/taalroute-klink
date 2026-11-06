import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {displayedChapterCollections,chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:18996',out='outputs/exercise-flow-20261106';mkdirSync(out,{recursive:true});
const checks=[],errors=[];
const cases=['write-letter','copy','dictation','functional-message','functional-form'].map(activity=>{const row=['practice','guided'].flatMap(help=>['alfa-a','alfa-b','alfa-c','a1','a2','b1'].flatMap(level=>displayedChapterCollections(activity,{level,help}).map(row=>({row,level,help})))).find(({row})=>row.exercises.length);return{activity,...row};});
for(const [engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch(engine==='chromium'?{channel:'chrome'}:{});
 try{for(const c of cases)for(const model of ['visual','resize']){
 const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const v=new EventTarget();v.height=innerHeight;v.offsetTop=0;Object.defineProperty(window,'visualViewport',{configurable:true,value:v});window.testKeyboard=(height)=>{v.height=height;v.dispatchEvent(new Event('resize'));};window.Audio=class extends EventTarget{dataset={};paused=true;play(){this.paused=false;this.timer=setTimeout(()=>{this.paused=true;this.dispatchEvent(new Event('ended'));},5);return Promise.resolve();}pause(){clearTimeout(this.timer);this.paused=true;}};});
 await p.goto(base+'/'+chapterHash({chapter:'writing',activity:c.activity,collection:c.row.id,level:c.level,help:c.help}));
 const field=p.locator('.cp-text-entry input,.cp-text-entry textarea').first();await field.waitFor();await field.fill('n');
 if(model==='resize')await p.setViewportSize({width:390,height:260});await p.evaluate(()=>window.testKeyboard(260));
 await p.waitForFunction(()=>document.querySelector('.learner-main').dataset.keyboardOpen==='true');await field.scrollIntoViewIfNeeded();
 const metrics=await field.evaluate(e=>{const r=e.getBoundingClientRect(),main=document.querySelector('.learner-main');return{inputVisible:r.top>=0&&r.bottom<=260,horizontal:main.scrollWidth>main.clientWidth+2,font:parseFloat(getComputedStyle(e).fontSize)};});
 assert(metrics.inputVisible&&!metrics.horizontal&&metrics.font>=16,JSON.stringify({engine,c:c.activity,model,metrics}));
 if(c.activity.startsWith('functional-')){await field.press('End');await field.press('Space');await field.press('Enter');assert.equal(await field.inputValue(),'n \n');assert.equal(await p.locator('[data-practice-ready="true"]').count(),0,'A newline does not grade free writing');}
 else {const button=p.locator('[data-inline-check]');await button.scrollIntoViewIfNeeded();const a=await field.boundingBox(),d=await button.boundingBox();assert(a.y>=0&&a.y+a.height<=260&&d.y>=0&&d.y+d.height<=260,'Input and check are visible together');assert(d.x>=a.x+a.width,'Check stays beside input with software keyboard');}
 await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();assert.equal(await p.locator('[data-keyboard-open="true"]').count(),0,'Keyboard layout released on leaving');
 checks.push({engine,activity:c.activity,model,...metrics});await p.close();
 }}finally{await b.close();writeFileSync(out+'/mobile-keyboard.json',JSON.stringify({checks,errors,physicalPhone:false},null,2));}
}
assert.deepEqual(errors,[]);console.log('PASS',checks.length,'software keyboard layouts and free-writing newline safety');
