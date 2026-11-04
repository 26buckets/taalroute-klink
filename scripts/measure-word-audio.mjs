import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,webkit} from 'playwright';
const base=process.env.KLINK_TEST_URL||'http://127.0.0.1:19120';
const out=process.env.KLINK_AUDIO_PERF_OUTPUT||'docs/performance-20261102/audio-before';mkdirSync(out,{recursive:true});
const index=JSON.parse(readFileSync('data/klink-word-listening.json'));
const packed=Object.entries(index).filter(([word,sources])=>/^[a-z]{4,}$/.test(word)&&typeof sources[0]==='object');
const seed=process.env.KLINK_AUDIO_PERF_WORD ? packed.find(([word])=>word===process.env.KLINK_AUDIO_PERF_WORD) : packed[0];
assert(seed,'Requested audio fixture must exist on the current content basis');
const src=seed[1][0].src,words=packed.filter(([,sources])=>sources[0].src===src).slice(0,2).map(([word])=>word);
assert.equal(words.length,2);const body=readFileSync('public'+src),rows=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1280,390])for(let repeat=0;repeat<3;repeat++){
  const c=await b.newContext({viewport:{width,height:900},hasTouch:width===390,reducedMotion:'reduce'}),p=await c.newPage();let requests=0,bytes=0;
  p.on('pageerror',e=>errors.push(e.message));
  // Reproduce the verified production HTTP200 fallback with a fixed 100ms response delay.
  await p.route('**'+src,async r=>{requests++;bytes+=body.length;await new Promise(resolve=>setTimeout(resolve,100));await r.fulfill({status:200,contentType:'application/octet-stream',body});});
  await p.addInitScript(()=>{window.audioStarts=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){this.addEventListener('playing',()=>{if(this.dataset.klinkSource)window.audioStarts.push({key:this.dataset.klinkSource,at:performance.now()})},{once:true});return play.call(this)};});
  await p.goto(base+'/#learner',{waitUntil:'domcontentloaded'});await p.locator('.learner-app').waitFor();
  await p.locator('.learner-app').evaluate((el,words)=>{const p=document.createElement('p');p.id='audio-performance-fixture';p.textContent=words.join(' ');el.prepend(p)},words);
  const plays=[];
  for(const word of [words[0],words[1],words[0]]){
   const point=await p.locator('#audio-performance-fixture').evaluate((el,word)=>{const range=document.createRange(),at=el.firstChild.textContent.indexOf(word);range.setStart(el.firstChild,at);range.setEnd(el.firstChild,at+word.length);const r=range.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}},word);
   const before=await p.evaluate(()=>window.audioStarts.length),start=await p.evaluate(()=>performance.now());
   await p.mouse.click(point.x,point.y);
   await p.waitForFunction(n=>window.audioStarts.length>n,before);
   const recorded=await p.evaluate(()=>window.audioStarts.at(-1));const source=index[word][0];assert.equal(recorded.key,`${src}#bytes=${source.offset},${source.length}`);
   plays.push({word,startMs:recorded.at-start,requests,bytes});
  }
  rows.push({engine,width,repeat,plays,requests,bytes});await c.close();
  writeFileSync(out+'/measurements.json',JSON.stringify({base,model:'Actual unchanged audio; forced HTTP200 fallback, fixed100ms response delay, no bandwidth/CPU emulation; real native playing event',src,bundleBytes:body.length,clips:words.map(word=>{const r=index[word][0];return {word,format:body.subarray(r.offset,r.offset+4).toString()==='RIFF'?'WAV':'MP3'};}),rows,errors},null,2));
 }}finally{await b.close();}
}
assert.deepEqual(errors,[]);console.log('PASS',rows.length,'native audio sessions');
