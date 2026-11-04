import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base='http://127.0.0.1:19130',out='docs/performance-20261102/inzicht-baseline';
const {token}=JSON.parse(readFileSync('work/inzicht-perf-session.json'));
mkdirSync(out,{recursive:true});const rows=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1280,390])for(let repeat=0;repeat<3;repeat++){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await c.addCookies([{name:'inzicht_session',value:token,domain:'127.0.0.1',path:'/api/inzicht',httpOnly:true,sameSite:'Strict'}]);
  const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  for(const visit of ['cold','warm']){
   const api=[];const track=request=>{if(new URL(request.url()).pathname.startsWith('/api/inzicht/'))api.push(new URL(request.url()).pathname)};p.on('request',track);
   await p.goto(base+'/inzicht/klassen/school-a:klas/matrix?school=school-a',{waitUntil:'domcontentloaded'});
   await p.locator('.ki-table tbody tr').last().waitFor();const readyMs=await p.evaluate(()=>performance.now());
   assert.equal(await p.locator('.ki-table tbody tr').count(),12);
   const start=performance.now();await p.locator('.ki-table tbody tr').first().getByRole('link').first().click();await p.getByRole('heading',{name:'Waarom?',exact:true}).waitFor();
   const nextMs=performance.now()-start;
   const resources=await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,transfer:r.transferSize,duration:r.duration})));
   p.off('request',track);rows.push({engine,width,repeat,visit,readyMs,nextMs,api,resources});
   if(!repeat&&visit==='cold')await p.screenshot({path:`${out}/${engine}-${width}.png`});
   writeFileSync(out+'/measurements.json',JSON.stringify({base,fixture:'PR8 fixtures.mjs: two fictitious schools, 12 learners per school; seeded local session; excludes login/MFA and cloud latency',rows,errors},null,2));
  }await c.close();
 }}finally{await b.close();}
}
assert.deepEqual(errors,[]);console.log('PASS',rows.length,'local authenticated Inzicht matrix measurements');
