import assert from 'node:assert/strict';
import {test} from 'node:test';
import {fetchWordRecording} from '../lib/word-listening.ts';
const source=(id,offset=0)=>({src:`/package-audio/word-listening-20261101/words-${id.toString(16).padStart(16,'0')}.bin`,offset,length:24});
const signal=()=>new AbortController().signal;
const bundle=(size=256)=>{const b=new Uint8Array(size);b.set([73,68,51]);b.set([73,68,51],64);return b};
test('Full fallback reuses exact bytes for another word and repeat; already-aborted playback never fetches',async t=>{
 const original=fetch;t.after(()=>globalThis.fetch=original);const body=bundle();let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(body)};
 for(const offset of [0,64,0])assert.deepEqual(new Uint8Array(await (await fetchWordRecording(source(100,offset),signal())).arrayBuffer()),body.slice(offset,offset+24));
 assert.equal(calls,1);const c=new AbortController();c.abort();await assert.rejects(fetchWordRecording(source(100),c.signal),{name:'AbortError'});assert.equal(calls,1);
});
test('Eight MiB budget evicts least recently used complete bundles',async t=>{
 const original=fetch;t.after(()=>globalThis.fetch=original);const calls=new Map();
 globalThis.fetch=async url=>{calls.set(url,(calls.get(url)||0)+1);return new Response(bundle(4*1024*1024))};
 for(const id of [201,202,201,203,201,202])await fetchWordRecording(source(id),signal());
 assert.equal(calls.get(source(201).src),1);assert.equal(calls.get(source(202).src),2);assert.equal(calls.get(source(203).src),1);
});
test('Invalid and cancelled downloads cannot poison later playback',async t=>{
 const original=fetch;t.after(()=>globalThis.fetch=original);let calls=0;const c=new AbortController();
 globalThis.fetch=async()=>{calls++;return new Response('ID3short')};await assert.rejects(fetchWordRecording(source(301),signal()));
 globalThis.fetch=async()=>{calls++;return {status:200,arrayBuffer:async()=>{c.abort();return bundle().buffer}}};await assert.rejects(fetchWordRecording(source(301),c.signal),{name:'AbortError'});
 globalThis.fetch=async()=>{calls++;return new Response(bundle())};await fetchWordRecording(source(301),signal());await fetchWordRecording(source(301),signal());assert.equal(calls,3);
});
test('Partial replies still require their exact range and never masquerade as a full bundle',async t=>{
 const original=fetch;t.after(()=>globalThis.fetch=original);let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response(bundle().slice(0,24),{status:206,headers:{'Content-Range':'bytes 0-23/256'}})};
 await fetchWordRecording(source(401),signal());await assert.rejects(fetchWordRecording(source(401,64),signal()));assert.equal(calls,2);
});
