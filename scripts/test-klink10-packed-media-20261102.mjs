import test from 'node:test';
import assert from 'node:assert/strict';
import {playMedia,stopMedia} from '../lib/media-player.ts';
import {fetchWordRecording} from '../lib/word-listening.ts';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('Packed lesson clips retain exact bytes, playback completion, cancellation and object URL cleanup',async()=>{
 const old={Audio:globalThis.Audio,fetch:globalThis.fetch,create:URL.createObjectURL.bind(URL),revoke:URL.revokeObjectURL.bind(URL)};
 let audio,serial=0;const blobs=[],revoked=[];
 globalThis.Audio=class extends EventTarget{dataset={};constructor(){super();audio=this;}play(){this.paused=false;return Promise.resolve();}pause(){this.paused=true;}};
 URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:test-'+(++serial);};URL.revokeObjectURL=url=>revoked.push(url);
 const bytes=Buffer.from('ID3complete-lesson-recording'),src='/package-audio/klink10-listening-20261102/audio-0123456789abcdef.bin',key=src+'#bytes=12,'+bytes.length;
 globalThis.fetch=async()=>new Response(Buffer.concat([Buffer.alloc(12),bytes]));
 try{
  let settled=false;const playing=playMedia(key,{waitUntilEnd:true}).then(value=>{settled=true;return value;});await tick();await tick();
  assert.equal(audio.dataset.klinkSource,key);assert.equal(audio.dataset.wordListening,'false');assert.equal(settled,false);assert.deepEqual(Buffer.from(await blobs[0].arrayBuffer()),bytes);
  audio.dispatchEvent(new Event('ended'));assert.equal(await playing,true);assert.deepEqual(revoked,['blob:test-1']);
  assert.equal(await playMedia(key),true);assert.equal(audio.paused,false);assert.equal(revoked.length,1);stopMedia();assert.equal(audio.paused,true);assert.equal(revoked.length,2);
  let signal;globalThis.fetch=async(_url,options)=>new Promise((_resolve,reject)=>{signal=options.signal;signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
  const uncachedKey=key.replace('0123456789abcdef','fedcba9876543210');
  const pending=playMedia(uncachedKey,{waitUntilEnd:true});await tick();await playMedia('/next.mp3');assert(signal.aborted);assert.equal(await pending,false);assert.equal(audio.src,'/next.mp3');assert.equal(blobs.length,2);
  const controller=new AbortController();const aborted=playMedia(uncachedKey,{signal:controller.signal,waitUntilEnd:true});await tick();controller.abort();assert.equal(await aborted,false);assert.equal(blobs.length,2);
  let fetched=false;globalThis.fetch=async()=>{fetched=true;throw Error('Unexpected fetch');};
  await assert.rejects(playMedia(src+'#bytes=wrong'));
  for(const invalid of [{src,offset:0,length:524289},{src:'https://elsewhere.example/audio-0123456789abcdef.bin',offset:0,length:20},{src,offset:-1,length:20}])await assert.rejects(fetchWordRecording(invalid,new AbortController().signal));
  assert.equal(fetched,false);
 }finally{stopMedia();globalThis.Audio=old.Audio;globalThis.fetch=old.fetch;URL.createObjectURL=old.create;URL.revokeObjectURL=old.revoke;}
});
