import test from 'node:test';
import assert from 'node:assert/strict';
import {getSlowAudio,setSlowAudio,subscribeSlowAudio,applyDefaultAudioRate,playMedia,stopMedia,SLOW_AUDIO_RATE} from '../lib/media-player.ts';

test('Session tempo changes active and later audio without restarting; restores each original rate and survives denied storage',async()=>{
 const original={Audio:globalThis.Audio,window:globalThis.window,document:globalThis.document,storage:globalThis.sessionStorage};
 const stored=new Map();let audio,starts=0,notifications=0;
 const recording={};globalThis.window=new EventTarget();
 globalThis.sessionStorage={getItem:key=>stored.get(key)??null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)};
 globalThis.document={querySelectorAll:()=>[recording]}; // oxlint-disable-line typescript/no-deprecated -- Minimal DOM test double, not a deprecated browser API.
 globalThis.Audio=class extends EventTarget{constructor(){super();audio=this;}play(){starts++;return Promise.resolve();}pause(){}};
 const unsubscribe=subscribeSlowAudio(()=>notifications++);
 try{
  assert.equal(getSlowAudio(),false);applyDefaultAudioRate(recording);
  const pending=playMedia('/turn-one.mp3',{waitUntilEnd:true});audio.currentTime=2;
  setSlowAudio(true);assert(getSlowAudio());assert.equal(stored.get('klink.slow-audio.v1'),'true');
  assert.equal(audio.playbackRate,SLOW_AUDIO_RATE);assert.equal(audio.currentTime,2);assert.equal(starts,1);
  assert.equal(recording.playbackRate,SLOW_AUDIO_RATE);assert.equal(audio.preservesPitch,true);
  audio.dispatchEvent(new Event('ended'));assert.equal(await pending,true);
  await playMedia('/turn-two.mp3');assert.equal(audio.playbackRate,SLOW_AUDIO_RATE);
  await playMedia('/sound.mp3',{playbackRate:1});assert.equal(audio.playbackRate,SLOW_AUDIO_RATE);
  setSlowAudio(false);assert.equal(audio.playbackRate,1);assert.equal(recording.playbackRate,.85);assert.equal(stored.size,0);
  await playMedia('/word.mp3');assert.equal(audio.playbackRate,.85);
  globalThis.sessionStorage={getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};
  setSlowAudio(true);assert(getSlowAudio());assert.equal(audio.playbackRate,SLOW_AUDIO_RATE);
  setSlowAudio(false);assert(!getSlowAudio());assert.equal(notifications,4);
  unsubscribe();setSlowAudio(false);assert.equal(notifications,4);
 }finally{stopMedia();unsubscribe();globalThis.Audio=original.Audio;globalThis.window=original.window;globalThis.document=original.document;globalThis.sessionStorage=original.storage;}
});
