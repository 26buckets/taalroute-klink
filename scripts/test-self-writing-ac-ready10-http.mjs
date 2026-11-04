import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='docs/self-writing-ac-ready10-20261104/',m=JSON.parse(readFileSync(root+'manifest.json')),base=process.env.KLINK_TEST_BASE||'http://127.0.0.1:19109',checks=[];
const expected=readFileSync(root+'source-bank.json'),src=m.row.url,headers={'Accept-Encoding':'identity'};
const response=await fetch(base+src,{headers}),etag=response.headers.get('etag');assert.equal(response.status,200);assert(Buffer.from(await response.arrayBuffer()).equals(expected));assert(etag);checks.push({src,case:'GET',bytes:expected.length});
const head=await fetch(base+src,{method:'HEAD',headers});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);assert.equal(head.headers.get('etag'),etag);checks.push({src,case:'HEAD'});
assert.equal((await fetch(base+src,{headers:{...headers,'If-None-Match':etag}})).status,304);checks.push({src,case:'ETag304'});
const range=await fetch(base+src,{headers:{...headers,Range:'bytes=0-31'}});assert.equal(range.status,206);assert(Buffer.from(await range.arrayBuffer()).equals(expected.subarray(0,32)));checks.push({src,case:'Range206'});
assert.equal((await fetch(base+src,{headers:{...headers,Range:`bytes=${expected.length}-`}})).status,416);checks.push({src,case:'Range416'});
assert.equal((await fetch(base+'/api/grammar-aa-assets/'+ '0'.repeat(64)+'.json')).status,404);checks.push({case:'missing404'});
for(const clip of JSON.parse(readFileSync(root+'audio-preservation.json')).clips){
 const match=clip.src.match(/^(.+)#bytes=(\d+),(\d+)$/),offset=+match[2],length=+match[3];
 const r=await fetch(base+match[1],{headers:{...headers,Range:`bytes=${offset}-${offset+length-1}`}});assert([200,206].includes(r.status));let bytes=Buffer.from(await r.arrayBuffer());if(r.status===200)bytes=bytes.subarray(offset,offset+length);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),clip.sha256);assert(bytes.equals(readFileSync(clip.file)));checks.push({src:clip.src,case:'exactOriginalInstruction',bytes:length,sha256:clip.sha256,status:r.status});
}
writeFileSync(process.env.KLINK_HTTP_OUTPUT||root+'http.json',JSON.stringify({base,checks,exactBankAndInstructionBytes:true},null,2)+'\n');console.log('Nine HTTP and exact payload checks passed.');
