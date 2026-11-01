import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const out='docs/klink-complete-release-20261101/appearance';mkdirSync(out,{recursive:true});
const results=[];
const route='/#learner/chapters/texts/text-question/klink-teksten-zelf-a1-r01-v1?level=a1&help=practice';
for(const engine of [chromium,webkit]){
 const b=await engine.launch();try{for(const [width,theme]of [[1366,'light'],[1366,'dark'],[390,'light'],[390,'dark']]){
  const context=await b.newContext({viewport:{width,height:900},colorScheme:theme});
  const captures=[];
  for(const[name,base]of [['approved-live','https://klink.taalroute.nl'],['candidate','http://127.0.0.1:18950']]){
   const page=await context.newPage();await page.goto(base+route);await page.locator('[data-exercise-id] h4').waitFor({timeout:60000});await page.evaluate(()=>document.fonts.ready);
   captures.push(await page.locator('[data-exercise-id]').evaluate(stage=>[stage,...stage.querySelectorAll('h3,h4,p,button,svg')].map(e=>{
    const s=getComputedStyle(e),r=e.getBoundingClientRect();return {tag:e.tagName,text:e.textContent,box:[r.x,r.y,r.width,r.height].map(n=>Math.round(n*100)/100),style:Object.fromEntries(['fontFamily','fontSize','fontWeight','lineHeight','color','backgroundColor','borderRadius','padding','gap'].map(k=>[k,s[k]]))};
   })));
   await page.screenshot({path:`${out}/${engine.name()}-${width}-${theme}-${name}.png`,fullPage:true});await page.close();
  }
  assert.deepEqual(captures[1],captures[0],engine.name()+' '+width+' '+theme+' unchanged existing exercise');
  results.push({engine:engine.name(),width,theme,elementsCompared:captures[0].length,geometryAndStylesIdentical:true});await context.close();
 }}finally{await b.close();}
}
writeFileSync(out+'/checks.json',JSON.stringify({comparedWith:'0f9191da3e38064bd81034f1d071056601bfe83e',checks:results,existingContentIdentical:true},null,2)+'\n');console.log(JSON.stringify({checks:results.length}));
