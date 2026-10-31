import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { compactImageSrc } from '../lib/compact-images.ts';
import { readClassroomActive, rememberClassroomActive } from '../lib/classroom-visibility.ts';
import { restoreClassroom, saveClassroom } from '../lib/teacher-classroom.ts';

const out='docs/image-size-audit-20261031';mkdirSync(out,{recursive:true});
const assets=JSON.parse(readFileSync(out+'/assets.json')),inventory=JSON.parse(readFileSync(out+'/inventory.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
assert.equal(compactImageSrc('/unknown.webp'),'/unknown.webp');
assert.equal(compactImageSrc('https://example.org/a.webp'),'https://example.org/a.webp');
const quality=[];
for(const a of assets){
 const source=readFileSync('public'+a.src),bytes=readFileSync('public'+a.url);
 assert.equal(sha(source),a.sourceSha256);assert.equal(sha(bytes),a.sha256);assert.equal(bytes.length,a.bytes);
 assert.equal(compactImageSrc(a.src),a.url);assert(a.bytes<a.before*.9);assert(a.bytes<=98304);
 const old=await sharp(source).metadata(),next=await sharp(bytes).metadata();
 assert(Math.abs(old.width/old.height-next.width/next.height)<0.01,a.src+' aspect ratio');
 if(old.format!=='svg'){
  const original=await sharp(source).rotate().resize(next.width,next.height).flatten({background:'#fff'}).removeAlpha().raw().toBuffer();
  const compact=await sharp(bytes).flatten({background:'#fff'}).removeAlpha().raw().toBuffer();
  assert.equal(original.length,compact.length);let squared=0;for(let i=0;i<original.length;i++)squared+=(original[i]-compact[i])**2;
  const rmse=Math.sqrt(squared/original.length);assert(rmse<18,a.src+' excessive compression error '+rmse);quality.push({src:a.src,rmse});
 }
}
for(const image of inventory){const src=image.path.slice(6),target='public'+compactImageSrc(src);assert(readFileSync(target).length<=98304,src+' exceeds web image budget');}
globalThis.window={};let raw=null;
globalThis.sessionStorage={getItem:()=>raw,setItem:(_k,v)=>{raw=v;}};
for(raw of [null,'','{','null','true','[]','{}','{"active":false}','{"active":true}','{"active":0}','{"active":false,"route":"unknown","order":{}}']){
 rememberClassroomActive(false);assert.equal(readClassroomActive(),restoreClassroom(raw).active,'projection guard: '+raw);
}
sessionStorage.getItem=()=>{throw Error('storage blocked')};sessionStorage.setItem=()=>{throw Error('storage blocked')};
for(const active of [true,false]){saveClassroom({...restoreClassroom(null),active});assert.equal(readClassroomActive(),active);}
delete globalThis.window;delete globalThis.sessionStorage;
writeFileSync(out+'/checks.json',JSON.stringify({images:inventory.length,optimized:assets.length,byteBudget:98304,originalsUnchanged:true,aspectRatios:true,classroomFailClosed:true,quality},null,2));
console.log('PASS',inventory.length,'image sizes;',assets.length,'optimized; source/aspect/quality and classroom guard preserved');
