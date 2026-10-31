import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const D='docs/package-grid-width-20261031',checks=[];
for(const [name,engine]of Object.entries({chromium,webkit})){
 const b=await engine.launch();
 try{for(const width of [1296,768,481,390])for(const theme of ['light','dark']){
  const sides=[];
  for(const [side,base] of [['before','https://klink.taalroute.nl'],['after',process.env.KLINK_TEST_URL||'http://127.0.0.1:18953']]){
   console.log(name,width,theme,side);
   const p=await b.newPage({viewport:{width,height:900},colorScheme:theme});
   await p.goto(base+'/#learner/packages');await p.locator('.cp-package-grid>button').first().waitFor();await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=t},theme);
   await p.locator('.cp-section-photo img').first().evaluate(x=>x.decode());
   const info=await p.locator('.cp-package-grid').evaluate(el=>{
    const rect=x=>{const r=x.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right}},g=rect(el),cards=[...el.children].map(c=>{const s=getComputedStyle(c.querySelector('strong')),i=c.querySelector('img');return{...rect(c),title:c.querySelector('strong').textContent,source:i.getAttribute('src'),ratio:i.getBoundingClientRect().width/i.getBoundingClientRect().height,font:s.fontFamily,size:s.fontSize,weight:s.fontWeight,color:s.color,buttonHeight:rect(c.querySelector('.cp-section-open')).h}});return {grid:g,cards,columns:cards.filter(c=>Math.abs(c.y-cards[0].y)<1).length};});
   assert.equal(info.cards.length,15);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(side==='after')assert(Math.abs(info.cards[info.columns-1].right-info.grid.right)<1,'Fill right edge');
   for(const c of info.cards){assert(Math.abs(c.ratio-1)<.02);assert(c.buttonHeight>=48);}
   if(name==='chromium'&&[1296,390].includes(width))await p.screenshot({path:`${D}/${side}-${width}-${theme}.png`});
   sides.push(info);await p.close();
  }
  assert.equal(sides[0].columns,sides[1].columns);
  const content=x=>x.cards.map(({title,source,font,size,weight,color,buttonHeight})=>({title,source,font,size,weight,color,buttonHeight}));assert.deepEqual(content(sides[0]),content(sides[1]));
  checks.push({engine:name,width,theme,columns:sides[1].columns,beforeGap:sides[0].grid.right-sides[0].cards[sides[0].columns-1].right,afterGap:sides[1].grid.right-sides[1].cards[sides[1].columns-1].right,contentStyleOrderPreserved:true});
 }}finally{await b.close()}
}
writeFileSync(D+'/comparison.json',JSON.stringify({checks},null,2));console.log('16 browser/width/theme comparisons passed; right edge filled, original columns/order/media/type/buttons retained');
