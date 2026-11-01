import assert from 'node:assert/strict';
import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
import{chromium}from'playwright';
const before=JSON.parse(readFileSync('/tmp/klink-goals-live-before.json')),base='https://klink.taalroute.nl';
const browser=await chromium.launch();try{const page=await browser.newPage();await page.goto(base+'/release.json');const release=JSON.parse(await page.locator('body').innerText());assert.equal(release.sourceCommit,'1fb7c126cc642aa9230652a11c60fe3b2ab3c065');assert(release.sourceClean&&release.branch==='main');for(const key of Object.keys(before).filter(k=>k.endsWith('Sha256')||k==='curriculumEdition'))assert.equal(release[key],before[key],key);
 const bindings=JSON.parse(readFileSync('data/klink-word-use-audio.json'));const paths=['/package-audio/reading-rounds-20261031/a1-t01.wav',Object.values(bindings)[0].src];const samples=[];
 for(const path of paths){const offered=await page.evaluate(async path=>{const r=await fetch(path);const b=await r.arrayBuffer();return{status:r.status,bytes:b.byteLength,sha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(v=>v.toString(16).padStart(2,'0')).join('')};},path);const local=readFileSync('public'+path);assert.equal(offered.status,200);assert.equal(offered.bytes,local.length);assert.equal(offered.sha256,createHash('sha256').update(local).digest('hex'));samples.push({path,...offered,byteIdentical:true});}
 writeFileSync('outputs/learning-goals-20261101/online-media.json',JSON.stringify({release,allContentFingerprintsPreserved:true,samples},null,2)+'\n');console.log('PASS current clean source, all content fingerprints, two byte-identical audio files');
}finally{await browser.close();}
