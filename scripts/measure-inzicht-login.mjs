import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const out=process.env.KLINK_LOGIN_OUTPUT||'docs/performance-20261102/inzicht-public-login';mkdirSync(out,{recursive:true});const rows=[],errors=[];
for(const [name,base] of [['current','https://inzicht.taalroute.nl'],['staging','https://klink-inzicht-pr8-staging.nico-554.workers.dev']])for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1280,390])for(let repeat=0;repeat<Number(process.env.KLINK_LOGIN_REPEATS||3);repeat++){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push({name,engine,message:e.message}));
  for(const visit of ['cold','warm']){
   await p.goto(base+(name==='current'?'/':'/inzicht'),{waitUntil:'domcontentloaded'});await p.locator('input[type="password"]').waitFor();
   rows.push({name,engine,width,repeat,visit,readyMs:await p.evaluate(()=>performance.now()),timing:await p.evaluate(()=>({navigation:performance.getEntriesByType('navigation').map(n=>({ttfb:n.responseStart,duration:n.duration})),resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,start:r.startTime,duration:r.duration,transfer:r.transferSize,decoded:r.decodedBodySize}))}))});
   writeFileSync(out+'/measurements.json',JSON.stringify({measuredAt:new Date().toISOString(),method:'Public anonymous login only; no credentials, form submission, MFA, protected reports or data writes; cold/warm browser cache does not prove a cold Worker',rows,errors},null,2));
  }await c.close();
 }}finally{await b.close();}
}
assert.deepEqual(errors,[]);console.log('PASS',rows.length,'read-only public login measurements');
