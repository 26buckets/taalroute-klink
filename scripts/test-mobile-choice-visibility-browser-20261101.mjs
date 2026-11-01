import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterCollections,chapterHash,displayedChapterCollections} from '../lib/practice-chapters.ts';
import {chapterWordRounds} from '../lib/word-rounds.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18996',out=process.env.KLINK_VISIBILITY_OUTPUT||'outputs/mobile-choice-visibility-20261101/local';
mkdirSync(out,{recursive:true});const checks=[],errors=[];
const word=chapterWordRounds(chapterCollections('same-word').find(r=>r.id==='groep-4.alfa-a')).find(r=>r.id.endsWith('~words-2'));
const cases=[{activity:'same-word',chapter:'words',row:word},{activity:'listen',chapter:'listening',row:displayedChapterCollections('listen',{level:'alfa-b',help:'practice'}).find(r=>r.id==='groep-10.alfa-b~words-1')},...['a1','a2'].map(level=>({activity:'text-question',chapter:'texts',row:chapterCollections('text-question').find(r=>r.id===`klink-teksten-zelf-${level}-r01-v1`)}))];
async function geometry(p){return p.evaluate(()=>{
 const stage=document.querySelector('.cp-exercise-stage'),tools=document.querySelector('.cp-exercise-tools').getBoundingClientRect(),nav=document.querySelector('.learner-nav'),bottom=nav.offsetHeight&&getComputedStyle(nav).position==='fixed'?nav.getBoundingClientRect().top:innerHeight;
 const buttons=[...document.querySelectorAll('.cp-choice-grid > button,.cp-choice-grid > .cp-extended-option > button:first-child')],next=document.querySelector('[data-practice-next]'),listen=document.querySelector('.cp-listen-slot button'),source=document.querySelector('.cp-source-text'),card=document.querySelector('.cp-task-card'),first=source||card;
 const visible=e=>{const q=e.getBoundingClientRect();return q.top>=0&&q.bottom<=bottom+1&&q.left>=0&&q.right<=innerWidth+1&&q.height>=44&&[.2,.8].every(x=>[.2,.8].every(y=>{const hit=document.elementFromPoint(q.left+q.width*x,q.top+q.height*y);return hit&&(e===hit||e.contains(hit));}));};
 return {allChoicesVisible:buttons.length>0&&buttons.every(visible),nextVisible:visible(next),listenVisible:visible(listen),toolbarSeparate:tools.bottom<=first.getBoundingClientRect().top+1,stageFits:stage.scrollHeight<=stage.clientHeight+2&&stage.scrollTop===0,noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth+1,answerCount:buttons.length,sourceScrollable:source?source.scrollHeight>source.clientHeight+1:false,sourceText:source?.textContent,progressPreserved:localStorage.getItem('klink.visibility.kept')==='old-progress'};
});}
for(const[engine,type]of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
 await Promise.all([{width:390,height:844},{width:375,height:667},{width:320,height:568},{width:768,height:1024}].map(async viewport=>{for(const theme of ['light','dark'])for(const c of cases){
  const p=await browser.newPage({viewport,hasTouch:true,isMobile:true,colorScheme:theme});p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{localStorage.setItem('klink.visibility.kept','old-progress');window.Audio=class extends EventTarget{play(){this.t=setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();}pause(){clearTimeout(this.t);}};});
  const exercises=c.row.contentUrl?JSON.parse(readFileSync('public'+c.row.contentUrl)).exercises:c.row.exercises;
  await p.goto(base+'/'+chapterHash({chapter:c.chapter,activity:c.activity,collection:c.row.id,level:c.row.level,help:'practice'}));await p.locator('[data-exercise-id]').waitFor();
  const steps=c.activity==='text-question'?[0,1,2,3]:[0,1];
  for(const i of steps){
   const exercise=exercises[i];await p.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();await p.waitForTimeout(80);
   const m=await geometry(p);for(const key of ['allChoicesVisible','nextVisible','listenVisible','toolbarSeparate','stageFits','noHorizontalOverflow','progressPreserved'])assert(m[key],JSON.stringify({engine,viewport,theme,activity:c.activity,i,key,...m}));
   if(c.activity==='text-question')assert.equal((await p.locator('.cp-source-text').textContent()).replace(/\s+/g,' ').trim(),exercise.sourceText.replace(/\s+/g,' ').trim());
   const correctIndex=exercise.options.findIndex(o=>exercise.answer.correctOptionIds.includes(o.id)),answer=p.locator('.cp-choice-grid > button,.cp-choice-grid > .cp-extended-option > button:first-child').nth(correctIndex);
   await answer.tap();await p.keyboard.press('Space');await p.waitForTimeout(70);assert.equal(await p.locator('[data-exercise-id]').getAttribute('data-practice-ready'),'true');
   const after=await geometry(p);assert(after.allChoicesVisible&&after.nextVisible&&after.toolbarSeparate&&after.stageFits,'Correct feedback retains visible choices '+JSON.stringify(after));
   if(engine==='chromium'&&theme==='light'&&i===0)await p.screenshot({path:`${out}/${c.activity}-${c.row.level}-${viewport.width}.png`});
   checks.push({engine,viewport,theme,activity:c.activity,level:c.row.level,i,...m,correctFeedbackFits:true});
   await p.keyboard.press(i%2?'ArrowRight':'Enter');
  }
  await p.close();
 }
 }));
 }finally{await browser.close();writeFileSync(out+'/checks.json',JSON.stringify({base,checks,errors,physicalPhoneTested:false},null,2));}
}
assert.deepEqual(errors,[]);assert.equal(checks.length,192);console.log('PASS 192 mobile choice layouts with touch answers, Space, Enter/arrows and retained progress.');
