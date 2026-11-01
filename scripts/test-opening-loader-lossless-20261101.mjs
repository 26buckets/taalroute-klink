import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
import {chromium,webkit} from 'playwright';
const folder='docs/opening-loader-lossless-20261101/local/';mkdirSync(folder,{recursive:true});
const original=execFileSync('git',['show','6838c678d794469cd7a438a00f7e8e01a19ebf77:public/opening-loader-quick-20261101/klink-loader.svg'],{maxBuffer:2e6}).toString(),optimized=readFileSync('public/opening-loader-quick-20261101/klink-loader.svg','utf8');
const layers=s=>[...s.matchAll(/data:image\/png;base64,([^"]+)/g)].map(m=>Buffer.from(m[1],'base64'));
const originalLayers=layers(original),optimizedLayers=layers(optimized);assert.equal(originalLayers.length,3);assert.equal(optimizedLayers.length,3);
const result={imageLayers:[],timelines:[],browserFrames:[],errors:[]};
for(let i=0;i<3;i++){
 const a=await sharp(originalLayers[i]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const b=await sharp(optimizedLayers[i]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.deepEqual(a.info,b.info);assert(a.data.equals(b.data),'Every RGBA byte, including transparent pixels, must match');
 result.imageLayers.push({layer:i,width:a.info.width,height:a.info.height,rgbaBytes:a.data.length,pixelIdentical:true});
}
const frames=svg=>Object.fromEntries([...svg.matchAll(/@keyframes ([\w-]+)\{((?:[^{}]|\{[^{}]*\})*)\}/g)].map(m=>[m[1],[...m[2].matchAll(/([\d.]+)%\{([^{}]*)\}/g)].map(f=>[+f[1],f[2]])]));
const old=frames(original),next=frames(optimized);
function interpolate(fs,t){let left=fs[0],right=fs.at(-1);for(const f of fs){if(f[0]<=t)left=f;if(f[0]>t){right=f;break;}}const a=[...left[1].matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>+m[0]),b=[...right[1].matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>+m[0]);return a.map((v,i)=>v+(b[i]-v)*(right[0]===left[0]?0:(t-left[0])/(right[0]-left[0])));}
for(const name of Object.keys(old)){
 const points=[0,100,...old[name].map(f=>f[0]),...Array.from({length:10001},(_,i)=>i/100)];
 for(const t of points){const a=interpolate(old[name],t),b=interpolate(next[name],t);assert(a.every((v,i)=>Math.abs(v-b[i])<1e-9),`${name} ${t}`);}
 result.timelines.push({name,samples:points.length,unchanged:true});
}
const remove=svg=>svg.replace(/data:image\/(?:png|webp);base64,[^"]+/g,'IMAGE').replace(/@keyframes [\w-]+\{(?:[^{}]|\{[^{}]*\})*\}/g,'KEYFRAMES');
assert.equal(remove(original),remove(optimized),'Markup, image geometry, styles, duration and reduced-motion rules unchanged');
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();try{
  const page=await browser.newPage({viewport:{width:1000,height:700}});page.on('pageerror',e=>result.errors.push(e.message));
  for(const width of [158,316])for(const reducedMotion of ['no-preference','reduce']){
   await page.emulateMedia({reducedMotion});
   const times=reducedMotion==='reduce'?[0,1800]:[0,1,90,180,270,360,450,540,630,720,810,900,990,1080,1170,1260,1350,1440,1530,1620,1710,1799,1800,2000];
   for(const t of times){
    const freeze=s=>s.replace('</style>',`.klink-dot,.klink-curl{animation-play-state:paused!important;animation-delay:-${t}ms!important}</style>`);
    await page.setContent('<body style="margin:0;background:#edf1ee;display:flex;gap:10px"><img id="a"><img id="b">');
    await page.evaluate(async({a,b,width})=>{for(const[id,svg]of[['a',a],['b',b]]){const img=document.getElementById(id);img.width=width;img.src='data:image/svg+xml;base64,'+svg;await img.decode();}}, {a:Buffer.from(freeze(original)).toString('base64'),b:Buffer.from(freeze(optimized)).toString('base64'),width});
    const a=await sharp(await page.locator('#a').screenshot()).ensureAlpha().raw().toBuffer(),b=await sharp(await page.locator('#b').screenshot()).ensureAlpha().raw().toBuffer();
    assert(a.equals(b),`Rendered pixels differ: ${engine}, width ${width}, ${reducedMotion}, time ${t}`);
    result.browserFrames.push({engine,width,reducedMotion,timeMs:t,pixelIdentical:true});
   }
  }
 }finally{await browser.close();writeFileSync(folder+'equivalence.json',JSON.stringify(result,null,2)+'\n');}
}
assert.deepEqual(result.errors,[]);console.log(JSON.stringify({layers:result.imageLayers.length,timelineSamples:result.timelines.reduce((n,x)=>n+x.samples,0),browserFrames:result.browserFrames.length,allPixelIdentical:true}));
