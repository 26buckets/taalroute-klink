import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync as write} from 'node:fs';
const b=await chromium.launch(),D='docs/word-coverage-release-20261031',checks=[];
const geometry=p=>p.locator('.taalroute-header,[data-chapter-activity]').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {id:el.getAttribute('data-chapter-activity')??'header',x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,padding:s.padding,gap:s.gap,radius:s.borderRadius}}));
try {
 for(const width of [1366,390]) for(const theme of ['light','dark']) for(const level of ['alfa-a','b1']) {
  const views=[],raw=[];let prior;
  for(const [side,base] of [['floor','https://klink.taalroute.nl'],['new','http://127.0.0.1:18947']]) {
   const p=await b.newPage({viewport:{width,height:900},colorScheme:theme});
   await p.goto(base+`/#learner/chapters/words?level=${level}&help=practice`);
   await p.locator('[data-chapter-activity="meet"]').waitFor();await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=t},theme);
   await p.screenshot({path:`${D}/${side}-${width}-${theme}-${level}.png`});raw.push(await geometry(p));
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(side==='floor')prior=await p.locator('[data-chapter-activity]').evaluateAll(xs=>xs.map(x=>({id:x.dataset.chapterActivity,html:x.innerHTML,disabled:x.disabled,className:x.getAttribute('class')})));
   else await p.evaluate(items=>{for(const item of items){const el=document.querySelector(`[data-chapter-activity="${item.id}"]`);el.innerHTML=item.html;el.disabled=item.disabled;el.className=item.className}},prior);
   // Compare identical content states: removing “Niet beschikbaar” naturally shortens a row.
   views.push(await geometry(p));await p.close();
  }
  assert.deepEqual(views[1],views[0],`${width}/${theme}/${level}`);
  checks.push({width,theme,level,unchangedGeometryAndTypographyForEqualContent:true,rawGeometry:raw,contentDifference:'Counts and availability; empty-state line disappears using unchanged responsive CSS'});
 }
 write(D+'/appearance.json',JSON.stringify({checks},null,2));console.log('8 desktop/mobile, light/dark comparisons passed; existing layout unchanged for identical content states');
} finally {await b.close()}
