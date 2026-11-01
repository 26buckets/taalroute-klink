import assert from 'node:assert/strict';
import {writeFileSync, mkdirSync} from 'node:fs';
import {chromium, webkit} from 'playwright';
import {dailyBlocks, dailyStorageKey} from '../lib/alfa-c-dagelijks.ts';
import {functionalBlocks, functionalStorageKey} from '../lib/alfa-c-functioneel.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:18996',folder=process.env.KLINK_TEST_OUTPUT||'outputs/alfa-c-no-scroll-20261101';
mkdirSync(folder,{recursive:true});
const checks=[],errors=[];
async function open(p,kind,block,index,key){
 await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();
 await p.evaluate(({key,id,index})=>localStorage.setItem(key,JSON.stringify({version:1,positions:{[id]:index},records:{}})),{key,id:block.id,index});
 await p.goto(base+'/#learner/alfa-c/'+block.id);await p.locator(`[data-${kind}-step="${block.steps[index].id}"]`).waitFor();await p.locator('.cp-listen-slot button').waitFor();
}
async function inspect(p,kind,block,index,width,height,engine){
 for(const view of width<=1100?['source','answer']:['both']){
  if(view!=='both')await p.locator('.ac-panel-switch button').nth(view==='source'?0:1).click();
  await p.waitForTimeout(120);
  for(const panel of view==='both'?['source','answer']:[view]){
   const outer=p.locator('.ac-'+panel+'-viewport');
   await p.waitForFunction(s=>{const e=document.querySelector(s);return e&&e.clientHeight>0&&Math.abs(Number(e.dataset.panelHeight)-e.clientHeight)<1},'.ac-'+panel+'-viewport');
   const count=Number(await outer.getAttribute('data-panel-pages')),seen=new Set();
   for(let part=1;part<=count;part++){
    const nav=p.locator(`.ac-page-nav[data-panel="${panel}"]`);
    if(count>1){while(Number(await outer.getAttribute('data-panel-page'))>part)await nav.locator('button').first().click();while(Number(await outer.getAttribute('data-panel-page'))<part)await nav.locator('button').last().click();}
    const state=await p.evaluate(({panel})=>{
     const outer=document.querySelector('.ac-'+panel+'-viewport'),window=outer.querySelector('.ac-page-window'),body=outer.querySelector('.ac-panel-content'),r=window.getBoundingClientRect(),foot=document.querySelector('.pilot-footer').getBoundingClientRect();
     const nodes=[...body.querySelectorAll('button,input,textarea,label,.ac-document-line,img')].filter(e=>e.getBoundingClientRect().height&&getComputedStyle(e).visibility!=='hidden');
     const visible=nodes.flatMap((e,i)=>{const q=e.getBoundingClientRect();return q.top>=r.top-1&&q.bottom<=r.bottom+1?[i]:[]});
     const clipped=nodes.filter(e=>{const q=e.getBoundingClientRect();return q.height<=outer.clientHeight&&q.top<r.bottom-1&&q.bottom>r.top+1&&(q.top<r.top-1||q.bottom>r.bottom+1)}).map(e=>e.outerHTML.slice(0,80));
     return{visible,clipped,count:nodes.length,overflow:document.documentElement.scrollWidth>innerWidth+1||document.documentElement.scrollHeight>innerHeight+1||outer.scrollTop!==0||foot.bottom>innerHeight+1||r.bottom>foot.top+1,height:outer.clientHeight};
    },{panel});
    assert.equal(state.overflow,false,`${engine} ${width} ${block.steps[index].id} ${panel} overflow`);
    assert.deepEqual(state.clipped,[],`${engine} ${width} ${block.steps[index].id} ${panel} clipped`);
    state.visible.forEach(i=>seen.add(i));
    if(part===count)assert.equal(seen.size,state.count,`${engine} ${width} ${block.steps[index].id} ${panel} unreachable content`);
   }
   checks.push({engine,width,height,id:block.steps[index].id,panel,parts:count,noScroll:true,allContentReachable:true});
  }
 }
}
await Promise.all(Object.entries({chromium,webkit}).map(async([engine,type])=>{
 const b=await type.launch();try{
 for(const[width,height]of[[1366,768],[390,844]]){
  const p=await b.newPage({viewport:{width,height}});p.on('pageerror',e=>errors.push(String(engine)+': '+e.message));
  for(const[kind,blocks,key]of[['daily',dailyBlocks,dailyStorageKey],['functional',functionalBlocks,functionalStorageKey]])for(const block of blocks)for(let index=0;index<block.steps.length;index++){
   await open(p,kind,block,index,key);await inspect(p,kind,block,index,width,height,engine);
  }
  console.log(engine,width,'144 assignments passed');await p.close();
 }
 for(const[width,height]of[[1686,885],[320,568],[740,390],[1366,600]]){
  const p=await b.newPage({viewport:{width,height},colorScheme:'dark'});p.on('pageerror',e=>errors.push(String(engine)+': '+e.message));
  for(const[kind,block,index,key]of[['daily',dailyBlocks.find(b=>b.id==='dagelijks-later'),4,dailyStorageKey],['functional',functionalBlocks.find(b=>b.id==='formulier'),10,functionalStorageKey],['functional',functionalBlocks.find(b=>b.id==='werk'),10,functionalStorageKey]]){
   await open(p,kind,block,index,key);await inspect(p,kind,block,index,width,height,engine);
   if(engine==='chromium')await p.screenshot({path:`${folder}/${width}-${block.id}.png`});
  }
  await p.goto(base+'/#learner/home');await p.locator('.cp-home').waitFor();assert(await p.locator('.taalroute-header').isVisible(),'Header returns outside the task');await p.close();
 }
 }finally{await b.close();}
}));
assert.deepEqual(errors,[]);writeFileSync(folder+'/browser-checks.json',JSON.stringify({base,checks,errors},null,2));console.log(checks.length,'panel checks passed');
