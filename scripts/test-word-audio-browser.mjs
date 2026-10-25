import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { allPackageWords } from '../lib/package-content.ts';

const base=process.env.KLINK_TEST_URL ?? 'http://127.0.0.1:18878';
const folder=process.env.KLINK_AUDIO_CHECK_OUT ?? 'outputs/wordaudio/browser-local';
mkdirSync(folder,{recursive:true});
assert.equal(allPackageWords.length,5127);assert(allPackageWords.every(word=>word.audio));
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--autoplay-policy=no-user-gesture-required','--mute-audio']});
const results=[],errors=[];let next=0;
try {
  const pages=await Promise.all(Array.from({length:4},()=>browser.newPage()));
  await Promise.all(pages.map(page=>page.goto(`${base}/release.json`)));
  await Promise.all(pages.map(async page=>{
    while(next<allPackageWords.length){
      const word=allPackageWords[next++];
      for(let attempt=1;attempt<=2;attempt++){
        try {
          const played=await page.evaluate(async source=>{
            const audio=new Audio(source);audio.muted=true;audio.playbackRate=8;
            return await new Promise((resolve,reject)=>{
              let started=false;
              const cleanup=()=>{clearTimeout(timer);audio.onended=audio.onerror=audio.onplaying=null;audio.pause();audio.removeAttribute('src');audio.load();};
              const timer=setTimeout(()=>{cleanup();reject(Error('Playback timed out'));},15000);
              audio.onplaying=()=>{started=true;};
              audio.onended=()=>{const result={started,ended:true,duration:audio.duration,currentTime:audio.currentTime};cleanup();resolve(result);};
              audio.onerror=()=>{const message=audio.error?.message??`Media error ${audio.error?.code}`;cleanup();reject(Error(message));};
              audio.play().catch(error=>{cleanup();reject(error);});
            });
          },`${base}${word.audio}`);
          assert(played.started&&played.ended&&Number.isFinite(played.duration)&&played.duration>0&&played.currentTime>=played.duration-.1);
          results.push({id:word.id,word:word.word,src:word.audio,attempt,...played});
          if(results.length%100===0)console.log(JSON.stringify({played:results.length,total:5127}));
          break;
        }catch(error){if(attempt===2)errors.push({id:word.id,word:word.word,src:word.audio,error:String(error)});}
      }
    }
  }));
}finally{await browser.close();}
const manifestSha256=createHash('sha256').update(readFileSync('docs/klink-wordaudio-publication-20261025/audio-manifest.json')).digest('hex');
writeFileSync(`${folder}/all-word-playback.json`,JSON.stringify({base,totalWordCards:5127,played:results.length,playbackRate:8,muted:true,nativeMediaPlayback:true,method:'Every word source loaded and played to its native ended event; accelerated technical check, no human pronunciation claim.',wordAudioManifestSha256:manifestSha256,errors,files:results},null,2)+'\n');
console.log(JSON.stringify({base,played:results.length,errors:errors.length}));
assert.equal(errors.length,0);assert.equal(results.length,5127);
