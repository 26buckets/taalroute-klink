import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const b=await chromium.launch(),results=[];
try{for(const width of [1686,390])for(const theme of ['light','dark'])for(const[route,sel]of [['home','.cp-home'],['packages','.cp-package-grid'],['chapters/words?level=alfa-a&help=practice','.cp-chapter-grid']]){
 const pair=[];
 for(const base of ['https://klink.taalroute.nl','http://127.0.0.1:18955']){const p=await b.newPage({viewport:{width,height:900},colorScheme:theme});await p.goto(base+'/#learner/'+route);await p.locator(sel).waitFor();await p.evaluate(()=>document.fonts.ready);await p.evaluate(t=>document.documentElement.classList.toggle('dark',t==='dark'),theme);
 pair.push(await p.locator(sel).evaluate(el=>[el,...el.querySelectorAll('button,a,h1,h2,img')].map(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return{text:x.textContent,x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,color:s.color,background:s.backgroundColor}})));await p.close();}
 assert.deepEqual(pair[1],pair[0],`${width}/${theme}/${route}`);results.push({width,theme,route,unchanged:true});
}writeFileSync('docs/collection-grid-20261031/other-screens.json',JSON.stringify(results,null,2));console.log('12 unaffected screen comparisons passed');}finally{await b.close()}
