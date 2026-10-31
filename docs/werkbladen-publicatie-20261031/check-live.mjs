import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
const dir='docs/werkbladen-publicatie-20261031',base='https://klink.taalroute.nl',catalog=JSON.parse(readFileSync('data/klink-docent-worksheets.json'));
const expected=JSON.parse(readFileSync('public/release.json')),before=JSON.parse(readFileSync(dir+'/live-before.json')),views=[],files=[],errors=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
for(const [engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch();try{for(const width of [1440,390]){
 const p=await b.newPage({viewport:{width,height:900},colorScheme:width===390?'dark':'light'});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/#teacher/materials');await p.locator('.kpd-worksheet-grid').waitFor();assert.equal(await p.locator('.kpd-worksheet-lesson').count(),8);
 for(const id of ['mat','pet']){
 const lesson=catalog.find(x=>x.id===id);await p.getByRole('link',{name:lesson.title+' · Werkblad',exact:true}).click();
 for(const [round,sheet]of Object.entries(lesson.rounds)){
 await p.getByRole('link',{name:sheet.title+' · '+sheet.level,exact:true}).click();await p.waitForFunction(pdf=>document.querySelector('.kpd-worksheet-actions a[download]')?.getAttribute('href')===pdf,sheet.pdf);
 await p.locator('.kpd-worksheet-previews img').evaluateAll(xs=>Promise.all(xs.map(x=>x.decode())));
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.getByText('Antwoorden voor de docent',{exact:true}).click();assert.equal(await p.locator('.kpd-answers-print li').count(),10);
 const text=await p.locator('.kpd-answers-print').innerText();for(const a of sheet.answers)assert(text.includes(a.answer));
 await p.reload();await p.locator('.kpd-worksheet-previews').waitFor();assert.equal(await p.locator('.kpd-worksheet-rounds [aria-current]').innerText(),sheet.title+' · '+sheet.level);views.push({engine,width,id,round});
 }
 await p.getByRole('link',{name:lesson.title+' · Digibordles',exact:true}).click();await p.locator('.kpd-big-word').waitFor();assert.equal(await p.locator('.kpd-big-word').innerText(),id);
 await p.getByRole('button',{name:'Kies onderdeel',exact:true}).click();await p.getByRole('button',{name:'4 Bouwen',exact:true}).click();await p.getByRole('button',{name:'Leg '+id[0],exact:true}).click();const state=await p.evaluate(()=>sessionStorage.getItem('klink.docent.les.v1'));
 await p.getByRole('button',{name:'Werkblad',exact:true}).click();await p.locator('.kpd-worksheet-previews').waitFor();await p.screenshot({path:`${dir}/live-${engine}-${width}-${id}.png`});await p.getByRole('link',{name:'Terug naar de les',exact:true}).click();await p.locator('.kpd-stage').waitFor();assert.equal(await p.evaluate(()=>sessionStorage.getItem('klink.docent.les.v1')),state);assert.equal(await p.locator('[data-tile-slot="0"]').innerText(),id[0]);await p.getByRole('button',{name:'Lesoverzicht',exact:true}).click();await p.getByRole('button',{name:'Werkbladen',exact:true}).click();await p.locator('.kpd-worksheet-grid').waitFor();
 }
 if(engine==='chromium'&&width===1440){
  const response=await p.request.get(base+'/release.json');const release=await response.json();assert.deepEqual(release,expected);assert.equal(release.sourceClean,true);assert.equal(release.branch,'main');
  for(const k of ['curriculumEdition','lexiconExportSha256','sectionsSha256','sectionPhotosSha256','contentSha256'])assert.equal(release[k],before[k]);
  const paths=[...catalog.flatMap(x=>Object.values(x.rounds).flatMap(s=>[s.pdf,...s.previews])), '/docent-werkbladen/kpd08/docentantwoorden.pdf',...readdirSync('dist/client',{recursive:true}).filter(f=>/\.(js|css)$/.test(f)).map(f=>'/'+f)];
  let next=0;await Promise.all(Array.from({length:6},async()=>{while(next<paths.length){const path=paths[next++],r=await p.request.get(base+path);assert.equal(r.status(),200,path);const bytes=await r.body(),local=readFileSync(path.startsWith('/docent-werkbladen/')?'public'+path:'dist/client'+path);assert(bytes.equals(local),path);files.push({path,bytes:bytes.length,sha256:sha(bytes)});}}));
 }
 await p.close();
 }}finally{await b.close();}
}
assert.deepEqual(errors,[]);writeFileSync(dir+'/live-checks.json',JSON.stringify({sourceCommit:expected.sourceCommit,views,files,errors,allExact:true,unchangedContentFingerprints:true},null,2)+'\n');console.log('PASS',views.length,'live worksheet views, 8 preserved lesson returns;',files.length,'byte-identical files');
