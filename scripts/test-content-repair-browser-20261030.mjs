import assert from 'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{build}from'esbuild';
import{chromium,webkit}from'playwright';
import{importedItems}from'../lib/imported-practice.ts';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:18945';
const out='docs/content-repair-20261030';
const changes=JSON.parse(readFileSync(out+'/source-changes.json')).changes;
const ids=[...new Set(changes.filter(c=>c.path[0]==='data/klink-imported-practice.json').map(c=>importedItems[c.path[2]].id))];
const audio=JSON.parse(readFileSync(out+'/audio-scope.json')).files;
const built=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ImportedTeacherWorkflow}from'./components/product/imported-teacher-workflow';window.mountRepair=(task)=>{window.repairRoot?.unmount();document.querySelector('.learner-main').innerHTML='<div id="repair-test" class="learner-page cp-chapters cp-chapter-playing"></div>';window.repairRoot=createRoot(document.getElementById('repair-test'));window.repairRoot.render(<ImportedTeacherWorkflow id={'repair-test:'+task.id} task={task} locked={false} onHelp={()=>{}} onFinish={()=>{}}/>);};`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'iife',write:false,jsx:'automatic',define:{'process.env':'{}','process.env.NODE_ENV':'"production"'}});
const checks=[];
for(const engine of [chromium,webkit]){
 const browser=await engine.launch({headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/#learner/home');await page.locator('.cp-home').waitFor();
  const decoded=await page.evaluate(async files=>{const ctx=new AudioContext();const results=[];for(const f of files){const r=await fetch(f.src);if(!r.ok)throw Error(f.src);const b=await ctx.decodeAudioData(await r.arrayBuffer());if(b.duration<=0)throw Error(f.src);results.push({src:f.src,duration:b.duration});}await ctx.close();return results;},audio);
  assert.equal(decoded.length,104);
  const clips=audio.filter(x=>x.contentId==='klink-dialogue-375e6e6e06b7d86d'||x.contentId==='klink-sentence-f24117313d232d59');
  for(const clip of clips){await page.evaluate(src=>{window.repairAudio=new Audio(src);},clip.src);await page.evaluate(()=>window.repairAudio.play());await page.waitForFunction(()=>window.repairAudio.currentTime>0.15);await page.evaluate(()=>window.repairAudio.pause());}
  checks.push({engine:engine.name(),decoded:decoded.length,played:clips.length});
  await page.addScriptTag({content:built.outputFiles[0].text});
  for(const width of [1366,390]){
   await page.setViewportSize({width,height:900});
   for(const id of ids){
    const item=importedItems.find(x=>x.id===id);if(!item.teacherWorkflow)continue;
    await page.evaluate(item=>window.mountRepair(item),item);
    await page.locator('[data-workflow-phase="prepare"]').waitFor();
    await page.getByText('Opdracht en voorbereiding',{exact:true}).click();await page.getByRole('button',{name:'De cursist kijkt niet mee'}).click();
    await page.waitForFunction(text=>document.querySelector('[data-workflow-phase]')?.textContent.includes(text),item.teacherWorkflow.phases[0].instruction);
    await page.getByRole('button',{name:'Begin samen'}).click();
    assert(!await page.getByText('Beoordelingsreferentie',{exact:true}).count());
    await page.evaluate(id=>localStorage.removeItem('klink.taalroute.content-workflow.v1:repair-test:'+id),id);
   }
   checks.push({engine:engine.name(),width,teacherTasks:ids.filter(id=>importedItems.find(x=>x.id===id).teacherWorkflow).length});
  }
  const item=importedItems.find(x=>x.id==='klink-wp-final-text-a2ac929f69bfdd4f-contextual-model-fade');
  const storage='klink.taalroute.content-workflow.v1:repair-test:'+item.id;
  const old={sourceHash:'previous-reviewed-version',prepared:true,index:0,replies:[],note:'Bewaard cursistantwoord',fields:{},tiles:[],performed:false,observations:{},helpUsed:false,interlude:'',interval:'',exposure:''};
  await page.evaluate(({storage,old})=>localStorage.setItem(storage,JSON.stringify(old)),{storage,old});
  await page.evaluate(item=>window.mountRepair(item),item);await page.locator('[data-workflow-phase="prepare"]').waitFor();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).previousVersion?.note==='Bewaard cursistantwoord',storage);
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).previousVersion,storage),old);
  await page.getByRole('button',{name:'Begin samen'}).click();await page.getByText('We hebben nog één lepel nodig.',{exact:true}).waitFor();
  for(const phase of ['guided','response']){
   await page.getByRole('button',{name:'Ik heb deze stap uitgevoerd',exact:true}).click();await page.getByRole('button',{name:'Volgende stap',exact:true}).click();
   await page.locator(`[data-workflow-phase="${phase}"]`).waitFor();await page.getByRole('button',{name:'De cursist kijkt niet mee'}).click();
   if(phase==='response')assert((await page.locator('[data-workflow-phase]').innerText()).includes('Er komen vier mensen eten. Er liggen drie lepels.'));
   await page.getByRole('button',{name:'Begin deze stap',exact:true}).click();
  }
  await page.getByRole('textbox').fill('We hebben nog één lepel nodig.');
  await page.getByRole('button',{name:'Ik heb deze stap uitgevoerd',exact:true}).click();await page.getByRole('button',{name:'Samen bekijken',exact:true}).click();await page.getByRole('button',{name:'De cursist kijkt niet mee'}).click();
  assert((await page.locator('[data-workflow-phase="review"]').innerText()).includes('drie lepels voor vier mensen'));
  assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).previousVersion.note,storage),'Bewaard cursistantwoord');
  checks.push({engine:engine.name(),spoonFlow:'passed',priorAnswerPreserved:true});
  assert.deepEqual(errors,[]);await page.screenshot({path:out+'/repair-'+engine.name()+'.png',fullPage:false});
 }finally{await browser.close();}
}
writeFileSync(out+'/browser.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));
