import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';

const calls=[], env={ASSETS:{fetch:async url=>new Response(readFileSync('public'+new URL(url).pathname))}},ctx={};
let fallback=()=>new Promise(()=>{});
globalThis[Symbol.for('klink.test.app')]= {fetch:(...args)=>{calls.push(args);return fallback(...args);},__ensureInstrumentation:()=> 'retained'};
const hook=registerHooks({resolve(specifier,context,next){
  return specifier==='vinext/server/fetch-handler'?{url:'data:text/javascript,export default globalThis[Symbol.for("klink.test.app")]',shortCircuit:true}:next(specifier,context);
}});
const {default:worker}=await import('../worker.ts');
hook.deregister();
const assets=JSON.parse(readFileSync('data/klink-grammar-aa-assets.json'));
const delivery=JSON.parse(readFileSync('data/klink-practice-delivery.json'));
const request=(path,init)=>worker.fetch(new Request('https://klink.test'+path,init),env,ctx);
async function parallel(jobs,fn){let i=0;await Promise.all(Array.from({length:24},async()=>{while(i<jobs.length)await fn(jobs[i++]);}));}

await test('Every API payload keeps exact bytes, ETags, HEAD and audio ranges while the app handler is stuck', {timeout:10000}, async()=>{
 await parallel(Object.entries(assets),async([name,a])=>{
  const path='/api/grammar-aa-assets/'+name,expected=Buffer.from(a.body,'base64'),etag='"'+a.sha256+'"';
  const full=await request(path+'?existing=1');assert.equal(full.status,200);assert.equal(full.headers.get('ETag'),etag);assert.equal(full.headers.get('Content-Type'),a.mime);assert.deepEqual(Buffer.from(await full.arrayBuffer()),expected);
  const head=await request(path,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('Content-Length'),String(expected.length));assert.equal((await head.arrayBuffer()).byteLength,0);
  assert.equal((await request(path,{headers:{'If-None-Match':etag}})).status,304);
  for(const [range,start,end]of [['bytes=0-31',0,31],['bytes=-32',expected.length-32,expected.length-1]]){
   const part=await request(path,{headers:{Range:range}});assert.equal(part.status,206);assert.equal(part.headers.get('Content-Range'),`bytes ${start}-${end}/${expected.length}`);assert.deepEqual(Buffer.from(await part.arrayBuffer()),expected.subarray(start,end+1));
  }
  const stale=await request(path,{headers:{Range:'bytes=0-31','If-Range':'"older"'}});assert.equal(stale.status,200);assert.deepEqual(Buffer.from(await stale.arrayBuffer()),expected);
  assert.equal((await request(path,{headers:{Range:`bytes=${expected.length}-`}})).status,416);
 });
 assert.equal(calls.length,0);
});
await test('All old exercise links bypass a stuck app and preserve their exact original files', {timeout:15000},async()=>{
 await parallel(Object.keys(delivery),async path=>{
  const response=await request(path+'?old=1');assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),readFileSync('public'+path));
 });
 assert.equal(calls.length,0);
});
await test('Canceled clients, errors and subsequent requests stay isolated',async()=>{
 const path='/api/grammar-aa-assets/'+Object.keys(assets)[0],controller=new AbortController();controller.abort();
 await parallel(Array(48).fill(path),async p=>{const r=await request(p,{signal:controller.signal});assert.equal(r.status,200);await r.arrayBuffer();});
 assert.equal((await request(path)).status,200);
 assert.equal((await request('/api/grammar-aa-assets/'+'0'.repeat(64)+'.mp3')).status,404);
 const old=Object.keys(delivery)[0],broken={ASSETS:{fetch:async()=>{throw new Error('asset unavailable');}}};
 const failed=await worker.fetch(new Request('https://klink.test'+old),broken,ctx);assert.equal(failed.status,503);assert.equal(failed.headers.get('Cache-Control'),'no-store');
 assert.equal((await request(old)).status,200);assert.equal((await request(old,{method:'POST'})).status,405);
 assert.equal(calls.length,0);
});
await test('All other requests retain the original app handler, request, bindings and execution context',async()=>{
 fallback=()=>new Response('delegated',{status:418});
 for(const [path,method]of [['/','GET'],['/docenten','GET'],['/api/other','GET'],['/practice-content/unknown.json','GET'],['/api/grammar-aa-assets/'+Object.keys(assets)[0],'POST'],['/api/grammar-aa-assets/'+Object.keys(assets)[0],'OPTIONS']]){
  const req=new Request('https://klink.test'+path,{method});assert.equal((await worker.fetch(req,env,ctx)).status,418);assert.deepEqual(calls.at(-1),[req,env,ctx]);
 }
 assert.equal(worker.__ensureInstrumentation(),'retained');
});
delete globalThis[Symbol.for('klink.test.app')];
