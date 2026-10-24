import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(p,'utf8');
const attrs=s=>Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const glyphs=s=>[...s.matchAll(/<path\b[^>]+>/g)].map(m=>attrs(m[0])).filter(a=>a.id);
test('official app uses D contours, spacing and blue dot, retaining the tagline and frame',()=>{
 const dir='docs/klink-logo-d-20261024/';
 const canonical=read(dir+'canonical-d.svg'),previous=read(dir+'previous-logo.svg');
 const approval=JSON.parse(read(dir+'approval.json'));
 const expected=glyphs(canonical);assert.equal(expected.length,9);
 const tagline=s=>{const start=s.indexOf('<g id="Subtitel');return s.slice(start,s.indexOf('</g>',start)+4).replace(/\s+/g,' ').replace(/\s*\/\s*>/g,'/>').replace(/ns\d+:id=/g,'serif:id=');};
 for(const [file,hash]of Object.entries(approval.files).filter(([file])=>file.includes('klink-'))){
  const actual=read(file);assert.equal(createHash('sha256').update(actual).digest('hex'),hash);
  assert.match(actual,/viewBox="208 214 770 340"/);
  assert.equal(glyphs(actual).length,9);
  for(const path of glyphs(actual)){
   const ref=expected.find(p=>p.id===path.id);assert.equal(path.d,ref.d);
   assert.equal(path.fill,ref.fill);
   assert.equal(path.transform,`translate(${Number(ref.transform.match(/-?\d+/)[0])+15} 0)`);
  }
  assert.equal(tagline(actual),tagline(previous),'preserve the original subtitle vectors');
 }
 assert.equal(read('public/klink-logo.svg'),read('public/klink-wordmark.svg'));
});

test('browser and app icons use exact canonical D, including every exported ICO size',()=>{
 const dir='docs/klink-logo-d-20261024/';
 const approval=JSON.parse(read(dir+'approval.json'));
 for(const file of ['public/favicon.svg','public/app-icon.svg'])assert.equal(read(file),read(dir+'canonical-d.svg'));
 for(const [file,hash]of Object.entries(approval.files))assert.equal(createHash('sha256').update(readFileSync(file)).digest('hex'),hash);
 const ico=readFileSync('public/favicon.ico');assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),6);
 for(let i=0;i<6;i++){const entry=6+16*i,offset=ico.readUInt32LE(entry+12),size=ico.readUInt32LE(entry+8);assert(offset+size<=ico.length);assert.equal(ico.subarray(offset+1,offset+4).toString(),'PNG');}
});
