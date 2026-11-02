import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const out=process.env.KLINK_LOGIN_OUTPUT||'docs/performance-20261102/inzicht-public-login';mkdirSync(out,{recursive:true});const rows=[],errors=[];
for(const [name,base] of [['current','https://inzicht.taalroute.nl'],['staging','https://klink-inzicht-pr8-staging.nico-554.workers.dev']])for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1280,390])for(let repeat=0;repeat<Number(process.env.KLINK_LOGIN_REPEATS||3);repeat++){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push({name,engine,message:e.message}));
  for(const visit of ['cold','warm']){
   const responses=[];
   const record=response=>{const path=new URL(response.url()).pathname;if(path==='/'||path==='/inzicht'||path==='/api/inzicht/me'||path==='/api/session'){const h=response.headers();responses.push({path,status:response.status(),ray:h['cf-ray']??null,serverTiming:h['server-timing']??null,cacheControl:h['cache-control']??null});}};p.on('response',record);
   await p.goto(base+(name==='current'?'/':'/inzicht'),{waitUntil:'domcontentloaded'});await p.locator('input[type="password"]').waitFor();
   p.off('response',record);
   rows.push({name,engine,width,repeat,visit,responses,readyMs:await p.evaluate(()=>performance.now()),timing:await p.evaluate(()=>({navigation:performance.getEntriesByType('navigation').map(n=>({ttfb:n.responseStart,duration:n.duration,dns:n.domainLookupEnd-n.domainLookupStart,connect:n.connectEnd-n.connectStart,request:n.responseStart-n.requestStart,body:n.responseEnd-n.responseStart,serverTiming:n.serverTiming.map(t=>({name:t.name,duration:t.duration}))})),resources:performance.getEntriesByType('resource').map(r=>({path:new URL(r.name).pathname,start:r.startTime,duration:r.duration,transfer:r.transferSize,decoded:r.decodedBodySize,serverTiming:r.serverTiming.map(t=>({name:t.name,duration:t.duration}))}))}))});
   writeFileSync(out+'/measurements.json',JSON.stringify({measuredAt:new Date().toISOString(),method:'Public anonymous login only; no credentials, form submission, MFA, protected reports or data writes; cold/warm browser cache does not prove a cold Worker',rows,errors},null,2));
  }await c.close();
 }}finally{await b.close();}
}
assert.deepEqual(errors,[]);console.log('PASS',rows.length,'read-only public login measurements');
