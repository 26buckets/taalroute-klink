import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
import {chapterHash} from '../lib/practice-chapters.ts';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19031';
const out=process.env.KLINK_TEST_OUTPUT||'docs/writing-copy-next-20261101/local';mkdirSync(out,{recursive:true});
const row=JSON.parse(readFileSync('data/klink-production-index.json')).find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-021-040');
const valid=JSON.parse(readFileSync('public'+row.url));
const invalid=structuredClone(valid);delete invalid.exercises[0].fields;
const checks=[],errors=[];
try{for(const[engine,type]of Object.entries({chromium,webkit})){
  const b=await type.launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
  try{
    const p=await b.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));
    await p.addInitScript(()=>localStorage.setItem('klink.round-progress.v1:previous-round','{"version":1,"total":2,"done":["old-task"]}'));
    let requests=0,fail=true;await p.route('**'+row.url,r=>{requests++;return r.fulfill({contentType:'application/json',body:JSON.stringify(fail?invalid:valid)});});
    await p.goto(base+'/'+chapterHash({chapter:'writing',activity:'copy',collection:row.id,level:row.level,help:row.help}));
    await p.getByRole('alert').waitFor();assert.equal(await p.locator('.cp-text-entry input').count(),0);
    fail=false;await p.getByRole('button',{name:'Probeer opnieuw',exact:true}).click();
    await p.locator(`[data-exercise-id="${valid.exercises[0].exerciseId}"]`).waitFor();
    const input=p.locator('.cp-text-entry input');await input.fill('x'+valid.exercises[0].exampleWord);await input.press('Enter');
    assert((await p.locator('.cp-exercise-feedback output').innerText()).includes('Kijk bij teken 1.'));
    assert.equal(await p.evaluate(()=>localStorage.getItem('klink.round-progress.v1:previous-round')),'{"version":1,"total":2,"done":["old-task"]}');
    checks.push({engine,malformedBankRejected:true,retryWorks:true,differenceFeedbackWorks:true,oldProgressPreserved:true,requests});
  }finally{await b.close();}
}assert.equal(checks.length,2);assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);throw e;}finally{writeFileSync(out+'/loading-checks.json',JSON.stringify({base,checks,errors},null,2)+'\n');}
console.log('PASS: two browsers reject incomplete copy models and recover without losing saved progress.');
