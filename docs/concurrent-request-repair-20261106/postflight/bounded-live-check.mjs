import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const base='https://klink.taalroute.nl',out='outputs/timeout-publication-20261106/live';mkdirSync(out,{recursive:true});
assert.match(process.env.KLINK_EXPECT_COMMIT||'',/^[a-f0-9]{40}$/);
const release=await(await fetch(base+'/release.json',{signal:AbortSignal.timeout(15000)})).json();assert.equal(release.sourceCommit,process.env.KLINK_EXPECT_COMMIT);assert(release.sourceClean);assert.equal(release.branch,'main');
const api=JSON.parse(readFileSync('data/klink-grammar-aa-assets.json')),delivery=JSON.parse(readFileSync('data/klink-practice-delivery.json'));
const jobs=Array.from({length:3},()=>Object.entries(api).flatMap(([name,a])=>['GET','HEAD','range','cached'].map(mode=>({path:'/api/grammar-aa-assets/'+name,expected:Buffer.from(a.body,'base64'),etag:'"'+a.sha256+'"',mode})))).flat();
for(const path of Object.keys(delivery).slice(0,12))jobs.push({path,expected:readFileSync('public'+path),mode:'GET'});
let next=0;const checks=[],errors=[];
await Promise.all(Array.from({length:6},async()=>{while(next<jobs.length){const job=jobs[next++],start=performance.now(),headers={'Accept-Encoding':'identity','Connection':'close'};
 if(job.mode==='range')headers.Range='bytes=0-31';if(job.mode==='cached')headers['If-None-Match']=job.etag;
 try{const response=await fetch(base+job.path,{method:job.mode==='HEAD'?'HEAD':'GET',headers,signal:AbortSignal.timeout(15000)});assert.equal(response.status,job.mode==='range'?206:job.mode==='cached'?304:200);assert(!response.headers.get('Vary')?.includes('RSC'));
 const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,['HEAD','cached'].includes(job.mode)?Buffer.alloc(0):job.mode==='range'?job.expected.subarray(0,32):job.expected);if(job.etag)assert.equal(response.headers.get('ETag'),job.etag);if(job.mode==='HEAD')assert.equal(Number(response.headers.get('Content-Length')),job.expected.length);
 checks.push({path:job.path,mode:job.mode,ms:performance.now()-start});}catch(e){errors.push({path:job.path,mode:job.mode,error:e.message});}
}}));
const times=checks.map(x=>x.ms).sort((a,b)=>a-b);writeFileSync(out+'/concurrency.json',JSON.stringify({base,release,concurrency:6,expected:jobs.length,completed:checks.length,errors,p95ms:times[Math.floor(times.length*.95)],maxMs:times.at(-1),checks},null,2)+'\n');assert.deepEqual(errors,[]);assert.equal(checks.length,jobs.length);console.log('PASS',checks.length,'bounded live requests, six simultaneous connections.');
