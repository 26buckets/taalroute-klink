import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=f=>readFileSync(f,'utf8'),hash=f=>createHash('sha256').update(readFileSync(f)).digest('hex');
const folder='docs/official-logo-20261101/';
const paths=s=>[...s.matchAll(/<path\b[^>]*d="([^"]+)"[^>]*>/g)].map(m=>m[1]);
void test('approved petrol logo uses master paths and retains the existing logo frames',()=>{
 const approval=JSON.parse(read(folder+'approval.json'));
 for(const[file,sha]of Object.entries(approval.files))assert.equal(hash(file),sha,file);
 for(const file of ['public/klink-logo.svg','public/klink-wordmark.svg','public/klink-wordmark-dark.svg']){
  const actual=read(file);assert.match(actual,/viewBox="208 214 770 340"/);assert.deepEqual(paths(actual),paths(read(folder+'master/klink-master.svg')));assert(!/<(?:image|text)\b/.test(actual));
 }
 assert.equal(read('public/klink-logo.svg'),read('public/klink-wordmark.svg'));
 assert.equal(read('public/klink-wordmark-dark.svg').replaceAll('#FFFFFF','#0F3B44'),read('public/klink-wordmark.svg'));
 assert.equal(read('public/taalroute-menu/klink-dark.svg').replaceAll('#FFFFFF','#0F3B44'),read('public/taalroute-menu/klink.svg'));
 assert.match(read('public/klink-wordmark.svg'),/#3C8962/);assert(!/#482c46|#0090f2/i.test(read('public/klink-wordmark.svg')));
});
void test('browser and app icons share approved K geometry and retain six valid ICO sizes',()=>{
 assert.equal(read('public/favicon.svg'),read('public/app-icon.svg'));
 const ico=readFileSync('public/favicon.ico');assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),6);
 for(let i=0;i<6;i++){const e=6+16*i,o=ico.readUInt32LE(e+12),n=ico.readUInt32LE(e+8);assert(o+n<=ico.length);assert.equal(ico.subarray(o+1,o+4).toString(),'PNG');}
});
