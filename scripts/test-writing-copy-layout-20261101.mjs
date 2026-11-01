import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/writing-copy-next-20261101/local';mkdirSync(out,{recursive:true});
const rows=JSON.parse(readFileSync('data/klink-production-index.json')).filter(r=>r.id.startsWith('production:copy:alfa-c:KSW-AC-TN-'));
assert.equal(rows.length,5);
const cases=rows.map(row=>{const source=JSON.parse(readFileSync('public'+row.url));return{row,source,exercise:source.exercises.reduce((a,b)=>a.exampleWord.length>=b.exampleWord.length?a:b),kind:'longest'};});
cases.push({...cases[0],exercise:cases[0].source.exercises[0],kind:'short-word'});
const checks=[],errors=[];
try{
for(const[engine,type]of Object.entries({chromium,webkit})){
  const browser=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{for(const[width,height]of[[320,568],[390,844]])for(const theme of['light','dark'])for(const{row,source,exercise,kind}of cases){
    const p=await browser.newPage({viewport:{width,height},colorScheme:theme});p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(()=>{
      const v=new EventTarget();v.height=innerHeight;v.offsetTop=0;
      Object.defineProperty(window,'visualViewport',{configurable:true,value:v});
      window.showKeyboard=()=>{v.height=innerWidth<350?280:400;v.dispatchEvent(new Event('resize'));};
      localStorage.setItem('klink.exercise-view.v1','{"photo":false,"text":false}');
    });
    // Same source records; put the longest model first only in this layout fixture.
    await p.route('**'+row.url,route=>route.fulfill({contentType:'application/json',body:JSON.stringify({...source,exercises:[exercise,...source.exercises.filter(e=>e.exerciseId!==exercise.exerciseId)]})}));
    await p.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:row.id,level:row.level,help:row.help}));
    await p.locator(`[data-exercise-id="${exercise.exerciseId}"]`).waitFor();
    for(const keyboard of[false,true]){
      if(keyboard){await p.locator('.cp-text-entry input').focus();await p.evaluate(()=>window.showKeyboard());}
      await p.waitForTimeout(200);
      const m=await p.evaluate(()=>{
        const r=s=>{const e=document.querySelector(s),b=e.getBoundingClientRect();return{x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};
        return{model:r('.cp-task-prompt strong'),input:r('.cp-text-entry input'),check:r('[data-practice-check]'),next:r('[data-practice-next]'),stage:r('.cp-exercise-stage'),card:r('.cp-task-card'),height:window.visualViewport.height};
      });
      for(const key of['model','input','check','next']){const v=m[key];assert(v.x>=0&&v.right<=width+1&&v.y>=0&&v.bottom<=m.height+1,`${engine} ${width} ${exercise.exerciseId} ${keyboard} ${key}: ${JSON.stringify(m)}`);}
      const clipTop=Math.max(m.stage.y,m.card.y),clipBottom=Math.min(m.stage.bottom,m.card.bottom);
      for(const key of['input','check']){const v=m[key];assert(v.y>=clipTop-1&&v.bottom<=clipBottom+1,'Input must fit inside the stage and card: '+JSON.stringify(m));}
      const modelFullyVisible=m.model.y>=clipTop-1&&m.model.bottom<=clipBottom+1;
      let modelScrollTested=false;
      if(!modelFullyVisible){
        assert(keyboard,'Closed-keyboard source must be fully visible');
        const source=await p.locator('.cp-task-prompt strong').evaluate(el=>{
          const card=el.closest('.cp-task-card'),stage=el.closest('.cp-exercise-stage'),r=el.getBoundingClientRect(),s=stage.getBoundingClientRect(),c=card.getBoundingClientRect();
          card.scrollTop+=Math.max(0,r.bottom-Math.min(s.bottom,c.bottom));
          const after=el.getBoundingClientRect();return{top:after.top,bottom:after.bottom,stageTop:Math.max(s.top,c.top),stageBottom:Math.min(s.bottom,c.bottom),text:el.textContent,overflow:getComputedStyle(card).overflowY};
        });
        assert.equal(source.text,exercise.exampleWord);
        assert(['auto','scroll'].includes(source.overflow),'Source scrolling must be available to the user');
        assert(source.top>=source.stageTop-1&&source.bottom<=source.stageBottom+1,'The full source must be reachable by existing scrolling');
        modelScrollTested=true;
        await p.locator('.cp-text-entry input').evaluate(el=>el.scrollIntoView({block:'nearest'}));
      }
      checks.push({engine,width,height,theme,keyboard,collection:row.id,id:exercise.exerciseId,kind,inputAndButtonsFit:true,modelFullyVisible,modelReachable:true,modelScrollTested,measurement:m});
      await p.screenshot({path:`${out}/${engine}-${width}-${theme}-${exercise.exerciseId}-${keyboard?'keyboard':'closed'}.png`});
    }
    await p.close();
  }}finally{await browser.close();}
}
assert.equal(checks.length,96);assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);throw e;}finally{writeFileSync(out+'/layout-checks.json',JSON.stringify({base,checks,errors,physicalPhoneTested:false,keyboard:'Simulated VisualViewport',fixture:'Unchanged source records; longest model placed first only for layout testing.'},null,2)+'\n');}
console.log('PASS: 96 short/long model layouts; complete source reachable; input and controls fit.');
