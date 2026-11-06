import assert from 'node:assert/strict';
import{mkdirSync,writeFileSync}from'node:fs';
import{chromium,webkit}from'playwright';
import sharp from'sharp';
const out='docs/hear-type-focus-20261105/local/appearance';mkdirSync(out,{recursive:true});const checks=[];
const hash='/#learner/chapters/writing/dictation/production%3Adictation%3Aa1%3Aspelling-396-20261104-1?level=a1&help=practice';
for(const[engine,kind]of Object.entries({chromium,webkit})){
 const b=await kind.launch(engine==='chromium'?{channel:'chrome'}:{});try{for(const width of[1280,390])for(const colorScheme of['light','dark']){
 const pair=[];for(const[side,base]of[['live','https://klink.taalroute.nl'],['local','http://127.0.0.1:19206']]){
 const c=await b.newContext({viewport:{width,height:844},colorScheme});await c.addInitScript(theme=>localStorage.setItem('taalroute-klink-appearance-v1',theme),colorScheme);await c.addInitScript(()=>{window.Audio=class extends EventTarget{constructor(){super();this.dataset={};}play(){this.timer=setTimeout(()=>this.dispatchEvent(new Event('ended')),20);return Promise.resolve();}pause(){clearTimeout(this.timer);}};});const p=await c.newPage();await p.goto(base+hash);const task=p.locator('[data-exercise-id]');const input=task.getByRole('textbox',{name:'Jouw antwoord'});await task.locator('.cp-exercise-listen').click();await p.waitForFunction(()=>document.querySelector('.cp-text-entry input')?.disabled===false);await input.focus();await p.evaluate(()=>document.fonts.ready);
 assert.equal(await p.locator('[data-theme="dark"]').count()>0,colorScheme==='dark');const geometry=await task.evaluate(el=>Array.from(el.querySelectorAll('h3,input,button,.cp-task-card,.cp-exercise-feedback')).map(x=>{const r=x.getBoundingClientRect();return{tag:x.tagName,label:x.getAttribute('aria-label'),x:r.x,y:r.y,width:r.width,height:r.height};}));const file=out+'/'+engine+'-'+width+'-'+colorScheme+'-'+side+'.png';await task.screenshot({path:file,caret:'hide',animations:'disabled'});pair.push({file,geometry});await c.close();}
 assert.deepEqual(pair[0].geometry,pair[1].geometry);const a=await sharp(pair[0].file).ensureAlpha().raw().toBuffer(),z=await sharp(pair[1].file).ensureAlpha().raw().toBuffer();assert.equal(a.length,z.length);let changedPixels=0;for(let i=0;i<a.length;i+=4)if([0,1,2].some(c=>Math.abs(a[i+c]-z[i+c])>10))changedPixels++;assert.equal(changedPixels,0);checks.push({engine,width,colorScheme,geometryEqual:true,changedPixels});
 }}finally{await b.close();}
}writeFileSync(out+'/checks.json',JSON.stringify({checks},null,2)+'\n');console.log('8 desktop/mobile light/dark appearance comparisons unchanged.');
