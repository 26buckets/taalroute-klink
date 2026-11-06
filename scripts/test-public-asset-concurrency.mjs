import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19128';
assert(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Stress checks are local only');
const out=process.env.KLINK_TEST_OUTPUT||'outputs/concurrent-request-repair-20261106/concurrency';mkdirSync(out,{recursive:true});
const assets=JSON.parse(readFileSync('data/klink-grammar-aa-assets.json')),delivery=JSON.parse(readFileSync('data/klink-practice-delivery.json'));
const jobs=Array.from({length:8},()=>Object.entries(assets).flatMap(([name,a])=>['GET','HEAD','range','cached'].map(mode=>({path:'/api/grammar-aa-assets/'+name,expected:Buffer.from(a.body,'base64'),etag:'"'+a.sha256+'"',mode})))).flat();
for(const path of Object.keys(delivery))jobs.push({path,expected:readFileSync('public'+path),mode:'GET'});
const checks=[],errors=[];let next=0;
try{
 await Promise.all(Array.from({length:24},async()=>{
  while(next<jobs.length){const job=jobs[next++],start=performance.now(),headers={'Accept-Encoding':'identity','Connection':'close'};
   if(job.mode==='range')headers.Range='bytes=0-31';if(job.mode==='cached')headers['If-None-Match']=job.etag;
   try{
    const response=await fetch(base+job.path,{headers,method:job.mode==='HEAD'?'HEAD':'GET',signal:AbortSignal.timeout(5000)});
    assert.equal(response.status,job.mode==='range'?206:job.mode==='cached'?304:200);
    assert(!response.headers.get('Vary')?.includes('RSC'),'Immutable assets must bypass the app response pipeline');
    const bytes=Buffer.from(await response.arrayBuffer()),expected=['HEAD','cached'].includes(job.mode)?Buffer.alloc(0):job.mode==='range'?job.expected.subarray(0,32):job.expected;
    assert.deepEqual(bytes,expected,job.path);if(job.mode==='HEAD')assert.equal(Number(response.headers.get('Content-Length')),job.expected.length);
    if(job.etag)assert.equal(response.headers.get('ETag'),job.etag);
    checks.push({path:job.path,mode:job.mode,ms:performance.now()-start});
   }catch(e){errors.push({path:job.path,mode:job.mode,error:e.message});}
  }
 }));
 const path=Object.keys(delivery)[0];
 const canceled=await Promise.all(Array.from({length:48},async()=>{const c=new AbortController(),timer=setTimeout(()=>c.abort(),1);try{const r=await fetch(base+path,{signal:c.signal});await r.arrayBuffer();return 'completed';}catch(e){assert.equal(e.name,'AbortError');return 'aborted';}finally{clearTimeout(timer);}}));
 for(let i=0;i<24;i++){const response=await fetch(base+path,{signal:AbortSignal.timeout(5000)});assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),readFileSync('public'+path));}
 const sorted=checks.map(c=>c.ms).sort((a,b)=>a-b);
 writeFileSync(out+'/summary.json',JSON.stringify({base,concurrency:24,expected:jobs.length,completed:checks.length,errors,canceled:canceled.filter(x=>x==='aborted').length,afterCancellation:24,p95ms:sorted[Math.floor(sorted.length*.95)],maxMs:sorted.at(-1)},null,2)+'\n');
 assert.deepEqual(errors,[]);assert.equal(checks.length,jobs.length);console.log(`PASS ${checks.length} requests on 24 connections, 48 cancellation attempts, 24 recovery requests.`);
}finally{writeFileSync(out+'/requests.json',JSON.stringify({checks,errors},null,2)+'\n');}
