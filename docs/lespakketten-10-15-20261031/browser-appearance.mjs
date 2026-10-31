import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import extra from '../../data/klink-docent-extra-lessons-10-15.json' with {type:'json'};
const local=process.env.KLINK_URL??'http://127.0.0.1:18992',out='docs/lespakketten-10-15-20261031';
const checks=[],dark=[],learner=[],errors=[];mkdirSync(out,{recursive:true});
async function ready(p){await p.evaluate(()=>document.fonts.ready.then(()=>true));await p.locator('.kpd-photo').evaluateAll(is=>Promise.all(is.map(i=>i.decode())));}
async function phase(p,round,index){await p.locator('.kpd-rounds button').nth(round).click();await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await p.locator('.kpd-phases button').nth(index).click();await ready(p);}
async function snap(p){return p.evaluate(()=>['.kpd-stage','.kpd-rounds','.kpd-footer','.kpd-big-word','.kpd-route-text','.kpd-visibility-controls button'].map(s=>[s,[...document.querySelectorAll(s)].map(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return{box:[r.x,r.y+scrollY,r.width,r.height].map(x=>Math.round(x*10)/10),font:c.font,color:c.color,background:c.backgroundColor,radius:c.borderRadius};})]));}
for(const[name,engine]of Object.entries({chromium,webkit})){
 const b=await engine.launch();try{
  for(const theme of ['light','dark'])for(const width of [1366,390]){
   const samples=[];
   for(const base of ['https://klink.taalroute.nl',local]){
    const p=await b.newPage({viewport:{width,height:900},colorScheme:theme});p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});
    await p.goto(base+'/#teacher/plus');await p.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await p.getByRole('button',{name:'Les openen: mat',exact:true}).click();
    const rows=[];for(const[r,i]of [[0,0],[0,3],[1,0],[2,6]]){await phase(p,r,i);rows.push(await snap(p));}samples.push(rows);
    await p.getByRole('button',{name:'Lesoverzicht',exact:true}).click();await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();assert(await p.locator('.cp-home').isVisible());
    learner.push({engine:name,theme,width,base,home:true,overflow:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)});await p.close();
   }
   assert.deepEqual(samples[1],samples[0],name+' '+theme+' '+width);checks.push({engine:name,theme,width,phaseComparisons:4,exact:true});
  }
  for(const width of [1366,390,320]){
   const p=await b.newPage({viewport:{width,height:900},colorScheme:'dark'});p.on('pageerror',e=>errors.push(e.message));await p.emulateMedia({reducedMotion:'reduce'});await p.goto(local+'/#teacher/plus');await p.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
   for(const l of extra){await p.getByRole('button',{name:'Les openen: '+l.id,exact:true}).click();await phase(p,0,0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),l.id+' dark '+width);if(l.id==='maand'){assert.equal(await p.locator('.kpd-big-word').evaluate(e=>getComputedStyle(e).fontSize),width===320?'80px':width===390?'90px':'170px');await p.screenshot({path:out+'/maand-'+name+'-'+width+'-dark.png',fullPage:true});}dark.push({engine:name,width,lesson:l.id,theme:'dark',noOverflow:true});await p.getByRole('button',{name:'Lesoverzicht',exact:true}).click();}
   await p.close();
  }
 }finally{await b.close();}
}
assert.deepEqual(errors,[]);assert(learner.every(x=>!x.overflow));writeFileSync(out+'/appearance-check.json',JSON.stringify({checks,dark,learner,errors,exactExistingAppearance:true,onlyApprovedMonthFit:true,localOnly:true},null,2)+'\n');console.log('PASS',checks.length*4,'exact baseline phase comparisons,',dark.length,'dark lesson screens and',learner.length,'learner homes');
