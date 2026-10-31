import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {displayedChapterCollections,chapterHash} from '../lib/practice-chapters.ts';
import {collectionProgressId,roundProgressPrefix} from '../lib/round-progress.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18955',out=process.env.KLINK_TEST_OUTPUT||'docs/collection-grid-20261031/browser',baseline=process.env.KLINK_GRID_BASELINE==='1';
mkdirSync(out,{recursive:true});const results=[],errors=[],levels=['alfa-a','alfa-b','alfa-c','a1','a2','b1'];
for(const[name,engine]of Object.entries(baseline?{chromium}:{chromium,webkit})){
 const b=await engine.launch();try{const p=await b.newPage();p.on('pageerror',e=>errors.push(e.message));
 for(const width of baseline?[1686,390]:[1686,1024,768,390])for(const theme of ['light','dark']){
  await p.setViewportSize({width,height:900});await p.emulateMedia({colorScheme:theme});
  for(const level of levels){const selection={chapter:'words',activity:'word-sort',level,help:'practice'};const expected=displayedChapterCollections('word-sort',selection).slice(0,12);
   await p.goto(base+'/'+chapterHash(selection));const cards=p.locator('[data-collection]');await cards.first().waitFor();const label=level.startsWith('alfa-')?'Alfa '+level.at(-1).toUpperCase():level.toUpperCase();await p.locator(`.cp-route-level[aria-label="${label}"][aria-pressed="true"]`).waitFor();await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark')},theme);
   assert.deepEqual(await cards.evaluateAll(xs=>xs.map(x=>x.dataset.collection)),expected.map(c=>c.id));
   const layout=await p.locator('.cp-chapter-collections').evaluate(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,width:r.width,gap:parseFloat(s.columnGap),cards:[...el.children].map(c=>{const q=c.getBoundingClientRect();return{x:q.x,y:q.y,width:q.width,height:q.height,title:c.querySelector('strong').textContent}})}});
   const columns=Math.max(1,Math.floor((layout.width+12)/272)),expectedWidth=(layout.width-12*(columns-1))/columns;assert.equal(layout.gap,12);
   if(!baseline)for(const c of layout.cards)assert(Math.abs(c.width-expectedWidth)<1,`${name}/${width}/${theme}/${level}: fixed track width even with one card`);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   results.push({engine:name,width,theme,level,columns,layout});
   if(name==='chromium'&&[1686,390].includes(width)&&['alfa-a','alfa-c','b1'].includes(level))await p.screenshot({path:`${out}/${width}-${theme}-${level}.png`});
  }
 }
 if(!baseline){
  await p.setViewportSize({width:1686,height:900});
  for(const level of levels){const s={chapter:'words',activity:'word-sort',level,help:'practice'};await p.goto(base+'/'+chapterHash(s));const first=p.locator('[data-collection]').first();await first.waitFor();await first.focus();await p.keyboard.press('Enter');await p.locator('[data-exercise-id]').first().waitFor();await p.getByRole('button',{name:'Andere opdracht',exact:true}).click();await first.waitFor();assert(new URL(p.url()).hash===chapterHash(s));}
  const s={chapter:'words',activity:'word-sort',level:'alfa-c',help:'practice'},c=displayedChapterCollections('word-sort',s)[0],bank=JSON.parse(readFileSync('public'+c.contentUrl)),key=roundProgressPrefix+collectionProgressId('word-sort',c.id,c.contentUrl),raw=JSON.stringify({version:1,total:c.exerciseCount,done:[bank.exercises[0].exerciseId]});
  await p.goto(base+'/'+chapterHash(s));await p.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await p.reload();await p.locator('.cp-round-status').waitFor();assert.equal(await p.locator('.cp-round-status').innerText(),'1 van 28 gedaan');await p.locator('[data-collection]').first().click();await p.locator('[data-exercise-id]').first().waitFor();await p.getByRole('button',{name:'Andere opdracht',exact:true}).click();assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),raw);assert.equal(await p.locator('.cp-round-status').innerText(),'1 van 28 gedaan');
 }
 }finally{await b.close()}
}
assert.deepEqual(errors,[]);writeFileSync(out+'/checks.json',JSON.stringify({base,baseline,results,errors,keyboardOpenBack:!baseline,progressReload:!baseline},null,2));console.log(`${results.length} layout cases; collection IDs/count/order retained; ${baseline?'baseline captured':'keyboard/open/back and saved progress passed'}`);
